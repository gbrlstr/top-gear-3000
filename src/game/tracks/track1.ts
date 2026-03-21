import { TrackData } from "./trackTypes";

export const track1: TrackData = {
    id: 'track1',
    name: 'Nebula Road',
    palette: {
        light: { road: 0x444444, grass: 0x101010, rumble: 0x555555, lane: 0xcccccc },
        dark:  { road: 0x404040, grass: 0x000000, rumble: 0xbb0000 }
    },
    segments: [
        { length: 50, curve: 0, hill: 0 },
        { length: 80, curve: 0, hill: 20 },   // Hill up
        { length: 80, curve: 0, hill: -20 },  // Hill down
        { length: 150, curve: 2, hill: 0 },   // Long right curve
        { length: 50, curve: 0, hill: 0 },
        { length: 150, curve: -4, hill: 0 },  // Sharp left curve
        { length: 100, curve: 0, hill: 10 },  // Small hill
        { length: 100, curve: 5, hill: -10 }, // Hard right while going down
        { length: 200, curve: 0, hill: 0 }    // Straight finish
    ]
};
