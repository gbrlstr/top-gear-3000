import Phaser from 'phaser';

export class ShutterTransition {
    private scene: Phaser.Scene;
    private topBar!: Phaser.GameObjects.Graphics;
    private bottomBar!: Phaser.GameObjects.Graphics;
    private width: number;
    private height: number;
    private color: number = 0x0000cc;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.createBars();
    }

    private createBars() {
        this.topBar = this.scene.add.graphics().setDepth(1000).setScrollFactor(0);
        this.bottomBar = this.scene.add.graphics().setDepth(1000).setScrollFactor(0);
        
        this.updateBars(0); // Start fully open
    }

    private updateBars(progress: number) {
        this.topBar.clear();
        this.bottomBar.clear();

        this.topBar.fillStyle(this.color, 1);
        this.bottomBar.fillStyle(this.color, 1);

        const barHeight = (this.height / 2) * progress;

        // Top bar
        this.topBar.fillRect(0, 0, this.width, barHeight);
        
        // Bottom bar
        this.bottomBar.fillRect(0, this.height - barHeight, this.width, barHeight);
        
        // Add some black outlines like in the image
        this.topBar.lineStyle(4, 0x000000, 1);
        this.topBar.lineBetween(0, barHeight, this.width, barHeight);
        
        this.bottomBar.lineStyle(4, 0x000000, 1);
        this.bottomBar.lineBetween(0, this.height - barHeight, this.width, this.height - barHeight);
    }

    public enter(duration: number = 500): Promise<void> {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: { progress: 1 },
                progress: 0,
                duration: duration,
                ease: 'Cubic.out',
                onUpdate: (tween: Phaser.Tweens.Tween) => {
                    this.updateBars(tween.getValue() as number);
                },
                onComplete: () => {
                    this.topBar.destroy();
                    this.bottomBar.destroy();
                    resolve();
                }
            });
        });
    }

    public exit(duration: number = 500): Promise<void> {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: duration,
                ease: 'Cubic.in',
                onUpdate: (tween: Phaser.Tweens.Tween) => {
                    this.updateBars(tween.getValue() as number);
                },
                onComplete: () => {
                    resolve();
                }
            });
        });
    }
}
