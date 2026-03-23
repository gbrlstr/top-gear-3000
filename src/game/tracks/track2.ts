import { TrackData } from "./trackTypes";

export const track2: TrackData = {
    id: 2,
    name: 'Red Canyon',
    palette: {
        light: { road: 0x664444, grass: 0x331111, rumble: 0x884444, lane: 0xdd8888, startLine: 0xffffff },
        dark: { road: 0x553333, grass: 0x220000, rumble: 0xcc4444, startLine: 0xffffff }
    },
    segments: [
        { length: 300, curve: 0, hill: 0 },    // Long Start Straight (Right Side)
        { length: 100, curve: -8, hill: 20 },  // Top-Right Turn (Sharp Left)
        { length: 150, curve: 0, hill: 0 },    // Top Straight
        { length: 100, curve: -4, hill: -20 }, // Top-Left Turn (Moderate Left)
        { length: 300, curve: -2, hill: 0 },   // Long Diagonal Down-Left
        { length: 150, curve: -6, hill: 10 },  // Bottom-Left Curve
        { length: 150, curve: -3, hill: 0 },   // Returning to start
        { length: 200, curve: 0, hill: -10 }   // Final stretch to finish
    ],
    trackMapFrame: 'track_02',
    trackMapOffset: 0
};
