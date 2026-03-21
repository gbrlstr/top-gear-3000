export interface RoadColors {
    road: number;
    grass: number;
    rumble: number;
    lane?: number;
}

export class RoadSegment {
    index: number;
    p1: { world: { x: number, y: number, z: number }, screen: { x: number, y: number, w: number } };
    p2: { world: { x: number, y: number, z: number }, screen: { x: number, y: number, w: number } };
    curve: number;
    colors: RoadColors;

    constructor(index: number, z1: number, z2: number, curve: number, colors: RoadColors) {
        this.index = index;
        this.p1 = { world: { x: 0, y: 0, z: z1 }, screen: { x: 0, y: 0, w: 0 } };
        this.p2 = { world: { x: 0, y: 0, z: z2 }, screen: { x: 0, y: 0, w: 0 } };
        this.curve = curve;
        this.colors = colors;
    }
}
