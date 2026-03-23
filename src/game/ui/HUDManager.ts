import { Scene } from 'phaser';

export class HUDManager {
    private scene: Scene;
    private speedText!: Phaser.GameObjects.Text;
    private lapText!: Phaser.GameObjects.Text;
    private rankText!: Phaser.GameObjects.Text;
    public countdownText!: Phaser.GameObjects.Text;

    private countdownTimer: number = 10;
    private currentLap: number = 1;
    private totalLaps: number = 3;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    create() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Speed HUD
        this.speedText = this.scene.add.text(width - 200, height - 50, '0 KPH', {
            fontFamily: '"Press Start 2P"',
            fontSize: '23px',
            color: '#ffff00'
        }).setDepth(2000);

        // Lap HUD
        this.lapText = this.scene.add.text(20, 20, `LAP ${this.currentLap}/${this.totalLaps}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            color: '#ffffff'
        }).setDepth(2000);

        // Rank HUD
        this.rankText = this.scene.add.text(20, 60, 'POS: 1/10', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            color: '#ffffff'
        }).setDepth(2000);

        // Countdown HUD
        this.countdownText = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY - 50, '10', {
            fontFamily: '"Press Start 2P"',
            fontSize: '120px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(3000);
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
            return true;
        }
    }

    updateSpeed(speed: number) {
        // EXIBIÇÃO EM KM/H (Realista)
        // Dividimos por 40 para que 12000 no código = 300 KM/H no ecrã
        const kmh = Math.floor(speed / 40);
        this.speedText.setText(`${kmh} KM/H`);
    }

    setFinish() {
        this.speedText.setText("FINISH!");
    }

    updateRankings(participants: { name: string, dist: number, isPlayer: boolean }[]) {
        // Encontra a posição do jogador
        const playerPos = participants.findIndex(p => p.isPlayer) + 1;
        const total = participants.length;

        const suffix = ['st', 'nd', 'rd', 'th'][Math.min(playerPos - 1, 3)];
        this.rankText.setText(`POS: ${playerPos}${playerPos > 3 ? 'th' : suffix} / ${total}`);
    }

    onLapComplete(currentLap: number, totalLaps: number) {
        this.currentLap = currentLap;
        this.totalLaps = totalLaps;
        this.lapText.setText(`LAP ${this.currentLap}/${this.totalLaps}`);

        // Efeito visual de "LAP COMPLETED"
        const lapLabel = this.currentLap === this.totalLaps ? "FINAL LAP!" : `LAP ${this.currentLap}/${this.totalLaps}`;
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

        // Use o sistema de áudio do Phaser de forma leve
        if (this.scene.sound.get('Bonus')) {
            this.scene.sound.play('Bonus', { volume: 0.5 });
        }
    }

    getCountdownTimer(): number {
        return this.countdownTimer;
    }
}
