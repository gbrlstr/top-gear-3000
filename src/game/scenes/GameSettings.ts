import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { createAnimations, createMonitor, createMonitorTexture, loadSprites } from '../elements/monitor';

export class GameSettings extends Scene {
    backgroundGraphics: GameObjects.Graphics;
    monitorBox: GameObjects.Graphics;
    menuOptions: GameObjects.Text[] = [];
    selectedOption: number = 0;
    selectionBox: GameObjects.Graphics;
    monitor: Phaser.GameObjects.Sprite;
    nebula: GameObjects.TileSprite;
    pulseTween: Phaser.Tweens.Tween | undefined;

    constructor() {
        super('GameSettings');
    }

    preload() {
        loadSprites(this);
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);

        // 1. Draw Background (Blue bands and yellow stripes)
        this.drawBackground();

        // 2. Create Fiery Background (Nebula)
        this.createFieryBackground();

        // 3. Draw Monitor Box and get the sprite
        const monitor = this.drawMonitor();

        // 4. Selection Box (initialized empty/invisible)
        this.selectionBox = this.add.graphics().setDepth(100);

        // Listener for monitor opening animation
        monitor.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key === 'monitor-idle') {
                // Wait 0.1 seconds after the animation ends
                this.time.delayedCall(100, () => {
                    this.createMenu();
                    this.updateSelectionBox();
                });
            }
        });

        // Keyboard Handling
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

        EventBus.emit('current-scene-ready', this);
    }

    private drawBackground() {
        const graphics = this.add.graphics();
        const width = 1024;
        const height = 768;

        // Draw Blue Bands with Highlights
        const mainBlue = 0x0000cc;
        const lightBlue = 0x0066ff;
        const bandHeight = 75;
        const gap = 5;

        for (let y = 0; y < height; y += bandHeight + gap) {
            // Main Band
            graphics.fillStyle(mainBlue, 1);
            graphics.fillRect(0, y, width, bandHeight);

            // Top Highlight (Bevel effect)
            graphics.fillStyle(lightBlue, 1);
            graphics.fillRect(0, y, width, 4);

            // Bottom Shadow Line
            graphics.lineStyle(2, 0x000000, 1);
            graphics.lineBetween(0, y + bandHeight, width, y + bandHeight);
        }

        // Draw Double Yellow Vertical Stripes (on each side)
        const yellow = 0xffff00;
        const stripeWidth = 10;
        const xPositions = [20, 50, width - 30, width - 60];

        xPositions.forEach(x => {
            // Black Border
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(x - 2, 0, stripeWidth + 4, height);

            // Yellow Stripe
            graphics.fillStyle(yellow, 1);
            graphics.fillRect(x, 0, stripeWidth, height);

            // Inner dark line for detail
            graphics.lineStyle(1, 0x000000, 0.4);
            graphics.lineBetween(x + stripeWidth / 2, 0, x + stripeWidth / 2, height);
        });

        // Top dark strip base for the monitor area
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 160, width, 300);

        // Thick black horizontal separator below the monitor area
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 460, width, 12);
    }

    private createFieryBackground() {
        // Create a small white texture for the stars if it doesn't exist
        const textureKey = 'star_pixel';
        if (!this.textures.exists(textureKey)) {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture(textureKey, 2, 2);
            graphics.destroy();
        }

        // Create a starfield restricted to the monitor area strip (Y 160 to 460)
        const emitter = this.add.particles(0, 0, textureKey, {
            x: { min: 0, max: 1024 },
            y: { min: 160, max: 460 },
            scale: { min: 0.5, max: 1.5 },
            alpha: {
                onEmit: () => 0,
                onUpdate: (_, __, t) => {
                    // Smooth sin curve for twinkling
                    return Math.sin(t * Math.PI);
                }
            },
            lifespan: { min: 2000, max: 4000 },
            frequency: 100,
            quantity: 1,
            maxParticles: 100,
            blendMode: 'ADD'
        });

        emitter.setDepth(5);

        // Pre-fill so it doesn't start empty
        for (let i = 0; i < 50; i++) {
            const p = emitter.emitParticleAt(
                Phaser.Math.Between(0, 1024),
                Phaser.Math.Between(160, 460)
            );
            if (p) p.lifeT = Math.random();
        }
    }

    private drawMonitor() {
        createMonitorTexture(this);
        createAnimations(this);

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
            color: '#00cc00', // Greenish retro text
            align: 'center'
        };

        labels.forEach((label, index) => {
            const text = this.add.text(512, 200 + (index * 45), label, fontConfig)
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
        this.selectedOption = Phaser.Math.Wrap(this.selectedOption + direction, 0, this.menuOptions.length);
        this.updateSelectionBox();
        this.sound.play('menu-highlight', { volume: 0.5 });
    }

    private updateSelectionBox() {
        if (this.menuOptions.length === 0) return;

        // Stop existing tween if any
        if (this.pulseTween) {
            this.pulseTween.stop();
        }

        // Reset all scales to 1 and colors to base green
        this.menuOptions.forEach(opt => {
            opt.setScale(1);
            opt.setColor('#00cc00');
        });

        const target = this.menuOptions[this.selectedOption];

        // Draw selection box once (static since scale doesn't change)
        this.drawSelectionBox(target);

        // Start new color pulse tween
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
                const colorString = Phaser.Display.Color.RGBToString(colorObject.r, colorObject.g, colorObject.b);
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
        if (selectedLabel === 'RACE') {
            this.sound.stopAll();
            this.scene.start('Game');
        } else {
            this.sound.play('menu-highlight', { volume: 0.8 });
        }
    }
}
