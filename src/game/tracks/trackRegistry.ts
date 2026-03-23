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

export const TRACK_COLLECTION: TrackData[] = [
    track1,
    track2,
    track3
];

for (let i = 4; i <= 34; i++) {
    const paletteName = PALETTE_NAMES[(i - 1) % PALETTE_NAMES.length];
    const frameNumber = i.toString().padStart(2, '0');
    
    TRACK_COLLECTION.push({
        id: i,
        name: `${paletteName} Track ${i}`,
        palette: PALETTES[paletteName],
        segments: generateRandomSegments(randInt(30, 60)),
        trackMapFrame: `track_${frameNumber}`,
        trackMapOffset: 0
    });
}
