import { TrackData } from "./trackTypes";

export const track1: TrackData = {
    id: 1,
    name: 'Nebula Road',
    palette: {
        light: { road: 0x444444, grass: 0x101010, rumble: 0x555555, lane: 0xcccccc, startLine: 0xffffff },
        dark: { road: 0x404040, grass: 0x000000, rumble: 0xbb0000, startLine: 0xffffff }
    },
    segments: [
        // Reta Inferior (Largada - Estreita)
        { length: 100, curve: 0, hill: 0 },
        // Curva 1 (Canto Inferior Direito)
        { length: 30, curve: 8, hill: 0 },
        // Reta Lateral Direita (Longa - Sobe)
        { length: 50, curve: 0, hill: 0 },
        // Curva 2 (Canto Superior Direito)
        { length: 30, curve: 8, hill: 0 },
        // Reta Superior (Topo - Estreita)
        { length: 100, curve: 0, hill: 0 },
        // Curva 3 (Canto Superior Esquerdo)
        { length: 30, curve: 8, hill: 0 },
        // Reta Lateral Esquerda (Longa - Desce)
        { length: 50, curve: 0, hill: 0 },
        // Curva 4 (Canto Inferior Esquerdo)
        { length: 30, curve: 8, hill: 0 }
    ],
    trackMapFrame: 'track_01',
    trackMapOffset: 0
};