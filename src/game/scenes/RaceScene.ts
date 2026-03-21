import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';

interface Line {
    x: number;
    y: number;
    z: number;
    w: number; // width
    curve: number;
    scale: number;
    screenX: number;
    screenY: number;
    screenWidth: number;
}

export class RaceScene extends Scene {
    private playerVehicle!: Phaser.GameObjects.Sprite;
    private speedText!: Phaser.GameObjects.Text;
    
    // Road variables
    private roadLines: Line[] = [];
    private trackLength = 0;
    private position = 0;
    private playerX = 0;
    private speed = 0;
    private maxSpeed = 1000;
    private accel = 5;
    private breaking = -10;
    private decel = -2;
    private offRoadDecel = -10;

    // Rendering constants
    private roadWidth = 2000;
    private segmentLength = 200;
    private drawDistance = 200;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('RaceScene');
    }

    create() {
        // Setup road
        this.initRoad();

        // Player vehicle
        this.playerVehicle = this.add.sprite(this.scale.width / 2, this.scale.height - 100, 'vehicles', 'rear_r00_c00');
        this.playerVehicle.setScale(4);
        this.playerVehicle.setDepth(1000);

        // Controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // HUD
        this.speedText = this.add.text(this.scale.width - 200, this.scale.height - 50, '0 KPH', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            color: '#ffff00'
        }).setDepth(2000);

        EventBus.emit('current-scene-ready', this);
    }

    private initRoad() {
        for (let i = 0; i < 5000; i++) {
            const line: Line = {
                x: 0,
                y: 0,
                z: i * this.segmentLength,
                w: this.roadWidth,
                curve: 0,
                scale: 0,
                screenX: 0,
                screenY: 0,
                screenWidth: 0
            };

            // Basic curve generation for testing
            if (i > 300 && i < 700) line.curve = 0.5;
            if (i > 1100 && i < 1500) line.curve = -0.7;

            this.roadLines.push(line);
        }
        this.trackLength = this.roadLines.length * this.segmentLength;
    }

    update() {
        this.handleInput();
        this.updatePosition();
        this.renderRoad();
        
        this.speedText.setText(`${Math.floor(this.speed)} KPH`);
    }

    private steeringValue = 0;

    private handleInput() {
        if (!this.cursors) return;

        if (this.cursors.up.isDown) {
            this.speed += this.accel;
        } else if (this.cursors.down.isDown) {
            this.speed += this.breaking;
        } else {
            this.speed += this.decel;
        }

        const steeringStep = 0.05;
        if (this.cursors.left.isDown && this.speed > 0) {
            this.playerX -= 0.02 * (this.speed / this.maxSpeed);
            this.steeringValue = Phaser.Math.Clamp(this.steeringValue + steeringStep, 0, 1);
        } else if (this.cursors.right.isDown && this.speed > 0) {
            this.playerX += 0.02 * (this.speed / this.maxSpeed);
            this.steeringValue = Phaser.Math.Clamp(this.steeringValue - steeringStep, -1, 0);
        } else {
            if (this.steeringValue > 0) this.steeringValue = Math.max(0, this.steeringValue - steeringStep);
            if (this.steeringValue < 0) this.steeringValue = Math.min(0, this.steeringValue + steeringStep);
        }

        // Clamp speed
        this.speed = Phaser.Math.Clamp(this.speed, 0, this.maxSpeed);
        
        // Update car frame based on turn and speed
        const carColor = 'r01'; 
        
        if (this.speed > 0) {
            let frameIdx = '00';
            const absSteering = Math.abs(this.steeringValue);
            
            if (absSteering > 0.6) {
                frameIdx = '03';
            } else if (absSteering > 0.3) {
                frameIdx = '02';
            } else if (absSteering > 0.05) {
                frameIdx = '01';
            }
            
            const frameName = `rear_${carColor}_c${frameIdx}`;
            const flip = this.steeringValue > 0;

            this.playerVehicle.setFrame(frameName);
            this.playerVehicle.setFlipX(flip);
        } else {
            this.playerVehicle.setFrame(`rear_${carColor}_c00`);
            this.playerVehicle.setFlipX(false);
        }
    }

    private updatePosition() {
        this.position += this.speed;
        while (this.position >= this.trackLength) this.position -= this.trackLength;
        while (this.position < 0) this.position += this.trackLength;

        // Apply centrifugal force on curves
        const startPos = Math.floor(this.position / this.segmentLength);
        const currentLine = this.roadLines[startPos % this.roadLines.length];
        this.playerX -= (currentLine.curve * (this.speed / this.maxSpeed) * 0.04);

        // Off-road deceleration
        if (Math.abs(this.playerX) > 1.1) {
            if (this.speed > 100) this.speed += this.offRoadDecel;
        }
    }

    private renderRoad() {
        const graphics = this.children.getByName('roadGraphics') as Phaser.GameObjects.Graphics || this.add.graphics().setName('roadGraphics');
        graphics.clear();

        const startPos = Math.floor(this.position / this.segmentLength);
        let x = 0;
        let dx = 0;

        const camHeight = 1500;
        const width = this.scale.width;
        const height = this.scale.height;

        // We want to draw from back to front
        const maxDraw = Math.min(this.drawDistance, this.roadLines.length);
        
        // Redo rendering loop with proper cumulative offset
        let lastY = height;

        for (let n = startPos; n < startPos + maxDraw; n++) {
            const l = this.roadLines[n % this.roadLines.length];
            const camX = this.playerX * this.roadWidth;
            const camZ = this.position;
            const segmentZ = l.z < camZ ? l.z + this.trackLength : l.z;

            l.scale = camHeight / (segmentZ - camZ);
            l.screenX = (1 + l.scale * (x - camX)) * width / 2;
            l.screenY = (1 - l.scale * (l.y - camHeight)) * height / 2;
            l.screenWidth = l.scale * l.w * width / 2;

            if (l.screenY >= lastY) continue;

            if (n > startPos) {
                const prev = this.roadLines[(n - 1) % this.roadLines.length];
                
                const grassColor = (n / 3) % 2 ? 0x101010 : 0x000000;
                const roadColor = (n / 3) % 2 ? 0x404040 : 0x444444;
                const rumbleColor = (n / 3) % 2 ? 0xffffff : 0xff0000;

                // Draw grass
                graphics.fillStyle(grassColor);
                graphics.fillRect(0, l.screenY, width, lastY - l.screenY);

                // Draw rumble stripes
                this.drawPolygon(graphics, rumbleColor,
                    prev.screenX, lastY, prev.screenWidth * 1.1,
                    l.screenX, l.screenY, l.screenWidth * 1.1);

                // Draw road
                this.drawPolygon(graphics, roadColor,
                    prev.screenX, lastY, prev.screenWidth,
                    l.screenX, l.screenY, l.screenWidth);
                
                // Draw lane dividers
                if ((n / 3) % 2) {
                    this.drawPolygon(graphics, 0xffffff,
                        prev.screenX, lastY, prev.screenWidth * 0.02,
                        l.screenX, l.screenY, l.screenWidth * 0.02);
                }
            }

            lastY = l.screenY;
            dx += l.curve;
            x += dx;
        }
    }

    private drawPolygon(g: Phaser.GameObjects.Graphics, color: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) {
        g.fillStyle(color);
        g.beginPath();
        g.moveTo(x1 - w1, y1);
        g.lineTo(x2 - w2, y2);
        g.lineTo(x2 + w2, y2);
        g.lineTo(x1 + w1, y1);
        g.closePath();
        g.fillPath();
    }
}
