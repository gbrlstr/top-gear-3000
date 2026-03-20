import Phaser from 'phaser';
import {
    createPlayerNameFontTexture,
    preloadPlayerNameFont,
    createFontSprite,
    getFontFrame,
} from '../elements/playerNameFont';

type GridItem = {
    char: string;
    sprite: Phaser.GameObjects.Sprite;
};

export class PlayerNameScene extends Phaser.Scene {
    private typedName = 'PLAYER';
    private maxNameLength = 8;

    private gridX = 4;
    private gridY = 2;

    private gridItems: GridItem[][] = [];
    private typedSprites: Phaser.GameObjects.Sprite[] = [];

    private cursorBox!: Phaser.GameObjects.Graphics;
    private nameCursorSprite!: Phaser.GameObjects.Sprite;

    constructor() {
        super('PlayerNameScene');
    }

    preload(): void {
        preloadPlayerNameFont(this);
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#000000');

        // Load name from localStorage
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            this.typedName = savedName;
        }

        createPlayerNameFontTexture(this);

        this.drawBackground();
        // this.drawCarBackdrop();
        this.drawGrid();

        this.cursorBox = this.add.graphics().setDepth(200);
        this.updateGridCursor();

        this.renderTypedName();
        this.createNameCursor();

        this.registerControls();
    }

    private drawBackground() {
        const graphics = this.add.graphics();
        const width = 1024;
        const height = 768;

        const mainBlue = 0x0a16d8;
        const lightBlue = 0x00b8ff;
        const bandHeight = 72;
        const gap = 4;

        for (let y = 0; y < height; y += bandHeight + gap) {
            graphics.fillStyle(mainBlue, 1);
            graphics.fillRect(0, y, width, bandHeight);

            graphics.fillStyle(lightBlue, 1);
            graphics.fillRect(0, y, width, 3);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.lineBetween(0, y + bandHeight, width, y + bandHeight);
        }

        const yellow = 0xffff00;
        const stripeWidth = 10;
        const xPositions = [16, 46, width - 34, width - 64];

        xPositions.forEach((x) => {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(x - 2, 0, stripeWidth + 4, height);
            graphics.fillStyle(yellow, 1);
            graphics.fillRect(x, 0, stripeWidth, height);
        });

        // Monitor area black box - Expanded down
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 70, width, 250);

        graphics.fillStyle(0x0a16d8, 1);
        graphics.fillRect(0, 320, width, 65);

        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 385, width, 10);
    }

    private drawGrid() {
        this.gridItems = [];

        const topRows = [
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
            ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        ];

        // Move rows down
        const row0Y = 110;
        const row1Y = 165;
        const row2Y = 225;

        const startX = 70;
        const letterSpacing = 62;
        const scale = 4;

        topRows.forEach((row, rowIndex) => {
            const items: GridItem[] = [];
            row.forEach((char, index) => {
                const sprite = createFontSprite(
                    this,
                    startX + index * letterSpacing,
                    rowIndex === 0 ? row0Y : row1Y,
                    char
                )
                    .setOrigin(0, 0)
                    .setScale(scale)
                    .setDepth(120);

                items.push({ char, sprite });
            });

            this.gridItems.push(items);
        });

        const bottomLayout = [
            { char: '!', x: 64 },
            { char: '.', x: 114, y: row2Y + 20 },
            { char: '_', x: 174, y: row2Y + 20 },
            { char: 'del', x: 270 },
            { char: 'end', x: 406 },
        ];

        const bottomItems: GridItem[] = [];

        bottomLayout.forEach(({ char, x, y }) => {
            const sprite = createFontSprite(this, x, y ?? row2Y, char)
                .setOrigin(0, 0)
                .setScale(scale)
                .setDepth(120);

            bottomItems.push({ char, sprite });
        });

        this.gridItems.push(bottomItems);
    }

    private renderTypedName() {
        this.typedSprites.forEach((sprite) => sprite.destroy());
        this.typedSprites = [];

        let cursorX = 380;
        const baseY = 335;
        const scale = 4.2;
        const extraSpacing = 2;

        for (const char of this.typedName) {
            // Apply custom Y offset for specific symbols matching grid layout
            let charY = baseY;
            if (char === '.' || char === '_') {
                charY += 20;
            }

            const sprite = createFontSprite(this, cursorX, charY, char)
                .setOrigin(0, 0)
                .setScale(scale)
                .setDepth(130);

            this.typedSprites.push(sprite);

            const frame = getFontFrame(this, char);
            cursorX += (frame?.width ?? 8) * scale + extraSpacing;
        }
    }

    private createNameCursor() {
        this.nameCursorSprite = createFontSprite(this, 0, 0, 'cursor_red_bottom')
            .setOrigin(0, 0)
            .setScale(2.2)
            .setDepth(150);

        this.updateNameCursorPosition();

        this.time.addEvent({
            delay: 350,
            loop: true,
            callback: () => {
                this.nameCursorSprite.setVisible(!this.nameCursorSprite.visible);
            }
        });
    }

    private updateNameCursorPosition() {
        let cursorX = 380;
        const y = 325;
        const scale = 4.2;
        const extraSpacing = 2;

        for (const char of this.typedName) {
            const frame = getFontFrame(this, char);
            cursorX += (frame?.width ?? 8) * scale + extraSpacing;
        }

        this.nameCursorSprite.setPosition(cursorX + 1, y);
    }

    private registerControls() {
        this.input.keyboard?.on('keydown-LEFT', () => {
            const rowLength = this.gridItems[this.gridY].length;
            this.gridX = Phaser.Math.Wrap(this.gridX - 1, 0, rowLength);
            this.updateGridCursor();
        });

        this.input.keyboard?.on('keydown-RIGHT', () => {
            const rowLength = this.gridItems[this.gridY].length;
            this.gridX = Phaser.Math.Wrap(this.gridX + 1, 0, rowLength);
            this.updateGridCursor();
        });

        this.input.keyboard?.on('keydown-UP', () => {
            this.gridY = Phaser.Math.Wrap(this.gridY - 1, 0, this.gridItems.length);
            this.gridX = Phaser.Math.Clamp(this.gridX, 0, this.gridItems[this.gridY].length - 1);
            this.updateGridCursor();
        });

        this.input.keyboard?.on('keydown-DOWN', () => {
            this.gridY = Phaser.Math.Wrap(this.gridY + 1, 0, this.gridItems.length);
            this.gridX = Phaser.Math.Clamp(this.gridX, 0, this.gridItems[this.gridY].length - 1);
            this.updateGridCursor();
        });

        this.input.keyboard?.on('keydown-ENTER', () => this.handleAction());
        this.input.keyboard?.on('keydown-SPACE', () => this.handleAction());
        this.input.keyboard?.on('keydown-BACKSPACE', () => {
            if (this.typedName.length > 0) {
                this.typedName = this.typedName.slice(0, -1);
                this.renderTypedName();
                this.updateNameCursorPosition();
                this.playHighlightSound();
            }
        });
    }

    private playHighlightSound() {
        if (this.cache.audio.exists('menu-highlight')) {
            this.sound.play('menu-highlight', { volume: 0.8 });
        }
    }

    private handleAction() {
        const item = this.gridItems[this.gridY][this.gridX];
        if (!item) return;

        this.playHighlightSound();
        const char = item.char;

        if (char === 'del') {
            this.typedName = this.typedName.slice(0, -1);
        } else if (char === 'end') {
            const finalName = this.typedName || 'PLAYER';
            this.registry.set('playerName', finalName);
            localStorage.setItem('playerName', finalName);
            this.scene.start('GameSettings');
            return;
        } else {
            if (this.typedName.length < this.maxNameLength) {
                this.typedName += char;
            }
        }

        this.renderTypedName();
        this.updateNameCursorPosition();
    }

    private updateGridCursor() {
        this.cursorBox.clear();

        const selected = this.gridItems[this.gridY][this.gridX];
        if (!selected) return;

        const bounds = selected.sprite.getBounds();

        this.cursorBox.lineStyle(4, 0xff2a2a, 1);
        this.cursorBox.strokeRect(
            bounds.x - 8,
            bounds.y - 6,
            bounds.width + 16,
            bounds.height + 12
        );
    }
}