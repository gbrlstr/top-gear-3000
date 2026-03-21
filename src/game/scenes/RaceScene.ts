import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { TrackManager } from '../road/TrackManager';
import { RoadRenderer } from '../road/RoadRenderer';
import { track1 } from '../tracks/track1';

export class RaceScene extends Scene {
    private playerVehicle!: Phaser.GameObjects.Sprite;
    private speedText!: Phaser.GameObjects.Text;
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: Starfield;

    // Player variables
    private playerX = 0;
    private speed = 0;
    private maxSpeed = 3000; // Much faster
    private accel = 20;
    private breaking = -40;
    private decel = -10;
    private offRoadDecel = -30;
    private steeringValue = 0;

    // Constants
    private camHeight = 1500; // Increased to see further, but let's try a better balance
    private camDepth = 1.3;
    private roadWidth = 2000;
    private drawDistance = 300;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('RaceScene');
    }

    create() {
        // Initialize modular road system
        this.trackManager = new TrackManager(track1);

        // Background
        this.starfield = new Starfield(this);

        // Graphics for road
        this.roadGraphics = this.add.graphics().setName('roadGraphics').setDepth(10);

        // Player vehicle
        this.playerVehicle = this.add.sprite(this.scale.width / 2, this.scale.height - 100, 'vehicles', 'rear_r01_c00');
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

    update(_time: number, delta: number) {
        const dt = delta / 1000;

        this.handleInput(dt);

        this.trackManager.update(this.speed * dt);

        this.renderRoad();
        this.updatePlayerVisuals();

        this.speedText.setText(`${Math.floor(this.speed / 5)} KPH`);

        if (this.starfield) {
            this.starfield.update();
        }
    }

    private handleInput(dt: number) {
        if (!this.cursors) return;

        const accel = this.accel * 60 * dt;
        const braking = this.breaking * 60 * dt;
        const decel = this.decel * 60 * dt;
        const offRoadDecel = this.offRoadDecel * 60 * dt;

        if (this.cursors.up.isDown) {
            this.speed += accel;
        } else if (this.cursors.down.isDown) {
            this.speed += braking;
        } else {
            this.speed += decel;
        }

        const steerAmount = 1.8 * dt;
        const steerVisualStep = 3 * dt;

        if (this.cursors.left.isDown && this.speed > 0) {
            this.playerX -= steerAmount * (this.speed / this.maxSpeed);
            this.steeringValue = Phaser.Math.Clamp(this.steeringValue - steerVisualStep, -1, 1);
        } else if (this.cursors.right.isDown && this.speed > 0) {
            this.playerX += steerAmount * (this.speed / this.maxSpeed);
            this.steeringValue = Phaser.Math.Clamp(this.steeringValue + steerVisualStep, -1, 1);
        } else {
            if (this.steeringValue > 0) this.steeringValue = Math.max(0, this.steeringValue - steerVisualStep);
            if (this.steeringValue < 0) this.steeringValue = Math.min(0, this.steeringValue + steerVisualStep);
        }

        this.speed = Phaser.Math.Clamp(this.speed, 0, this.maxSpeed);

        const currentSegment =
            this.trackManager.segments[
            Math.floor(this.trackManager.position / this.trackManager.segmentLength) %
            this.trackManager.segments.length
            ];

        const centrifugal = currentSegment.curve * (this.speed / this.maxSpeed) * 0.9 * dt;
        this.playerX -= centrifugal;

        this.playerX = Phaser.Math.Clamp(this.playerX, -2, 2);

        if (Math.abs(this.playerX) > 1.05 && this.speed > 100) {
            this.speed += offRoadDecel;
        }
    }

    private updatePlayerVisuals() {
        const carColor = 'r01';
        let frameIdx = '00';

        const steer = this.steeringValue;
        const absSteering = Math.abs(steer);

        if (absSteering > 0.66) {
            frameIdx = '03';
        } else if (absSteering > 0.33) {
            frameIdx = '02';
        } else if (absSteering > 0.08) {
            frameIdx = '01';
        }

        const frameName = `rear_${carColor}_c${frameIdx}`;
        this.playerVehicle.setFrame(frameName);

        const laneOffsetPixels = this.playerX * 180;
        this.playerVehicle.x = this.scale.width / 2 + laneOffsetPixels;
        this.playerVehicle.y = this.scale.height - 110;

        this.playerVehicle.setFlipX(steer < 0);
    }

    private renderRoad() {
        const baseSegmentIndex = Math.floor(this.trackManager.position / this.trackManager.segmentLength);
        const basePercent = (this.trackManager.position % this.trackManager.segmentLength) / this.trackManager.segmentLength;

        const segmentsToRender = this.trackManager.getSegmentsToRender(
            baseSegmentIndex,
            this.drawDistance
        );

        this.trackManager.projectSegments(
            segmentsToRender,
            this.playerX * (this.roadWidth * 0.5),
            this.camHeight,
            this.trackManager.position,
            this.camDepth,
            this.scale.width,
            this.scale.height,
            this.roadWidth,
            basePercent
        );

        RoadRenderer.render(
            this.roadGraphics,
            this.scale.width,
            this.scale.height * 0.35,
            segmentsToRender
        );
    }
}
