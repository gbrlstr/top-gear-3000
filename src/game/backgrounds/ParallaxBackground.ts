import { Scene } from 'phaser';
import { TrackManager } from '../road/TrackManager';
import { TrackData } from '../tracks/trackTypes';

export class ParallaxBackground {
    private static readonly LOOP_OVERLAP_PX = 4;
    private static readonly SEAM_BLEND_WIDTH = 10;

    private scene: Scene;
    private skyFill!: Phaser.GameObjects.Rectangle;
    private skyGlow!: Phaser.GameObjects.Rectangle;
    private backgroundSprites: Phaser.GameObjects.Image[] = [];
    private horizonShade!: Phaser.GameObjects.Rectangle;
    private hazeLayer!: Phaser.GameObjects.Rectangle;
    private horizonY = 0;
    private lateralScroll = 0;
    private backgroundWidth = 0;
    private backgroundHeight = 0;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    create(track: TrackData, horizonY: number) {
        const { width } = this.scene.scale;
        const frame = track.backgroundFrame ?? this.getDefaultFrame(track.id);
        const skyColor = track.backgroundSkyColor ?? 0x7f93dc;
        const isolatedTexture = this.getIsolatedTexture(frame);

        this.horizonY = horizonY;

        this.skyFill = this.scene.add.rectangle(width / 2, horizonY * 0.5, width, horizonY + 48, skyColor, 1)
            .setOrigin(0.5)
            .setDepth(-40);

        this.skyGlow = this.scene.add.rectangle(width / 2, horizonY * 0.78, width, 112, 0xffffff, 0.08)
            .setOrigin(0.5)
            .setDepth(-36);

        this.backgroundWidth = Math.ceil(width * 1.42);
        this.backgroundHeight = Math.ceil(this.backgroundWidth * (130 / 512));
        this.backgroundSprites = [];

        for (let i = -1; i <= 1; i++) {
            const sprite = this.scene.add.image(width / 2 + (i * this.backgroundWidth), horizonY, isolatedTexture)
                .setOrigin(0.5, 1.1)
                .setDepth(-28)
                .setAlpha(1);
            sprite.setDisplaySize(this.backgroundWidth, this.backgroundHeight);
            this.backgroundSprites.push(sprite);
        }

        this.horizonShade = this.scene.add.rectangle(width / 2, horizonY + 14, width, 78, 0x000000, 0.14)
            .setOrigin(0.5, 0.5)
            .setDepth(5.5);

        this.hazeLayer = this.scene.add.rectangle(width / 2, horizonY - 10, width, 120, 0x101820, 0.08)
            .setOrigin(0.5, 0.5)
            .setDepth(6);
    }

    update(dt: number, playerSpeed: number, playerX: number, trackManager: TrackManager) {
        const segment = trackManager.getSegment(trackManager.position);
        const segmentPercent = (trackManager.position % trackManager.segmentLength) / trackManager.segmentLength;
        const worldY = Phaser.Math.Linear(segment.p1.world.y, segment.p2.world.y, segmentPercent);
        const speedPercent = Phaser.Math.Clamp(playerSpeed / 12000, 0, 1);
        const curveInfluence = segment.curve;

        const curveScrollSpeed = curveInfluence * (28 + speedPercent * 36);
        const steeringDrift = playerX * (4 + speedPercent * 6);
        this.lateralScroll += (curveScrollSpeed + steeringDrift) * dt;

        const loopStep = this.backgroundWidth - ParallaxBackground.LOOP_OVERLAP_PX;
        const hillOffset = Phaser.Math.Clamp(worldY * 0.035, -20, 20);
        const wrappedOffset = Phaser.Math.Wrap(this.lateralScroll, 0, loopStep);
        const baseX = Math.round((this.scene.scale.width / 2) - wrappedOffset);
        const baseY = Math.round(this.horizonY + 56 - hillOffset * 0.6);

        this.backgroundSprites.forEach((sprite, index) => {
            sprite.x = baseX + ((index - 1) * loopStep);
            sprite.y = baseY;
            sprite.alpha = 1;
        });

        this.horizonShade.y = this.horizonY + 18 - hillOffset * 0.2;
        this.hazeLayer.y = this.horizonY - 6 - hillOffset * 0.55;
        this.skyFill.y = this.horizonY * 0.5 - hillOffset * 0.18;
        this.skyGlow.y = this.horizonY * 0.78 - hillOffset * 0.1;
        this.hazeLayer.alpha = 0.08 + speedPercent * 0.03;
    }

    destroy() {
        this.skyFill?.destroy();
        this.skyGlow?.destroy();
        this.horizonShade?.destroy();
        this.backgroundSprites.forEach(sprite => sprite.destroy());
        this.backgroundSprites = [];
        this.hazeLayer?.destroy();
    }

    private getIsolatedTexture(frame: string) {
        const textureKey = `track-bg-isolated-${frame}`;
        if (this.scene.textures.exists(textureKey)) {
            return textureKey;
        }

        const atlas = this.scene.textures.get('track-backgrounds');
        const atlasFrame = atlas.get(frame);
        const sourceImage = atlas.getSourceImage() as CanvasImageSource;
        const canvasTexture = this.scene.textures.createCanvas(textureKey, atlasFrame.cutWidth, atlasFrame.cutHeight);
        const context = canvasTexture!.getContext();

        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, atlasFrame.cutWidth, atlasFrame.cutHeight);
        context.drawImage(
            sourceImage,
            atlasFrame.cutX,
            atlasFrame.cutY,
            atlasFrame.cutWidth,
            atlasFrame.cutHeight,
            0,
            0,
            atlasFrame.cutWidth,
            atlasFrame.cutHeight
        );

        const imageData = context.getImageData(0, 0, atlasFrame.cutWidth, atlasFrame.cutHeight);
        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Remove a borda magenta usada como recorte na spritesheet.
            if (r >= 220 && g <= 40 && b >= 220) {
                pixels[i + 3] = 0;
            }
        }

        this.blendLoopSeam(pixels, atlasFrame.cutWidth, atlasFrame.cutHeight);

        context.putImageData(imageData, 0, 0);

        canvasTexture!.refresh();
        canvasTexture!.setFilter(Phaser.Textures.FilterMode.NEAREST);

        return textureKey;
    }

    private blendLoopSeam(pixels: Uint8ClampedArray, width: number, height: number) {
        const blendWidth = Math.min(ParallaxBackground.SEAM_BLEND_WIDTH, Math.floor(width / 4));
        if (blendWidth <= 0) return;

        for (let y = 0; y < height; y++) {
            for (let i = 0; i < blendWidth; i++) {
                const leftX = i;
                const rightX = width - blendWidth + i;
                const leftIdx = (y * width + leftX) * 4;
                const rightIdx = (y * width + rightX) * 4;

                const leftAlpha = pixels[leftIdx + 3];
                const rightAlpha = pixels[rightIdx + 3];

                if (leftAlpha === 0 && rightAlpha === 0) {
                    continue;
                }

                if (leftAlpha === 0 || rightAlpha === 0) {
                    const sourceIdx = leftAlpha > 0 ? leftIdx : rightIdx;
                    const targetIdx = leftAlpha > 0 ? rightIdx : leftIdx;

                    for (let channel = 0; channel < 4; channel++) {
                        pixels[targetIdx + channel] = pixels[sourceIdx + channel];
                    }
                    continue;
                }

                for (let channel = 0; channel < 3; channel++) {
                    const leftValue = pixels[leftIdx + channel];
                    const rightValue = pixels[rightIdx + channel];
                    const mixedValue = Math.round((leftValue + rightValue) * 0.5);

                    pixels[leftIdx + channel] = mixedValue;
                    pixels[rightIdx + channel] = mixedValue;
                }

                const alpha = Math.max(leftAlpha, rightAlpha);
                pixels[leftIdx + 3] = alpha;
                pixels[rightIdx + 3] = alpha;
            }
        }
    }

    private getDefaultFrame(trackId: number) {
        const frameId = ((trackId - 1) % 56) + 1;
        return `bg_${frameId.toString().padStart(2, '0')}`;
    }
}
