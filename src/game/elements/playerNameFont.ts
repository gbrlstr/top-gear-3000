const FONT_KEY = 'player-name-font';
export const FONT_TRANSPARENT_KEY = 'player-name-font-transparent';

type FrameDef = {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

export const FONT_FRAMES: FrameDef[] = [
    // amarelo - linha 1
    { key: 'A', x: 13, y: 7, w: 9, h: 8 },
    { key: 'B', x: 29, y: 7, w: 9, h: 8 },
    { key: 'C', x: 45, y: 7, w: 9, h: 8 },
    { key: 'D', x: 61, y: 7, w: 9, h: 8 },
    { key: 'E', x: 77, y: 7, w: 9, h: 8 },
    { key: 'F', x: 93, y: 7, w: 9, h: 8 },
    { key: 'G', x: 109, y: 7, w: 9, h: 8 },
    { key: 'H', x: 125, y: 7, w: 9, h: 8 },
    { key: 'I', x: 141, y: 7, w: 6, h: 8 },
    { key: 'J', x: 157, y: 7, w: 8, h: 8 },
    { key: 'K', x: 173, y: 7, w: 9, h: 8 },
    { key: 'L', x: 189, y: 7, w: 8, h: 8 },
    { key: 'M', x: 205, y: 7, w: 9, h: 8 },

    // amarelo - linha 2
    { key: 'N', x: 13, y: 23, w: 9, h: 8 },
    { key: 'O', x: 29, y: 23, w: 9, h: 8 },
    { key: 'P', x: 45, y: 23, w: 9, h: 8 },
    { key: 'Q', x: 61, y: 23, w: 9, h: 8 },
    { key: 'R', x: 77, y: 23, w: 9, h: 8 },
    { key: 'S', x: 93, y: 23, w: 9, h: 8 },
    { key: 'T', x: 109, y: 23, w: 8, h: 8 },
    { key: 'U', x: 125, y: 23, w: 9, h: 8 },
    { key: 'V', x: 141, y: 23, w: 9, h: 8 },
    { key: 'W', x: 157, y: 23, w: 9, h: 8 },
    { key: 'X', x: 173, y: 23, w: 9, h: 8 },
    { key: 'Y', x: 189, y: 23, w: 8, h: 8 },
    { key: 'Z', x: 205, y: 23, w: 9, h: 8 },

    // especiais amarelos
    { key: '!', x: 12, y: 38, w: 8, h: 10 },
    { key: '.', x: 28, y: 43, w: 5, h: 5 },
    { key: '_', x: 45, y: 43, w: 8, h: 3 },
    { key: 'del', x: 61, y: 38, w: 21, h: 10 },
    { key: 'end', x: 90, y: 38, w: 34, h: 10 },

    // cursor vermelho superior
    { key: 'cursor_red_top', x: 125, y: 36, w: 33, h: 15 },

    // azul
    { key: 'A_blue', x: 12, y: 57, w: 10, h: 18 },
    { key: 'B_blue', x: 28, y: 57, w: 10, h: 18 },
    { key: 'C_blue', x: 44, y: 57, w: 10, h: 18 },
    { key: 'D_blue', x: 60, y: 57, w: 10, h: 18 },
    { key: 'E_blue', x: 76, y: 57, w: 10, h: 18 },
    { key: 'F_blue', x: 92, y: 57, w: 10, h: 18 },
    { key: 'G_blue', x: 108, y: 57, w: 10, h: 18 },
    { key: 'H_blue', x: 124, y: 57, w: 10, h: 18 },
    { key: 'I_blue', x: 140, y: 57, w: 8, h: 18 },
    { key: 'J_blue', x: 156, y: 57, w: 9, h: 18 },
    { key: 'K_blue', x: 172, y: 57, w: 10, h: 18 },
    { key: 'L_blue', x: 188, y: 57, w: 10, h: 18 },

    { key: 'M_blue', x: 12, y: 81, w: 10, h: 18 },
    { key: 'N_blue', x: 28, y: 81, w: 10, h: 18 },
    { key: 'O_blue', x: 44, y: 81, w: 10, h: 18 },
    { key: 'P_blue', x: 60, y: 81, w: 10, h: 18 },
    { key: 'Q_blue', x: 76, y: 81, w: 10, h: 18 },
    { key: 'R_blue', x: 92, y: 81, w: 10, h: 18 },
    { key: 'S_blue', x: 108, y: 81, w: 10, h: 18 },
    { key: 'T_blue', x: 124, y: 81, w: 10, h: 18 },
    { key: 'U_blue', x: 140, y: 81, w: 10, h: 18 },
    { key: 'V_blue', x: 156, y: 81, w: 10, h: 18 },
    { key: 'W_blue', x: 172, y: 81, w: 10, h: 18 },
    { key: 'X_blue', x: 188, y: 81, w: 10, h: 18 },

    { key: 'Y_blue', x: 12, y: 105, w: 10, h: 18 },
    { key: 'Z_blue', x: 28, y: 105, w: 10, h: 18 },

    // números verdes
    { key: '0', x: 44, y: 105, w: 10, h: 18 },
    { key: '1', x: 60, y: 105, w: 8, h: 18 },
    { key: '2', x: 76, y: 105, w: 10, h: 18 },
    { key: '3', x: 92, y: 105, w: 10, h: 18 },
    { key: '4', x: 108, y: 105, w: 10, h: 18 },
    { key: '5', x: 124, y: 105, w: 10, h: 18 },
    { key: '6', x: 140, y: 105, w: 10, h: 18 },
    { key: '7', x: 156, y: 105, w: 10, h: 18 },
    { key: '8', x: 172, y: 105, w: 10, h: 18 },
    { key: '9', x: 188, y: 105, w: 10, h: 18 },

    // linha inferior
    { key: 'dot_blue', x: 12, y: 140, w: 6, h: 7 },
    { key: 'question_blue', x: 28, y: 128, w: 10, h: 18 },
    { key: 'exclam_blue', x: 44, y: 128, w: 7, h: 18 },
    { key: 'cursor_red_bottom', x: 56, y: 127, w: 16, h: 26 },
    { key: 'dash_red', x: 79, y: 139, w: 10, h: 4 },
];

export function preloadPlayerNameFont(scene: Phaser.Scene): void {
    scene.load.image(FONT_KEY, '/assets/font.png');
}

export function createPlayerNameFontTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(FONT_TRANSPARENT_KEY)) return;

    const source = scene.textures.get(FONT_KEY)?.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!source) return;

    const canvasTexture = scene.textures.createCanvas(
        FONT_TRANSPARENT_KEY,
        source.width,
        source.height
    );

    if (!canvasTexture) return;

    const ctx = canvasTexture.context;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;

    const bg = { r: 163, g: 73, b: 164 };
    const tolerance = 3;

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

export function getFontFrame(scene: Phaser.Scene, frame: string) {
    return scene.textures.get(FONT_TRANSPARENT_KEY).get(frame);
}