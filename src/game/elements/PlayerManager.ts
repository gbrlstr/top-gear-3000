import { Scene } from 'phaser';
import { TrackManager } from '../road/TrackManager';
import { RaceAudioManager } from '../audio/RaceAudioManager';

export class PlayerManager {
    private static readonly START_LANE_X = -0.18;
    private static readonly BROKEN_MAX_SPEED = 800; // 10 km/h no HUD
    private static readonly BOOST_DURATION_S = 1.4;
    private static readonly BOOST_SPEED_BONUS = 4200;
    private static readonly BOOST_ACCEL_BONUS = 85;

    private scene: Scene;
    public vehicle!: Phaser.GameObjects.Sprite;
    public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private boostKey?: Phaser.Input.Keyboard.Key;

    // Player state
    public x = PlayerManager.START_LANE_X;
    public speed = 0;
    public health = 100;
    public readonly maxHealth = 100;
    public fuel = 100;
    public readonly maxFuel = 100;
    public isBroken = false;
    public isOffRoad = false;
    public boostUses = 4;
    private steeringValue = 0;
    private boostTimer = 0;
    private boostWasUsed = false;

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
        this.fuel = this.maxFuel;
        this.isBroken = false;
        this.isOffRoad = false;
        this.boostUses = 4;
        this.steeringValue = 0;
        this.boostTimer = 0;
        this.boostWasUsed = false;

        // Player vehicle sprite
        this.vehicle = this.scene.add.sprite(width / 2, height - 100, 'vehicles', 'rear_r01_c00');
        this.vehicle.setDepth(1000);

        // Control input
        if (this.scene.input.keyboard) {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.boostKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
    }

    handleInput(dt: number, trackManager: TrackManager) {
        if (!this.cursors) return;

        if (!this.isBroken && this.boostKey && Phaser.Input.Keyboard.JustDown(this.boostKey)) {
            this.activateBoost();
        }

        if (this.boostTimer > 0) {
            this.boostTimer = Math.max(0, this.boostTimer - dt);
        }

        const boostActive = this.isBoostActive();
        const baseMaxSpeed = this.isBroken ? PlayerManager.BROKEN_MAX_SPEED : this.maxSpeed;
        const currentMaxSpeed = boostActive && !this.isBroken
            ? baseMaxSpeed + PlayerManager.BOOST_SPEED_BONUS
            : baseMaxSpeed;
        const speedPercent = this.speed / currentMaxSpeed;

        // PROGRESSIVE ACCELERATION:
        // Accelerates fast until 150 KM/H, then slower
        const powerMult = speedPercent < 0.5 ? 1.0 : 1.0 - (speedPercent - 0.5);
        const accelBase = this.isBroken ? this.accel * 0.35 : this.accel;
        const brakingBase = this.isBroken ? this.breaking * 0.35 : this.breaking;
        const decelBase = this.isBroken ? this.decel * 0.45 : this.decel;
        const boostAccel = boostActive && !this.isBroken ? PlayerManager.BOOST_ACCEL_BONUS : 0;
        const currentAccel = (accelBase + boostAccel) * powerMult * 60 * dt;

        const braking = brakingBase * 60 * dt;
        const decel = decelBase * 60 * dt;

        // 1. Speed Control
        const isAccelerating = this.cursors.up.isDown && (this.isBroken || this.fuel > 0);

        if (isAccelerating) {
            this.speed += currentAccel;
        } else if (this.cursors.down.isDown) {
            this.speed += braking;
        } else {
            this.speed += decel; // Natural friction
        }

        // Clamp speed logically
        this.speed = Phaser.Math.Clamp(this.speed, 0, currentMaxSpeed);

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
        this.isOffRoad = Math.abs(this.x) > 1.0;

        if (this.isOffRoad) { // Off-road
            const offRoadLimit = currentMaxSpeed * 0.3;
            if (this.speed > offRoadLimit) {
                this.speed += (this.breaking * 0.5) * 60 * dt; // Slow down fast
            }
        }

        if (!this.isBroken) {
            this.consumeFuel(dt, isAccelerating);
        }
    }

    applyDamage(amount: number, scene: Scene) {
        if (this.isBroken || amount <= 0) return;

        this.health = Math.max(0, this.health - amount);

        if (this.health <= 0) {
            this.isBroken = true;
            this.speed = Math.min(this.speed, PlayerManager.BROKEN_MAX_SPEED);
            scene.cameras.main.shake(160, 0.01);
            RaceAudioManager.fromScene(scene)?.playExplosion();
        }
    }

    repair(amount: number) {
        if (amount <= 0 || this.health >= this.maxHealth) return false;

        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.health > 0) {
            this.isBroken = false;
        }
        return true;
    }

    refuel(amount: number) {
        if (amount <= 0 || this.fuel >= this.maxFuel) return false;

        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
        return true;
    }

    addBoostUses(amount: number) {
        if (amount <= 0) return 0;
        this.boostUses += amount;
        return this.boostUses;
    }

    isBoostActive() {
        return this.boostTimer > 0;
    }

    hasUsedBoost() {
        return this.boostWasUsed;
    }

    private activateBoost() {
        if (this.boostUses <= 0) return false;

        this.boostUses--;
        this.boostTimer = PlayerManager.BOOST_DURATION_S;
        this.boostWasUsed = true;
        this.speed = Math.max(this.speed, this.maxSpeed * 0.78);
        RaceAudioManager.fromScene(this.scene)?.playOneShotBoost();
        return true;
    }

    private consumeFuel(dt: number, isAccelerating: boolean) {
        if (this.fuel <= 0) {
            this.fuel = 0;
            return;
        }

        const speedPercent = this.speed / this.maxSpeed;
        const movingDrain = speedPercent > 0 ? 0.12 + speedPercent * 0.48 : 0;
        const accelDrain = isAccelerating ? 0.34 : 0;
        const drain = movingDrain + accelDrain;

        this.fuel = Math.max(0, this.fuel - drain * dt);
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
