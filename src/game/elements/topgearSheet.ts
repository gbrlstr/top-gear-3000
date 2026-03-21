const MENU_KEY = 'menu';
const MENU_TRANSPARENT_KEY = 'menu';

type FrameDef = {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

const MONITOR_FRAMES: FrameDef[] = [
    { key: 'monitor_0', x: 12, y: 9, w: 114, h: 37 },
    { key: 'monitor_1', x: 13, y: 65, w: 113, h: 42 },
    { key: 'monitor_2', x: 13, y: 121, w: 112, h: 47 },
    { key: 'monitor_3', x: 13, y: 183, w: 112, h: 52 },
    { key: 'monitor_4', x: 13, y: 248, w: 112, h: 56 },
    { key: 'monitor_5', x: 13, y: 321, w: 112, h: 59 },
    { key: 'monitor_6', x: 13, y: 393, w: 112, h: 62 },
    { key: 'monitor_7', x: 13, y: 469, w: 112, h: 63 },
];

export const CAR_FRAMES: FrameDef[] = [
    { key: 'car_purple', x: 261, y: 582, w: 123, h: 109 },
    { key: 'car_red', x: 388, y: 582, w: 126, h: 109 },
    { key: 'car_green', x: 261, y: 694, w: 123, h: 110 },
    { key: 'car_white', x: 389, y: 694, w: 125, h: 110 },
];

export const SHIP_FRAMES: FrameDef[] = [
    { key: 'ship_small_1', x: 175, y: 258, w: 163, h: 62 },
    { key: 'ship_small_2', x: 177, y: 323, w: 160, h: 64 },
    { key: 'ship_large', x: 142, y: 405, w: 250, h: 72 },
];

export const HUD_FRAMES: FrameDef[] = [
    { key: 'hud_main', x: 149, y: 9, w: 212, h: 49 },
    { key: 'hud_speed_220', x: 230, y: 66, w: 34, h: 14 },
    { key: 'hud_speed_340', x: 228, y: 120, w: 37, h: 14 },
    { key: 'hud_box_1', x: 151, y: 69, w: 42, h: 26 },
    { key: 'hud_box_2', x: 151, y: 122, w: 42, h: 27 },
];

export const BACKGROUND_FRAMES: FrameDef[] = [
    { key: 'track_preview', x: 0, y: 580, w: 229, h: 222 },
];

const ALL_FRAMES: FrameDef[] = [
    ...MONITOR_FRAMES,
    ...CAR_FRAMES,
    ...SHIP_FRAMES,
    ...HUD_FRAMES,
    ...BACKGROUND_FRAMES,
];

export function createTransparentTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(MENU_TRANSPARENT_KEY)) {
        return;
    }

    const texture = scene.textures.get(MENU_KEY);
    const source = texture?.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;

    if (!source) {
        console.warn(`Textura "${MENU_KEY}" não encontrada.`);
        return;
    }

    const canvasTexture = scene.textures.createCanvas(
        MENU_TRANSPARENT_KEY,
        source.width,
        source.height
    );

    if (!canvasTexture) {
        console.warn(`Não foi possível criar canvas texture "${MENU_TRANSPARENT_KEY}".`);
        return;
    }

    const ctx = canvasTexture.context;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;

    const bg = { r: 185, g: 122, b: 87 };
    const tolerance = 10;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isBackground =
            Math.abs(r - bg.r) <= tolerance &&
            Math.abs(g - bg.g) <= tolerance &&
            Math.abs(b - bg.b) <= tolerance;

        if (isBackground) {
            data[i + 3] = 0;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    for (const frame of ALL_FRAMES) {
        canvasTexture.add(frame.key, 0, frame.x, frame.y, frame.w, frame.h);
    }

    canvasTexture.refresh();
}

export function createAnimations(scene: Phaser.Scene): void {
    if (!scene.anims.exists('monitor-open')) {
        scene.anims.create({
            key: 'monitor-open',
            frames: MONITOR_FRAMES.map((frame) => ({
                key: MENU_TRANSPARENT_KEY,
                frame: frame.key
            })),
            frameRate: 8,
            repeat: 0
        });
    }
}

export function createMonitor(scene: Phaser.Scene, x = 512, y = 384): Phaser.GameObjects.Sprite {
    const monitor = scene.add.sprite(x, y, MENU_TRANSPARENT_KEY, 'monitor_0');
    monitor.play('monitor-open');
    return monitor;
}

export function createAtlasSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frame: string
): Phaser.GameObjects.Sprite {
    return scene.add.sprite(x, y, MENU_TRANSPARENT_KEY, frame);
}