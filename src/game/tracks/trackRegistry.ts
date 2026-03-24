import { TrackData, TrackPalette } from "./trackTypes";
import { track1 } from "./track1";
import { track2 } from "./track2";
import { track3 } from "./track3";

const PALETTES: Record<string, { light: TrackPalette, dark: TrackPalette }> = {
    Nebula: {
        light: { road: 0x444444, grass: 0x101010, rumble: 0x555555, lane: 0xcccccc, startLine: 0xffffff },
        dark: { road: 0x404040, grass: 0x000000, rumble: 0xbb0000, startLine: 0xffffff }
    },
    Mars: {
        light: { road: 0x664444, grass: 0x331111, rumble: 0x884444, lane: 0xdd8888, startLine: 0xffffff },
        dark: { road: 0x553333, grass: 0x220000, rumble: 0xcc4444, startLine: 0xffffff }
    },
    Toxic: {
        light: { road: 0x446644, grass: 0x113311, rumble: 0x448844, lane: 0x88dd88, startLine: 0xffffff },
        dark: { road: 0x335533, grass: 0x002200, rumble: 0x44cc44, startLine: 0xffffff }
    },
    Ice: {
        light: { road: 0xaaaaee, grass: 0xeeeeff, rumble: 0x8888dd, lane: 0xffffff, startLine: 0xffffff },
        dark: { road: 0x8888cc, grass: 0xcceecc, rumble: 0x6666bb, startLine: 0xffffff }
    }
};

const PALETTE_NAMES = ['Nebula', 'Mars', 'Toxic', 'Ice'];

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBackgroundFrame(trackId: number) {
    const frameId = ((trackId - 1) % 56) + 1;
    return `bg_${frameId.toString().padStart(2, '0')}`;
}

function getBackgroundSkyColor(paletteName: string) {
    switch (paletteName) {
        case 'Mars':
            return 0xe1c7cf;
        case 'Toxic':
            return 0x1a1c44;
        case 'Ice':
            return 0xb7c7f2;
        default:
            return 0x7f93dc;
    }
}

function generateRandomSegments(count: number) {
    const segments = [];
    for (let i = 0; i < count; i++) {
        segments.push({
            length: randInt(50, 200),
            curve: randInt(-4, 4),
            hill: randInt(-30, 30)
        });
    }
    // Ensure hills sum to zero
    const totalHill = segments.reduce((acc, s) => acc + s.hill, 0);
    segments[segments.length - 1].hill -= totalHill;
    
    return segments;
}

function generateRechargeZone(segments: { length: number }[], trackId: number) {
    const totalSegments = segments.reduce((acc, segment) => acc + segment.length, 0);
    const startSegment = Math.floor(totalSegments * 0.2);

    return {
        startSegment,
        endSegment: Math.min(totalSegments - 1, startSegment + 64),
        side: trackId % 2 === 0 ? 'left' as const : 'right' as const,
        color: 0xff2020,
        width: 0.48,
        refuelPerSecond: 28
    };
}

function generateRepairZone(segments: { length: number }[], trackId: number) {
    const totalSegments = segments.reduce((acc, segment) => acc + segment.length, 0);
    const startSegment = Math.floor(totalSegments * 0.48);

    return {
        startSegment,
        endSegment: Math.min(totalSegments - 1, startSegment + 72),
        side: trackId % 2 === 0 ? 'right' as const : 'left' as const,
        color: 0x2a8cff,
        width: 0.62,
        healPerSecond: 24
    };
}

export const TRACK_COLLECTION: TrackData[] = [
    track1,
    track2,
    track3
];

for (let i = 4; i <= 34; i++) {
    const paletteName = PALETTE_NAMES[(i - 1) % PALETTE_NAMES.length];
    const frameNumber = i.toString().padStart(2, '0');
    const segments = generateRandomSegments(randInt(30, 60));
    
    TRACK_COLLECTION.push({
        id: i,
        name: `${paletteName} Track ${i}`,
        backgroundFrame: getBackgroundFrame(i),
        backgroundSkyColor: getBackgroundSkyColor(paletteName),
        palette: PALETTES[paletteName],
        segments,
        rechargeZone: generateRechargeZone(segments, i),
        repairZone: generateRepairZone(segments, i),
        trackMapFrame: `track_${frameNumber}`,
        trackMapOffset: 0
    });
}
