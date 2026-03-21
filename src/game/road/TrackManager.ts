import { RoadSegment } from './RoadSegment';
import { TrackData } from '../tracks/trackTypes';
import { RoadProjector } from './RoadProjector';

export class TrackManager {
    segments: RoadSegment[] = [];
    trackLength = 0;
    position = 0;
    segmentLength = 150; // Padrão clássico do OutRun

    constructor(trackData: TrackData) {
        this.buildTrack(trackData);
    }

    private buildTrack(data: TrackData) {
        let z = 0;
        let y = 0;
        for (let s = 0; s < data.segments.length; s++) {
            const segData = data.segments[s];
            for (let i = 0; i < segData.length; i++) {
                const isEven = Math.floor(this.segments.length / 3) % 2 === 0;
                const colors = isEven ? data.palette.light : data.palette.dark;

                const segment = new RoadSegment(
                    this.segments.length,
                    z,
                    z + this.segmentLength,
                    segData.curve,
                    colors
                );

                segment.p1.world.y = y;
                y += segData.hill;
                segment.p2.world.y = y;

                this.segments.push(segment);
                z += this.segmentLength;
            }
        }
        this.trackLength = this.segments.length * this.segmentLength;
    }

    update(speed: number) {
        this.position += speed;
        // Lógica de loop infinito (Wrap around)
        while (this.position >= this.trackLength) this.position -= this.trackLength;
        while (this.position < 0) this.position += this.trackLength;
    }

    getSegmentsToRender(drawDistance: number): RoadSegment[] {
        const startLine = Math.floor(this.position / this.segmentLength);
        const result: RoadSegment[] = [];

        for (let n = 0; n < drawDistance; n++) {
            const segment = this.segments[(startLine + n) % this.segments.length];
            result.push(segment);
        }
        return result;
    }

    projectSegments(
        segments: RoadSegment[],
        cameraX: number,
        cameraY: number,
        cameraDepth: number,
        width: number,
        height: number,
        roadWidth: number
    ) {
        let x = 0;
        let dx = 0;
        const startLine = Math.floor(this.position / this.segmentLength);

        for (let n = 0; n < segments.length; n++) {
            const segment = segments[n];
            const loopOffset = (startLine + n) >= this.segments.length ? this.trackLength : 0;

            // O segredo para subidas: cameraY deve subtrair a altura do segmento base
            // para que o carro suba junto com a pista
            RoadProjector.project(
                segment.p1,
                segment.p1.world.z - loopOffset,
                cameraX - x,
                cameraY, // Aqui será ajustado na RaceScene
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth
            );

            RoadProjector.project(
                segment.p2,
                segment.p2.world.z - loopOffset,
                cameraX - (x + dx),
                cameraY,
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth
            );

            x += dx;
            dx += segment.curve;
        }
    }
}