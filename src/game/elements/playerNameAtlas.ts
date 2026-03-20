const FONT_KEY = 'font-sheet';
const FONT_TRANSPARENT_KEY = 'font-sheet-transparent';

type FrameDef = {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

export const FONT_FRAMES: FrameDef[] = [
    // linha 1 - amarelo
    { key: 'A', x: 13, y: 7, w: 10, h: 11 },
    { key: 'B', x: 28, y: 7, w: 10, h: 11 },
    { key: 'C', x: 43, y: 7, w: 10, h: 11 },
    { key: 'D', x: 58, y: 7, w: 10, h: 11 },
    { key: 'E', x: 73, y: 7, w: 10, h: 11 },
    { key: 'F', x: 88, y: 7, w: 10, h: 11 },
    { key: 'G', x: 103, y: 7, w: 10, h: 11 },
    { key: 'H', x: 118, y: 7, w: 10, h: 11 },
    { key: 'I', x: 133, y: 7, w: 10, h: 11 },
    { key: 'J', x: 148, y: 7, w: 10, h: 11 },
    { key: 'K', x: 163, y: 7, w: 10, h: 11 },
    { key: 'L', x: 178, y: 7, w: 10, h: 11 },
    { key: 'M', x: 193, y: 7, w: 10, h: 11 },

    // linha 2 - amarelo
    { key: 'N', x: 13, y: 22, w: 10, h: 11 },
    { key: 'O', x: 28, y: 22, w: 10, h: 11 },
    { key: 'P', x: 43, y: 22, w: 10, h: 11 },
    { key: 'Q', x: 58, y: 22, w: 10, h: 11 },
    { key: 'R', x: 73, y: 22, w: 10, h: 11 },
    { key: 'S', x: 88, y: 22, w: 10, h: 11 },
    { key: 'T', x: 103, y: 22, w: 10, h: 11 },
    { key: 'U', x: 118, y: 22, w: 10, h: 11 },
    { key: 'V', x: 133, y: 22, w: 10, h: 11 },
    { key: 'W', x: 148, y: 22, w: 10, h: 11 },
    { key: 'X', x: 163, y: 22, w: 10, h: 11 },
    { key: 'Y', x: 178, y: 22, w: 10, h: 11 },
    { key: 'Z', x: 193, y: 22, w: 10, h: 11 },

    // linha 3 - especiais amarelos
    { key: 'dash_yellow', x: 13, y: 42, w: 10, h: 4 },
    { key: 'del', x: 48, y: 37, w: 23, h: 11 },
    { key: 'end', x: 92, y: 37, w: 34, h: 11 },
    { key: 'cursor_red_top', x: 122, y: 36, w: 18, h: 15 },

    // linha 4 - azul
    { key: 'A_blue', x: 13, y: 58, w: 10, h: 14 },
    { key: 'B_blue', x: 28, y: 58, w: 10, h: 14 },
    { key: 'C_blue', x: 43, y: 58, w: 10, h: 14 },
    { key: 'D_blue', x: 58, y: 58, w: 10, h: 14 },
    { key: 'E_blue', x: 73, y: 58, w: 10, h: 14 },
    { key: 'F_blue', x: 88, y: 58, w: 10, h: 14 },
    { key: 'G_blue', x: 103, y: 58, w: 10, h: 14 },
    { key: 'H_blue', x: 118, y: 58, w: 10, h: 14 },
    { key: 'I_blue', x: 133, y: 58, w: 10, h: 14 },
    { key: 'J_blue', x: 148, y: 58, w: 10, h: 14 },
    { key: 'K_blue', x: 163, y: 58, w: 10, h: 14 },
    { key: 'L_blue', x: 178, y: 58, w: 10, h: 14 },

    // linha 5 - azul
    { key: 'M_blue', x: 13, y: 77, w: 10, h: 14 },
    { key: 'N_blue', x: 28, y: 77, w: 10, h: 14 },
    { key: 'O_blue', x: 43, y: 77, w: 10, h: 14 },
    { key: 'P_blue', x: 58, y: 77, w: 10, h: 14 },
    { key: 'Q_blue', x: 73, y: 77, w: 10, h: 14 },
    { key: 'R_blue', x: 88, y: 77, w: 10, h: 14 },
    { key: 'S_blue', x: 103, y: 77, w: 10, h: 14 },
    { key: 'T_blue', x: 118, y: 77, w: 10, h: 14 },
    { key: 'U_blue', x: 133, y: 77, w: 10, h: 14 },
    { key: 'V_blue', x: 148, y: 77, w: 10, h: 14 },
    { key: 'W_blue', x: 163, y: 77, w: 10, h: 14 },
    { key: 'X_blue', x: 178, y: 77, w: 10, h: 14 },

    // linha 6 - azul + números verdes
    { key: 'Y_blue', x: 13, y: 97, w: 10, h: 14 },
    { key: 'Z_blue', x: 28, y: 97, w: 10, h: 14 },
    { key: '0', x: 43, y: 97, w: 10, h: 14 },
    { key: '1', x: 58, y: 97, w: 10, h: 14 },
    { key: '2', x: 73, y: 97, w: 10, h: 14 },
    { key: '3', x: 88, y: 97, w: 10, h: 14 },
    { key: '4', x: 103, y: 97, w: 10, h: 14 },
    { key: '5', x: 118, y: 97, w: 10, h: 14 },
    { key: '6', x: 133, y: 97, w: 10, h: 14 },
    { key: '7', x: 148, y: 97, w: 10, h: 14 },
    { key: '8', x: 163, y: 97, w: 10, h: 14 },
    { key: '9', x: 178, y: 97, w: 10, h: 14 },

    // linha 7 - símbolos
    { key: '.', x: 13, y: 120, w: 4, h: 4 },
    { key: '?', x: 29, y: 115, w: 10, h: 14 },
    { key: '!', x: 44, y: 115, w: 4, h: 14 },
    { key: 'cursor_red_bottom', x: 58, y: 114, w: 16, h: 18 },
    { key: 'dash_red', x: 90, y: 121, w: 10, h: 4 },
];

export function preloadPlayerNameAtlas(scene: Phaser.Scene): void {
    scene.load.image(FONT_KEY, './assets/font.png');
}

export function createPlayerNameAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists(FONT_TRANSPARENT_KEY)) {
        return;
    }

    const texture = scene.textures.get(FONT_KEY);
    const source = texture?.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;

    if (!source) {
        console.warn(`Textura "${FONT_KEY}" não encontrada.`);
        return;
    }

    const canvasTexture = scene.textures.createCanvas(
        FONT_TRANSPARENT_KEY,
        source.width,
        source.height
    );

    if (!canvasTexture) {
        console.warn(`Não foi possível criar "${FONT_TRANSPARENT_KEY}".`);
        return;
    }

    const ctx = canvasTexture.context;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;

    const bg = { r: 163, g: 73, b: 164 };
    const tolerance = 16;

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

    for (const frame of FONT_FRAMES) {
        canvasTexture.add(frame.key, 0, frame.x, frame.y, frame.w, frame.h);
    }

    canvasTexture.refresh();
}

export function createFontSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frame: string
): Phaser.GameObjects.Sprite {
    return scene.add.sprite(x, y, FONT_TRANSPARENT_KEY, frame);
}

export function hasFontFrame(scene: Phaser.Scene, frame: string): boolean {
    return scene.textures.get(FONT_TRANSPARENT_KEY)?.has(frame) ?? false;
}

export function buildAtlasJsonLike() {
    return {
        meta: {
            image: 'font.png',
            size: { w: 222, h: 159 },
            scale: '1'
        },
        frames: Object.fromEntries(
            FONT_FRAMES.map((frame) => [
                frame.key,
                {
                    frame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
                    rotated: false,
                    trimmed: false,
                    spriteSourceSize: { x: 0, y: 0, w: frame.w, h: frame.h },
                    sourceSize: { w: frame.w, h: frame.h }
                }
            ])
        )
    };
}

export { FONT_TRANSPARENT_KEY };