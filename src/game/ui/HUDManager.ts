import { Scene } from 'phaser';

export class HUDManager {
    private scene: Scene;

    // Graphical elements
    private speedContainer!: Phaser.GameObjects.Container;
    private lapContainer!: Phaser.GameObjects.Container;
    private posContainer!: Phaser.GameObjects.Container;
    private timeContainer!: Phaser.GameObjects.Container;
    private energyBar!: Phaser.GameObjects.Container;
    private trackMap!: Phaser.GameObjects.Sprite;
    private playerTracker!: Phaser.GameObjects.Sprite;
    private trackMapOffset: number = 0;
    private macroPoints: { x: number, z: number }[] = [];
    private mapBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, height: 0 };

    public countdownText!: Phaser.GameObjects.Text;

    private countdownTimer: number = 10;
    private currentLap: number = 1;
    private totalLaps: number = 3;
    private raceTime: number = 0;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    create(trackMapFrame: string = 'track_01', trackMapOffset: number = 0) {
        const { width, height } = this.scene.scale;
        this.trackMapOffset = trackMapOffset;

        // --- TOP LEFT: POSITION & ENERGY ---
        this.posContainer = this.scene.add.container(20, 20).setDepth(2000);
        // "POS" Label
        const posLabel = this.scene.add.sprite(0, 0, 'hud', 'label_pos').setOrigin(0, 0).setScale(3);
        this.posContainer.add(posLabel);
        // Rank digits (X/Y)
        this.updateGraphicalText(this.posContainer, '0/10', 80, 0, 3);

        // Energy Bar (below POS)
        this.energyBar = this.scene.add.container(20, 50).setDepth(2000);
        for (let i = 0; i < 10; i++) {
            const segment = this.scene.add.sprite(i * 14, 0, 'hud', 'bar_green').setOrigin(0, 0).setScale(3);
            this.energyBar.add(segment);
        }

        // --- TOP RIGHT: LAP & TRACK MAP ---
        this.lapContainer = this.scene.add.container(width - 240, 20).setDepth(2000);
        const lapLabel = this.scene.add.sprite(0, 0, 'hud', 'label_lap').setOrigin(0, 0).setScale(3);
        this.lapContainer.add(lapLabel);
        this.updateGraphicalText(this.lapContainer, '1/3', 80, 0, 3);

        // Track Map (below LAP)
        this.trackMap = this.scene.add.sprite(width - 110, 160, 'hud', trackMapFrame).setOrigin(1, 0).setScale(4);
        this.trackMap.setDepth(2000);

        // Player Tracker Dot (Red dot as the user changed it to red)
        this.playerTracker = this.scene.add.sprite(0, 0, 'hud', 'dot_red').setScale(4).setDepth(2001);
        this.playerTracker.setVisible(false);

        // --- TOP CENTER: TIME ---
        this.timeContainer = this.scene.add.container(width / 2 - 100, 20).setDepth(2000);
        this.updateGraphicalText(this.timeContainer, "0'00\"00", 0, 0, 3.5);

        // --- BOTTOM LEFT: SPEED ---
        this.speedContainer = this.scene.add.container(40, height - 80).setDepth(2000);
        // KPH Label
        const kphLabel = this.scene.add.sprite(110, 20, 'hud', 'label_kph').setOrigin(0, 0).setScale(3);
        this.speedContainer.add(kphLabel);
        this.updateGraphicalSpeed('0');

        // Countdown HUD (Keep as text for now or replace with digit_0-9 if they look better)
        this.countdownText = this.scene.add.text(width / 2, height / 2 - 50, '10', {
            fontFamily: '"Press Start 2P"',
            fontSize: '120px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(3000);
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
                frame = 'char_quote_double';
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
            return false;
        } else {
            this.countdownText.setText('GO!');
            this.countdownText.setColor('#00ff00');

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
    }

    getRaceTime() {
        return this.raceTime;
    }

    stopRaceClock() {
        this.isRacing = false;
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

        if (this.scene.sound.get('Bonus')) {
            this.scene.sound.play('Bonus', { volume: 0.5 });
        }
    }
}
