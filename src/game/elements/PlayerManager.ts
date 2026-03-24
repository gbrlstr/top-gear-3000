import { Scene } from 'phaser';
import { TrackManager } from '../road/TrackManager';
import { RaceAudioManager } from '../audio/RaceAudioManager';

export class PlayerManager {
    private static readonly START_LANE_X = -0.18;

    private scene: Scene;
    public vehicle!: Phaser.GameObjects.Sprite;
    public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // Player state
    public x = PlayerManager.START_LANE_X;
    public speed = 0;
    public health = 100;
    public readonly maxHealth = 100;
    public isBroken = false;
    private steeringValue = 0;

    public readonly maxSpeed = 12000;
    private readonly accel = 35;
    private readonly breaking = -100;
    private readonly decel = -15;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    create() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Garante alinhamento central na largada.
        this.x = PlayerManager.START_LANE_X;
        this.speed = 0;
        this.health = this.maxHealth;
        this.isBroken = false;
        this.steeringValue = 0;

        // Player vehicle sprite
        this.vehicle = this.scene.add.sprite(width / 2, height - 100, 'vehicles', 'rear_r01_c00');
        this.vehicle.setDepth(1000);

        // Control input
        if (this.scene.input.keyboard) {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
        }
    }

    handleInput(dt: number, trackManager: TrackManager) {
        if (!this.cursors) return;

        if (this.isBroken) {
            this.speed = Math.max(0, this.speed - 2400 * dt);
            return;
        }

        const speedPercent = this.speed / this.maxSpeed;

        // PROGRESSIVE ACCELERATION:
        // Accelerates fast until 150 KM/H, then slower
        const powerMult = speedPercent < 0.5 ? 1.0 : 1.0 - (speedPercent - 0.5);
        const currentAccel = this.accel * powerMult * 60 * dt;

        const braking = this.breaking * 60 * dt;
        const decel = this.decel * 60 * dt;

        // 1. Speed Control
        if (this.cursors.up.isDown) {
            this.speed += currentAccel;
        } else if (this.cursors.down.isDown) {
            this.speed += braking;
        } else {
            this.speed += decel; // Natural friction
        }

        // Clamp speed logically
        this.speed = Phaser.Math.Clamp(this.speed, 0, this.maxSpeed);

        // 2. Dynamic Steering
        if (this.speed > 0) {
            // Steering sensitivity decreases at higher speeds
            const steerPower = (2.5 - (speedPercent * 1.5)) * dt;
            const steerVisualStep = 4 * dt;

            if (this.cursors.left.isDown) {
                this.x -= steerPower;
                this.steeringValue = Phaser.Math.Clamp(this.steeringValue - steerVisualStep, -1, 1);
            } else if (this.cursors.right.isDown) {
                this.x += steerPower;
                this.steeringValue = Phaser.Math.Clamp(this.steeringValue + steerVisualStep, -1, 1);
            } else {
                // Auto-center steering
                if (this.steeringValue > 0) this.steeringValue = Math.max(0, this.steeringValue - steerVisualStep);
                if (this.steeringValue < 0) this.steeringValue = Math.min(0, this.steeringValue + steerVisualStep);
            }
        }

        // 3. Centrifugal Force (Curves)
        const currentSegment = trackManager.segments[
            Math.floor(trackManager.position / trackManager.segmentLength) % trackManager.segments.length
        ];

        if (currentSegment && this.speed > 500) {
            // Force increases with the squarely of speed
            const centrifugal = currentSegment.curve * (speedPercent * speedPercent) * 0.6 * dt;
            this.x -= centrifugal;
        }

        // 4. Roadsides & Grass Penalty
        this.x = Phaser.Math.Clamp(this.x, -2, 2);

        if (Math.abs(this.x) > 1.0) { // Off-road
            const offRoadLimit = this.maxSpeed * 0.3; // Max speed on grass is 90 KM/H
            if (this.speed > offRoadLimit) {
                this.speed += (this.breaking * 0.5) * 60 * dt; // Slow down fast
            }
        }
    }

    applyDamage(amount: number, scene: Scene) {
        if (this.isBroken || amount <= 0) return;

        this.health = Math.max(0, this.health - amount);

        if (this.health <= 0) {
            this.isBroken = true;
            this.speed = 0;
            scene.cameras.main.shake(160, 0.01);
            RaceAudioManager.fromScene(scene)?.playExplosion();
        }
    }

    repair(amount: number) {
        if (this.isBroken || amount <= 0 || this.health >= this.maxHealth) return false;

        this.health = Math.min(this.maxHealth, this.health + amount);
        return true;
    }

    updateVisuals(time: number, trackManager: TrackManager, camHeight: number) {
        const carColor = 'r01';
        let frameIdx = '00';

        const steer = this.steeringValue;
        const absSteering = Math.abs(steer);

        // Change frames based on steering intensity
        if (absSteering > 0.66) frameIdx = '03';
        else if (absSteering > 0.33) frameIdx = '02';
        else if (absSteering > 0.08) frameIdx = '01';
        else if (this.speed > 0) {
            // Vibration effect at speed (flicks between frames 00 and 01)
            frameIdx = (Math.floor(time / 100) % 2 === 0) ? '00' : '01';
        }

        this.vehicle.setFrame(`rear_${carColor}_c${frameIdx}`);
        this.vehicle.setFlipX(steer < 0);

        // Postion car relative to 2D road projection
        const currentSegment = trackManager.segments[
            Math.floor(trackManager.position / trackManager.segmentLength) % trackManager.segments.length
        ];

        const roadCenterX = currentSegment?.p1.screen.x || this.scene.scale.width / 2;
        const laneOffsetPixels = this.x * (currentSegment?.p1.screen.w || 200) * 1.0;

        this.vehicle.x = roadCenterX + laneOffsetPixels;

        // Update visual Y for hills and high speed
        this.vehicle.y = (this.scene.scale.height - 120) - (this.speed / this.maxSpeed) * 10;

        // --- DYNAMIC SCALE LOGIC ---
        const h2 = this.scene.scale.height / 2;
        const screenY = this.vehicle.y;
        const projectionScale = (screenY - h2) / (camHeight * h2);

        // Apply resolution multiplication factor
        this.vehicle.setScale(projectionScale * 6000);
    }
}
