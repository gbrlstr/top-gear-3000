import Phaser from 'phaser';
import { FONT_TRANSPARENT_KEY, hasFontFrame } from './playerNameFont';

type SpriteChar = Phaser.GameObjects.Sprite;

export class SpriteFontText {
    private scene: Phaser.Scene;
    private x: number;
    private y: number;
    private spacing: number;
    private scale: number;
    private chars: SpriteChar[] = [];

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        options?: {
            spacing?: number;
            scale?: number;
        }
    ) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.spacing = options?.spacing ?? 14;
        this.scale = options?.scale ?? 2;
    }

    setText(value: string): void {
        this.clear();

        const text = value.toUpperCase();

        [...text].forEach((char, index) => {
            const frame = char === ' ' ? '' : char;

            if (!frame) return;
            if (!hasFontFrame(this.scene, frame)) return;

            const sprite = this.scene.add.sprite(
                this.x + index * this.spacing,
                this.y,
                FONT_TRANSPARENT_KEY,
                frame
            );

            sprite.setOrigin(0, 0);
            sprite.setScale(this.scale);

            this.chars.push(sprite);
        });
    }

    clear(): void {
        this.chars.forEach((char) => char.destroy());
        this.chars = [];
    }

    destroy(): void {
        this.clear();
    }
}