import Phaser from 'phaser';
import { FONT_TRANSPARENT_KEY, hasFontFrame } from './PlayerNameAtlas';

export class PlayerNameRenderer {
    private scene: Phaser.Scene;
    private sprites: Phaser.GameObjects.Sprite[] = [];

    constructor(private x: number, private y: number, scene: Phaser.Scene) {
        this.scene = scene;
    }

    setText(value: string): void {
        this.clear();

        let cursorX = this.x;

        for (const char of value.toUpperCase()) {
            const frame = char;

            if (!hasFontFrame(this.scene, frame)) {
                cursorX += 18;
                continue;
            }

            const sprite = this.scene.add.sprite(cursorX, this.y, FONT_TRANSPARENT_KEY, frame);
            sprite.setOrigin(0, 0);
            sprite.setScale(3);

            this.sprites.push(sprite);

            const tex = this.scene.textures.get(FONT_TRANSPARENT_KEY);
            const f = tex.get(frame);
            cursorX += (f?.width ?? 10) * 3 + 6;
        }
    }

    clear(): void {
        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites = [];
    }

    destroy(): void {
        this.clear();
    }
}