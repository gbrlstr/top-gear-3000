import { TrackData } from "./trackTypes";

export const track1: TrackData = {
    id: 1,
    name: 'Nebula Road',
    palette: {
        light: { road: 0x444444, grass: 0x101010, rumble: 0x555555, lane: 0xcccccc, startLine: 0xffffff },
        dark: { road: 0x404040, grass: 0x000000, rumble: 0xbb0000, startLine: 0xffffff }
    },
    segments: [
        { length: 150, curve: 0, hill: 0 },   // Start Straight
        { length: 100, curve: 0, hill: 20 },  // First Hill
        { length: 100, curve: 1, hill: 0 },   // Gentle Right turn
        { length: 100, curve: 3, hill: -20 }, // Harder Right down hill
        { length: 200, curve: 0, hill: 0 },   // Long Straight
        { length: 150, curve: -2, hill: 10 }, // Left turn up hill
        { length: 100, curve: -4, hill: 0 },  // Sharp Left
        { length: 150, curve: 0, hill: -10 }, // Straight down
        { length: 200, curve: 4, hill: 0 },   // Final Hard Right to close loop
        { length: 100, curve: 0, hill: 0 }    // Final Straight
    ],
    trackMapFrame: 'track_01',
    trackMapOffset: 0.15
};
