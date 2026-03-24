
export interface TrackPalette {
    road: number;
    grass: number;
    rumble: number;
    startLine: number; // Cor específica para a linha de chegada
    lane?: number;
}

export interface TrackRechargeZone {
    startSegment: number;
    endSegment: number;
    side: 'left' | 'right';
    color?: number;
    width?: number;
    refuelPerSecond?: number;
}

export interface TrackRepairZone {
    startSegment: number;
    endSegment: number;
    side: 'left' | 'right';
    color?: number;
    width?: number;
    healPerSecond?: number;
}

export interface TrackData {
    id: number;
    name: string;
    palette: {
        light: TrackPalette;
        dark: TrackPalette;
    };
    segments: Array<{
        length: number;
        curve: number;
        hill: number;
    }>;
    trackMapFrame?: string;
    trackMapOffset?: number;
    macroPath?: Array<{
        x: number;
        z: number;
    }>;
    rechargeZone?: TrackRechargeZone;
    repairZone?: TrackRepairZone;
}

export interface TrackSegmentData {
    length: number;
    curve: number;
    hill: number;
}
