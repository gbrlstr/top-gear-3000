import { Scene } from 'phaser';
import { RaceAudioManager } from '../audio/RaceAudioManager';

export class HUDManager {
    private static readonly SPEED_BAR_FRAMES = [
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_green_1',
        'hud_speedbar_red_1',
        'hud_speedbar_red_1',
        'hud_speedbar_red_1',
        'hud_speedbar_red_1'
    ];
    private static readonly FUEL_BAR_SEGMENT_COUNT = 8;
    private static readonly SPEED_BAR_SCALE = 3;
    private static readonly SPEED_BAR_SPACING = 22;
    private static readonly FUEL_BAR_SCALE = 2.15;
    private static readonly FUEL_BAR_SEGMENT_SPACING = 9;
    private static readonly FUEL_BAR_START_Y = 28;

    private scene: Scene;

    // Graphical elements
    private speedContainer!: Phaser.GameObjects.Container;
    private lapContainer!: Phaser.GameObjects.Container;
    private posContainer!: Phaser.GameObjects.Container;
    private timeContainer!: Phaser.GameObjects.Container;
    private energyBar!: Phaser.GameObjects.Container;
    private fuelHud!: Phaser.GameObjects.Container;
    private fuelBar!: Phaser.GameObjects.Container;
    private fuelBarContainer!: Phaser.GameObjects.Sprite;
    private carLife!: Phaser.GameObjects.Container;
    private carLifeSprite!: Phaser.GameObjects.Sprite;
    private speedBarSegments: Phaser.GameObjects.Sprite[] = [];
    private fuelBarSegments: Phaser.GameObjects.Sprite[] = [];
    private trackMap!: Phaser.GameObjects.Sprite;
    private playerTracker!: Phaser.GameObjects.Sprite;
    private trackMapOffset: number = 0;
    private macroPoints: { x: number, z: number }[] = [];
    private mapBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, height: 0 };

    public countdownText!: Phaser.GameObjects.Text;
    public rechargeText!: Phaser.GameObjects.Text;
    public repairText!: Phaser.GameObjects.Text;

    private countdownTimer: number = 3;
    private currentLap: number = 1;
    private totalLaps: number = 3;
    private raceTime: number = 0;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    create(trackMapFrame: string = 'track_01', trackMapOffset: number = 0) {
        const { width, height } = this.scene.scale;
        this.trackMapOffset = trackMapOffset;

        // --- TOP LEFT: POSITION & SPEED BAR ---
        this.posContainer = this.scene.add.container(0, 16).setDepth(2000);
        // Na referencia, os números vêm antes do "POS".
        const posLabel = this.scene.add.sprite(220, 0, 'hud', 'label_pos').setOrigin(0, 0).setScale(3);
        this.posContainer.add(posLabel);
        this.updateGraphicalText(this.posContainer, '0/20', 0, 0, 3);

        // Speed Bar (below POS), estilo Top Gear.
        this.energyBar = this.scene.add.container(58, 62).setDepth(2000);
        this.speedBarSegments = [];
        for (let i = 0; i < HUDManager.SPEED_BAR_FRAMES.length; i++) {
            const segment = this.scene.add.sprite(
                i * HUDManager.SPEED_BAR_SPACING,
                0,
                'hud',
                'char_quote_double'
            ).setOrigin(0, 0).setScale(HUDManager.SPEED_BAR_SCALE);
            this.energyBar.add(segment);
            this.speedBarSegments.push(segment);
        }
        this.updateSpeedBar(0);

        this.fuelHud = this.scene.add.container(width - 74, height - 70).setDepth(2000);

        const fuelPipColor = 0x21ff35;
        const fuelPipYs = [7, 0, -7];
        fuelPipYs.forEach(y => {
            const pip = this.scene.add.rectangle(0, y, 9, 5, fuelPipColor).setOrigin(0, 0.5);
            pip.setStrokeStyle(1.5, 0x000000);
            this.fuelHud.add(pip);
        });

        const fuelBadgeBg = this.scene.add.rectangle(20, 0, 30, 22, 0xffea36).setOrigin(0, 0.5);
        fuelBadgeBg.setStrokeStyle(2.5, 0x000000);
        this.fuelHud.add(fuelBadgeBg);

        const fuelBadgeInner = this.scene.add.rectangle(24, 0, 20, 12, 0x000000).setOrigin(0, 0.5);
        this.fuelHud.add(fuelBadgeInner);

        const fuelBadgeDigit = this.scene.add.sprite(28, -7, 'hud', 'digit_3').setOrigin(0, 0).setScale(1.55);
        this.fuelHud.add(fuelBadgeDigit);

        this.fuelBar = this.scene.add.container(53, -19);
        this.fuelBarContainer = this.scene.add.sprite(0, 0, 'hud', 'bar_v_container').setOrigin(0, 0).setScale(HUDManager.FUEL_BAR_SCALE);
        this.fuelBar.add(this.fuelBarContainer);
        this.fuelBarSegments = [];
        for (let i = 0; i < HUDManager.FUEL_BAR_SEGMENT_COUNT; i++) {
            const segment = this.scene.add.sprite(0, 0, 'hud', 'misc_03').setOrigin(0, 0).setScale(HUDManager.FUEL_BAR_SCALE);
            this.fuelBar.add(segment);
            this.fuelBarSegments.push(segment);
        }
        this.fuelHud.add(this.fuelBar);
        this.updateFuel(1);

        this.carLife = this.scene.add.container(56, 92).setDepth(2000);
        this.carLifeSprite = this.scene.add.sprite(0, 0, 'hud', 'car_life').setOrigin(0, 0).setScale(3);
        this.carLife.add(this.carLifeSprite);
        this.updateCarLife(1);

        // --- TOP RIGHT: LAP & TRACK MAP ---
        this.lapContainer = this.scene.add.container(width - 214, 16).setDepth(2000);
        const lapLabel = this.scene.add.sprite(0, 0, 'hud', 'label_lap').setOrigin(0, 0).setScale(3);
        this.lapContainer.add(lapLabel);
        this.updateGraphicalText(this.lapContainer, '1/3', 80, 0, 3);

        // Track Map (below LAP)
        this.trackMap = this.scene.add.sprite(width - 32, 94, 'hud', trackMapFrame).setOrigin(1, 0).setScale(4.4);
        this.trackMap.setDepth(2000);

        // Player Tracker Dot (Red dot as the user changed it to red)
        this.playerTracker = this.scene.add.sprite(0, 0, 'hud', 'dot_red').setScale(4).setDepth(2001);
        this.playerTracker.setVisible(false);

        // --- TOP CENTER: TIME ---
        this.timeContainer = this.scene.add.container(width / 2 - 74, 18).setDepth(2000);
        this.updateGraphicalText(this.timeContainer, "0'00\'00", 0, 0, 3.5);

        // --- BOTTOM LEFT: SPEED ---
        this.speedContainer = this.scene.add.container(18, height - 66).setDepth(2000);
        // KPH Label
        const kphLabel = this.scene.add.sprite(100, 12, 'hud', 'label_kph').setOrigin(0, 0).setScale(3);
        this.speedContainer.add(kphLabel);
        this.updateGraphicalSpeed('0');

        // Countdown HUD (Keep as text for now or replace with digit_0-9 if they look better)
        this.countdownText = this.scene.add.text(width / 2, height / 2 - 50, '3', {
            fontFamily: '"Press Start 2P"',
            fontSize: '120px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(3000);

        this.rechargeText = this.scene.add.text(width / 2, height * 0.16, 'RECHARGE!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '52px',
            color: '#ff5a18',
            stroke: '#000000',
            strokeThickness: 10,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 0,
                fill: true
            }
        }).setOrigin(0.5).setDepth(3000).setVisible(false).setScale(0.9, 1);

        this.repairText = this.scene.add.text(width / 2, height * 0.16 + 54, 'REPAIR!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '44px',
            color: '#55c8ff',
            stroke: '#000000',
            strokeThickness: 10,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 0,
                fill: true
            }
        }).setOrigin(0.5).setDepth(3000).setVisible(false).setScale(0.92, 1);
    }

    private updateGraphicalText(container: Phaser.GameObjects.Container, text: string, startX: number, startY: number, scale: number) {
        // Clear old digit sprites
        container.list.filter(obj => obj.name === 'digit').forEach(obj => obj.destroy());

        let currentX = startX;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let frame = '';

            if (char >= '0' && char <= '9') {
                frame = `digit_${char}`;
            } else if (char === '/') {
                frame = 'sep_slash';
            } else if (char === "'") {
                frame = 'dot_green';
            } else if (char === '"') {
                frame = 'dot_green';
            } else if (char === ':') {
                frame = 'sep_time';
            }

            if (frame) {
                const sprite = this.scene.add.sprite(currentX, startY, 'hud', frame).setOrigin(0, 0).setScale(scale);
                sprite.setName('digit');
                container.add(sprite);
                currentX += (sprite.width + 1) * scale;
            } else {
                currentX += 8 * scale; // Space
            }
        }
    }

    private updateGraphicalSpeed(speedStr: string) {
        this.speedContainer.list.filter(obj => obj.name === 'speedDigit').forEach(obj => obj.destroy());

        let currentX = 0;
        for (let i = 0; i < speedStr.length; i++) {
            const char = speedStr[i];
            const frame = `speed_digit_${char}`;
            const sprite = this.scene.add.sprite(currentX, 0, 'hud', frame).setOrigin(0, 0).setScale(3);
            sprite.setName('speedDigit');
            this.speedContainer.add(sprite);
            currentX += (sprite.width + 1) * 3;
        }
    }

    updateCountdown(dt: number): boolean {
        this.countdownTimer -= dt;
        const displayTime = Math.ceil(this.countdownTimer);

        if (displayTime > 0) {
            this.countdownText.setText(displayTime.toString());
            RaceAudioManager.fromScene(this.scene)?.handleCountdown(displayTime);
            return false;
        } else {
            this.countdownText.setText('GO!');
            this.countdownText.setColor('#00ff00');
            RaceAudioManager.fromScene(this.scene)?.handleCountdown(0);

            this.scene.time.delayedCall(1500, () => {
                this.scene.tweens.add({
                    targets: this.countdownText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => this.countdownText.setVisible(false)
                });
            });
            this.isRacing = true;
            return true;
        }
    }

    private isRacing = false;

    update(dt: number, playerProgress: number = 0) {
        if (this.isRacing) {
            this.raceTime += dt;
            this.updateRaceTime();

            // Sincronização direta com a geometria da pista
            let p = (playerProgress + this.trackMapOffset) % 1;
            this.playerTracker.setVisible(true);

            if (this.macroPoints.length > 0) {
                const mapW = this.trackMap.width * 4;
                const mapH = this.trackMap.height * 4;
                const margin = 5;

                // Escala para caber no sprite do mapa
                const scale = Math.min(
                    (mapW - margin * 2) / this.mapBounds.width,
                    (mapH - margin * 2) / this.mapBounds.height
                );

                // Centralização no sprite (ajuste fino conforme necessário)
                // O sprite trackMap tem origin (1, 0) - Top Right
                const centerX = this.trackMap.x - mapW / 2;
                const centerY = this.trackMap.y + mapH / 2;

                const offsetX = centerX - ((this.mapBounds.minX + this.mapBounds.maxX) / 2) * scale;
                const offsetY = centerY - ((this.mapBounds.minZ + this.mapBounds.maxZ) / 2) * scale;

                const pointIdx = Math.floor(p * this.macroPoints.length) % this.macroPoints.length;
                const pPos = this.macroPoints[pointIdx];

                this.playerTracker.setPosition(
                    pPos.x * scale + offsetX,
                    pPos.z * scale + offsetY
                );
            }
        }
    }

    setTrackPath(points: { x: number, z: number }[]) {
        this.macroPoints = points;
        if (points.length > 0) {
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
            for (const pt of points) {
                minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
                minZ = Math.min(minZ, pt.z); maxZ = Math.max(maxZ, pt.z);
            }
            this.mapBounds = {
                minX, maxX, minZ, maxZ,
                width: Math.max(1, maxX - minX),
                height: Math.max(1, maxZ - minZ)
            };
        }
    }

    private updateRaceTime() {
        const mins = Math.floor(this.raceTime / 60);
        const secs = Math.floor(this.raceTime % 60);
        const cents = Math.floor((this.raceTime * 100) % 100);

        const timeStr = `${mins}'${secs.toString().padStart(2, '0')}"${cents.toString().padStart(2, '0')}`;
        this.updateGraphicalText(this.timeContainer, timeStr, 0, 0, 3);
    }

    updateSpeed(speed: number) {
        const kmh = Math.floor(speed / 40);
        this.updateGraphicalSpeed(kmh.toString());
        this.updateSpeedBar(Math.min(1, speed / 12000));
    }

    getRaceTime() {
        return this.raceTime;
    }

    updateCarLife(healthPercent: number) {
        const clamped = Phaser.Math.Clamp(healthPercent, 0, 1);
        this.carLifeSprite.clearTint();

        if (clamped < 0.25) {
            const alpha = Math.floor(this.scene.time.now / 100) % 2 === 0 ? 1 : 0.5;
            this.carLifeSprite.setAlpha(alpha);
            return;
        }

        this.carLifeSprite.setAlpha(1);
    }

    updateFuel(fuelPercent: number) {
        const clamped = Phaser.Math.Clamp(fuelPercent, 0, 1);
        const activeSegments = Math.round(clamped * HUDManager.FUEL_BAR_SEGMENT_COUNT);
        const blinkAlpha = Math.floor(this.scene.time.now / 100) % 2 === 0 ? 1 : 0.35;
        const frame = this.getFuelFrame(clamped);

        this.fuelBarSegments.forEach((segment, index) => {
            const reverseIndex = HUDManager.FUEL_BAR_SEGMENT_COUNT - 1 - index;
            const isActive = reverseIndex < activeSegments;

            segment.setPosition(0, HUDManager.FUEL_BAR_START_Y - index * HUDManager.FUEL_BAR_SEGMENT_SPACING);
            segment.setFrame(frame);
            segment.setVisible(isActive);
            segment.setAlpha(clamped <= 0.18 ? blinkAlpha : 1);
        });
    }

    stopRaceClock() {
        this.isRacing = false;
    }

    setRechargeVisible(visible: boolean) {
        this.updateZoneText(this.rechargeText, visible, 0.9, 90, 70);
    }

    setRepairVisible(visible: boolean) {
        this.updateZoneText(this.repairText, visible, 0.92, 105, 80);
    }

    private updateZoneText(
        text: Phaser.GameObjects.Text,
        visible: boolean,
        baseScale: number,
        pulseDivisor: number,
        alphaDivisor: number
    ) {
        text.setVisible(visible);
        if (!visible) {
            text.setAlpha(1);
            text.setScale(baseScale, 1);
            return;
        }

        const pulse = baseScale + Math.sin(this.scene.time.now / pulseDivisor) * 0.04;
        text.setAlpha(0.8 + Math.sin(this.scene.time.now / alphaDivisor) * 0.2);
        text.setScale(pulse, 1 + Math.sin(this.scene.time.now / pulseDivisor) * 0.03);
    }

    setFinish() {
        // For Finish, we can use text or specialized sprites
        // Let's just use text for now as it's a transient state
        this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'FINISH!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '60px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(4000);
    }

    updateRankings(participants: { name: string, dist: number, isPlayer: boolean }[]) {
        const playerPos = participants.findIndex(p => p.isPlayer) + 1;
        const total = participants.length;
        const posStr = playerPos.toString().padStart(2, '0');
        const totalStr = total.toString().padStart(2, '0');
        this.updateGraphicalText(this.posContainer, `${posStr}/${totalStr}`, 80, 0, 3);
    }

    onLapComplete(currentLap: number, totalLaps: number) {
        this.currentLap = currentLap;
        this.totalLaps = totalLaps;
        this.updateGraphicalText(this.lapContainer, `${this.currentLap}/${this.totalLaps}`, 80, 0, 3);

        const lapLabel = this.currentLap === this.totalLaps ? "FINAL LAP!" : "LAP COMPLETED";
        const msg = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2, lapLabel, {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(3000);

        this.scene.tweens.add({
            targets: msg,
            alpha: 0,
            y: 100,
            duration: 2000,
            onComplete: () => msg.destroy()
        });

        RaceAudioManager.fromScene(this.scene)?.playBonus();
    }

    private updateSpeedBar(speedPercent: number) {
        const activeSegments = Math.round(speedPercent * HUDManager.SPEED_BAR_FRAMES.length);

        this.speedBarSegments.forEach((segment, index) => {
            if (index < activeSegments) {
                segment.setFrame(HUDManager.SPEED_BAR_FRAMES[index]);
                segment.setAlpha(1);
            } else {
                segment.setFrame('char_quote_double');
                segment.setAlpha(0.6);
            }
        });
    }

    private getFuelFrame(fuelPercent: number) {
        if (fuelPercent > 0.6) return 'misc_03';
        if (fuelPercent > 0.45) return 'bar_red_1';
        if (fuelPercent > 0.3) return 'bar_red_2';
        if (fuelPercent > 0.2) return 'bar_red_3';
        if (fuelPercent > 0.1) return 'bar_red_4';
        return 'bar_red_5';
    }
}
