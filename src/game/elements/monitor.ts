const MENU_KEY = 'menu';
const MENU_TRANSPARENT_KEY = 'menu-transparent';

type FrameDef = {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

// coordenadas do monitor na imagem que você mandou
const MONITOR_FRAMES: FrameDef[] = [
    { key: 'monitor-0', x: 12, y: 9, w: 114, h: 37 },
    { key: 'monitor-1', x: 13, y: 65, w: 113, h: 42 },
    { key: 'monitor-2', x: 13, y: 121, w: 112, h: 47 },
    { key: 'monitor-3', x: 13, y: 183, w: 112, h: 52 },
    { key: 'monitor-4', x: 13, y: 248, w: 112, h: 56 },
    { key: 'monitor-5', x: 13, y: 321, w: 112, h: 59 },
    { key: 'monitor-6', x: 13, y: 393, w: 112, h: 62 },
    { key: 'monitor-7', x: 13, y: 469, w: 112, h: 63 },
];

export const CAR_FRAMES: FrameDef[] = [
    { key: 'car-purple', x: 300, y: 820, w: 120, h: 80 },
    { key: 'car-red', x: 430, y: 820, w: 120, h: 80 },
    { key: 'car-green', x: 300, y: 910, w: 120, h: 80 },
    { key: 'car-white', x: 430, y: 910, w: 120, h: 80 },
];

export const SHIP_FRAMES: FrameDef[] = [
    { key: 'ship-1', x: 250, y: 420, w: 220, h: 100 },
    { key: 'ship-2', x: 250, y: 530, w: 220, h: 100 },
];

export const createAtlasFrames = (scene: Phaser.Scene) => {
    const texture = scene.textures.get('menu-transparent');

    const allFrames = [
        ...MONITOR_FRAMES,
        ...CAR_FRAMES,
        ...SHIP_FRAMES
    ];

    allFrames.forEach(frame => {
        texture.add(frame.key, 0, frame.x, frame.y, frame.w, frame.h);
    });
};

export const loadSprites = (scene: Phaser.Scene) => {
    scene.load.image(MENU_KEY, './assets/menu.png');
};

export const createMonitorTexture = (scene: Phaser.Scene) => {
    if (scene.textures.exists(MENU_TRANSPARENT_KEY)) {
        return;
    }

    const source = scene.textures.get(MENU_KEY).getSourceImage() as HTMLImageElement;

    const canvasTexture = scene.textures.createCanvas(
        MENU_TRANSPARENT_KEY,
        source.width,
        source.height
    );

    if (!canvasTexture) {
        return;
    }

    const ctx = canvasTexture.context;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;

    // cor do fundo marrom da imagem
    const bg = { r: 185, g: 122, b: 87 };

    // tolerância para remover tons muito próximos
    const tolerance = 8;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isBackground =
            Math.abs(r - bg.r) <= tolerance &&
            Math.abs(g - bg.g) <= tolerance &&
            Math.abs(b - bg.b) <= tolerance;

        if (isBackground) {
            data[i + 3] = 0; // alpha
        }
    }

    ctx.putImageData(imageData, 0, 0);

    MONITOR_FRAMES.forEach((frame) => {
        canvasTexture.add(frame.key, 0, frame.x, frame.y, frame.w, frame.h);
    });

    canvasTexture.refresh();
};

export const createAnimations = (scene: Phaser.Scene) => {
    if (scene.anims.exists('monitor-idle')) {
        return;
    }

    scene.anims.create({
        key: 'monitor-idle',
        frames: MONITOR_FRAMES.map((frame) => ({
            key: MENU_TRANSPARENT_KEY,
            frame: frame.key
        })),
        frameRate: 8,
        repeat: 0
    });
};

export const createMonitor = (scene: Phaser.Scene, x = 512, y = 384) => {
    const monitor = scene.add.sprite(x, y, MENU_TRANSPARENT_KEY, 'monitor-0');

    monitor.play('monitor-idle');

    return monitor;
};