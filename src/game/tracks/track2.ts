import { TrackData } from "./trackTypes";

export const track2: TrackData = {
    id: 2,
    name: 'Red Canyon',
    backgroundFrame: 'bg_05',
    backgroundSkyColor: 0xe6d2d8,
    palette: {
        light: { road: 0x664444, grass: 0x331111, rumble: 0x884444, lane: 0xdd8888, startLine: 0xffffff },
        dark: { road: 0x553333, grass: 0x220000, rumble: 0xcc4444, startLine: 0xffffff }
    },
    segments: [
        // Entrada curta (largada)
        { length: 55, curve: 0, hill: 0 },

        // Lateral direita quase reta (subida da gota)
        { length: 90, curve: 2, hill: 0 },
        { length: 95, curve: 3, hill: 0 },

        // Curva do topo fechando para a esquerda
        { length: 70, curve: 9, hill: 0 },
        { length: 65, curve: 10, hill: 0 },

        // Descida do lado esquerdo
        { length: 95, curve: 5, hill: 0 },
        { length: 85, curve: 4, hill: 0 },

        // Recorte interno (pequena quina para dentro)
        { length: 35, curve: -2, hill: 0 },
        { length: 45, curve: 6, hill: 0 },

        // Bulbo inferior da gota
        { length: 75, curve: 8, hill: 0 },
        { length: 85, curve: 7, hill: 0 },
        { length: 70, curve: 6, hill: 0 },

        // Retorno para alinhar com a reta de início
        { length: 60, curve: 4, hill: 0 },
        { length: 50, curve: 2, hill: 0 },
        { length: 55, curve: 0, hill: 0 }
    ],
    rechargeZone: {
        startSegment: 138,
        endSegment: 208,
        side: 'right',
        color: 0xff2020,
        width: 0.48,
        refuelPerSecond: 28
    },
    repairZone: {
        startSegment: 220,
        endSegment: 340,
        side: 'left',
        color: 0x2a8cff,
        width: 0.62,
        healPerSecond: 24
    },
    trackMapFrame: 'track_02',
    trackMapOffset: 0.043,
    macroPath: [
        { x: 23.0, z: 15.0 },
        { x: 23.0, z: 16.0 },
        { x: 23.0, z: 17.0 },
        { x: 23.0, z: 18.0 },
        { x: 23.0, z: 19.0 },
        { x: 23.0, z: 20.0 },
        { x: 23.0, z: 21.0 },
        { x: 23.0, z: 22.0 },
        { x: 23.0, z: 23.0 },
        { x: 23.0, z: 24.0 },
        { x: 23.0, z: 25.0 },
        { x: 22.5, z: 26.0 },
        { x: 22.5, z: 27.0 },
        { x: 22.0, z: 28.0 },
        { x: 20.0, z: 29.0 },
        { x: 18.0, z: 30.0 },
        { x: 16.5, z: 31.0 },
        { x: 12.0, z: 32.0 },
        { x: 12.0, z: 33.0 },
        { x: 10.5, z: 34.0 },
        { x: 9.5, z: 35.0 },
        { x: 9.5, z: 36.0 },
        { x: 4.0, z: 31.0 },
        { x: 3.0, z: 30.0 },
        { x: 3.0, z: 29.0 },
        { x: 3.0, z: 28.0 },
        { x: 4.0, z: 27.0 },
        { x: 5.0, z: 26.0 },
        { x: 6.0, z: 25.0 },
        { x: 7.0, z: 24.0 },
        { x: 8.0, z: 23.0 },
        { x: 8.0, z: 22.0 },
        { x: 8.5, z: 21.0 },
        { x: 9.0, z: 20.0 },
        { x: 8.5, z: 19.0 },
        { x: 8.0, z: 18.0 },
        { x: 7.0, z: 17.0 },
        { x: 6.5, z: 16.0 },
        { x: 6.0, z: 15.0 },
        { x: 6.5, z: 14.0 },
        { x: 7.0, z: 13.0 },
        { x: 8.0, z: 12.0 },
        { x: 9.0, z: 11.0 },
        { x: 10.0, z: 10.0 },
        { x: 10.0, z: 9.0 },
        { x: 11.0, z: 8.0 },
        { x: 12.0, z: 7.0 },
        { x: 13.0, z: 6.0 },
        { x: 14.2, z: 4.8 },
        { x: 15.4, z: 3.0 },
        { x: 16.8, z: 1.4 },
        { x: 18.6, z: 0.8 },
        { x: 20.0, z: 1.6 },
        { x: 21.2, z: 3.6 },
        { x: 22.0, z: 6.0 },
        { x: 22.5, z: 8.5 },
        { x: 22.8, z: 11.0 },
        { x: 23.0, z: 13.2 },
        { x: 23.0, z: 14.2 }
    ]
};
