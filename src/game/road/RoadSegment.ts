export interface RoadColors {
    road: number;
    grass: number;
    rumble: number;
    startLine: number;
    lane?: number;
}

export interface SpriteObject {
    source: string;     // Nome da imagem/frame no Phaser
    offset: number;     // -1 (esquerda), 1 (direita), 0 (centro)
    scale?: number;     // Escala personalizada
    frame?: number;     // Índice do frame (para spritesheets)
}

export class RoadSegment {
    index: number;
    p1: { world: { x: number, y: number, z: number }, screen: { x: number, y: number, w: number, scale?: number } };
    p2: { world: { x: number, y: number, z: number }, screen: { x: number, y: number, w: number, scale?: number } };
    curve: number;
    colors: RoadColors;
    public isStartLine: boolean = false;
    public sprites: SpriteObject[] = [];

    constructor(index: number, z1: number, z2: number, curve: number, colors: RoadColors) {
        this.index = index;
        this.p1 = { world: { x: 0, y: 0, z: z1 }, screen: { x: 0, y: 0, w: 0 } };
        this.p2 = { world: { x: 0, y: 0, z: z2 }, screen: { x: 0, y: 0, w: 0 } };
        this.curve = curve;
        this.colors = colors;
    }
}
