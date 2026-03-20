import { GameObjects, Scene } from 'phaser';
import { ShutterTransition } from '../elements/shutterTransition';
import { EventBus } from '../EventBus';
import {
    createAnimations,
    createMonitor,
    createTransparentTexture,
    preloadAssets,
} from '../elements/topgearSheet';

export class GameSettings extends Scene {
    backgroundGraphics!: GameObjects.Graphics;
    monitorBox!: GameObjects.Graphics;
    menuOptions: GameObjects.Text[] = [];
    selectedOption = 0;
    selectionBox!: GameObjects.Graphics;
    monitor!: Phaser.GameObjects.Sprite;
    nebula!: GameObjects.TileSprite;
    pulseTween: Phaser.Tweens.Tween | undefined;
    private shutter!: ShutterTransition;

    constructor() {
        super('GameSettings');
    }

    preload() {
        preloadAssets(this);
    }

    create() {
        this.shutter = new ShutterTransition(this);
        this.shutter.enter();

        // Reset scene state for fresh entry
        this.menuOptions = [];
        this.selectedOption = 0;
        if (this.pulseTween) this.pulseTween.stop();
        this.pulseTween = undefined;

        this.cameras.main.setBackgroundColor(0x000000);

        createTransparentTexture(this);
        createAnimations(this);

        this.drawBackground();
        this.createFieryBackground();

        const monitor = this.drawMonitor();

        this.selectionBox = this.add.graphics().setDepth(100);

        monitor.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key === 'monitor-open') {
                this.time.delayedCall(100, () => {
                    this.createMenu();
                    this.updateSelectionBox();
                });
            }
        });

        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-UP', () => {
                if (this.menuOptions.length > 0) this.moveSelection(-1);
            });

            this.input.keyboard.on('keydown-DOWN', () => {
                if (this.menuOptions.length > 0) this.moveSelection(1);
            });

            this.input.keyboard.on('keydown-ENTER', () => {
                if (this.menuOptions.length > 0) this.confirmSelection();
            });

            this.input.keyboard.on('keydown-SPACE', () => {
                if (this.menuOptions.length > 0) this.confirmSelection();
            });
        }

        this.playHighlightSound();

        EventBus.emit('current-scene-ready', this);
    }

    private drawBackground() {
        const graphics = this.add.graphics();
        const width = 1024;
        const height = 768;

        const mainBlue = 0x0000cc;
        const lightBlue = 0x0066ff;
        const bandHeight = 75;
        const gap = 5;

        for (let y = 0; y < height; y += bandHeight + gap) {
            graphics.fillStyle(mainBlue, 1);
            graphics.fillRect(0, y, width, bandHeight);

            graphics.fillStyle(lightBlue, 1);
            graphics.fillRect(0, y, width, 4);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.lineBetween(0, y + bandHeight, width, y + bandHeight);
        }

        const yellow = 0xffff00;
        const stripeWidth = 10;
        const xPositions = [20, 50, width - 30, width - 60];

        xPositions.forEach((x) => {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(x - 2, 0, stripeWidth + 4, height);

            graphics.fillStyle(yellow, 1);
            graphics.fillRect(x, 0, stripeWidth, height);

            graphics.lineStyle(1, 0x000000, 0.4);
            graphics.lineBetween(x + stripeWidth / 2, 0, x + stripeWidth / 2, height);
        });

        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 160, width, 300);

        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 460, width, 12);
    }

    private createFieryBackground() {
        const textureKey = 'star_pixel';

        if (!this.textures.exists(textureKey)) {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture(textureKey, 2, 2);
            graphics.destroy();
        }

        const emitter = this.add.particles(0, 0, textureKey, {
            x: { min: 0, max: 1024 },
            y: { min: 160, max: 460 },
            scale: { min: 0.5, max: 1.5 },
            alpha: {
                onEmit: () => 0,
                onUpdate: (_, __, t) => Math.sin(t * Math.PI)
            },
            lifespan: { min: 2000, max: 4000 },
            frequency: 100,
            quantity: 1,
            maxParticles: 100,
            blendMode: 'ADD'
        });

        emitter.setDepth(5);

        for (let i = 0; i < 50; i++) {
            const p = emitter.emitParticleAt(
                Phaser.Math.Between(0, 1024),
                Phaser.Math.Between(160, 460)
            );

            if (p) p.lifeT = Math.random();
        }
    }

    private drawMonitor() {
        this.monitor = createMonitor(this, 512, 270);
        this.monitor.setScale(3.5);
        this.monitor.setDepth(20);

        return this.monitor;
    }

    private createMenu() {
        const labels = ['NAME', 'CONTROL', 'SPEED', 'RACE'];

        const fontConfig = {
            fontFamily: '"Press Start 2P"',
            fontSize: '28px',
            color: '#00cc00',
            align: 'center' as const
        };

        labels.forEach((label, index) => {
            const text = this.add.text(512, 200 + index * 45, label, fontConfig)
                .setOrigin(0.5)
                .setDepth(100)
                .setInteractive({ useHandCursor: true });

            text.on('pointerdown', () => {
                this.selectedOption = index;
                this.updateSelectionBox();
                this.confirmSelection();
            });

            this.menuOptions.push(text);
        });
    }

    private moveSelection(direction: number) {
        if (this.menuOptions.length === 0) return;

        this.selectedOption = Phaser.Math.Wrap(
            this.selectedOption + direction,
            0,
            this.menuOptions.length
        );

        this.updateSelectionBox();

        this.playHighlightSound();
    }

    private updateSelectionBox() {
        if (this.menuOptions.length === 0) return;

        if (this.pulseTween) {
            this.pulseTween.stop();
        }

        this.menuOptions.forEach((opt) => {
            opt.setScale(1);
            opt.setColor('#00cc00');
        });

        const target = this.menuOptions[this.selectedOption];

        this.drawSelectionBox(target);

        this.pulseTween = this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 500,
            yoyo: true,
            repeat: -1,
            onUpdate: (tween) => {
                const value = tween.getValue();

                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(0x00cc00),
                    Phaser.Display.Color.ValueToColor(0x88ff88),
                    100,
                    value!
                );

                const colorString = Phaser.Display.Color.RGBToString(
                    colorObject.r,
                    colorObject.g,
                    colorObject.b
                );

                target.setColor(colorString);
            }
        });
    }

    private drawSelectionBox(target: GameObjects.Text) {
        this.selectionBox.clear();
        this.selectionBox.lineStyle(4, 0xff0000);

        const bounds = target.getBounds();

        this.selectionBox.strokeRect(
            bounds.x - 10,
            bounds.y - 6,
            bounds.width + 20,
            bounds.height + 12
        );
    }

    private confirmSelection() {
        if (this.menuOptions.length === 0) return;

        const selectedLabel = this.menuOptions[this.selectedOption].text;

        this.shutter.exit().then(() => {
            if (selectedLabel === 'RACE') {
                this.sound.stopAll();
                this.scene.start('Game');
            } else if (selectedLabel === 'NAME') {
                this.scene.start('PlayerNameScene');
            } else {
                this.playHighlightSound();
            }
        });
    }

    private playHighlightSound() {
        if (this.cache.audio.exists('menu-highlight')) {
            this.sound.play('menu-highlight', { volume: 0.8 });
        }
    }
}