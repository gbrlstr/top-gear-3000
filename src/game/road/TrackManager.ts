import { RoadSegment } from './RoadSegment';
import { TrackData } from '../tracks/trackTypes';
import { RoadProjector } from './RoadProjector';

export class TrackManager {
    segments: RoadSegment[] = [];
    trackLength = 0;
    position = 0;
    segmentLength = 300; // Increased for better high-speed feel

    constructor(trackData: TrackData) {
        this.buildTrack(trackData);
    }

    private buildTrack(data: TrackData) {
        let z = 0;
        let y = 0;
        let dy = 0;

        for (let s = 0; s < data.segments.length; s++) {
            const segData = data.segments[s];
            const nextCurve = data.segments[(s + 1) % data.segments.length].curve;
            const prevCurve = data.segments[s > 0 ? s - 1 : data.segments.length - 1].curve;

            for (let i = 0; i < segData.length; i++) {
                const isEven = Math.floor(this.segments.length / 3) % 2 === 0;
                const colors = isEven ? data.palette.light : data.palette.dark;

                // Interpolate curve for ultra-smooth transitions
                const percent = i / segData.length;
                let curve = segData.curve;

                if (percent < 0.2) {
                    // Ease in from previous segment
                    curve = Phaser.Math.Linear(prevCurve, segData.curve, percent / 0.2);
                } else if (percent > 0.8) {
                    // Ease out to next segment
                    curve = Phaser.Math.Linear(segData.curve, nextCurve, (percent - 0.8) / 0.2);
                }

                const segment = new RoadSegment(
                    this.segments.length,
                    z,
                    z + this.segmentLength,
                    curve,
                    colors
                );

                segment.p1.world.y = y;
                dy += segData.hill;
                y += dy;
                segment.p2.world.y = y;

                this.segments.push(segment);
                z += this.segmentLength;
            }
        }
        this.trackLength = this.segments.length * this.segmentLength;
    }

    update(speed: number) {
        this.position += speed;
        while (this.position >= this.trackLength) this.position -= this.trackLength;
        while (this.position < 0) this.position += this.trackLength;
    }

    getSegmentsToRender(startPos: number, drawDistance: number): RoadSegment[] {
        const result: RoadSegment[] = [];
        for (let n = 0; n < drawDistance; n++) {
            const segment = this.segments[(startPos + n) % this.segments.length];
            result.push(segment);
        }
        return result;
    }

    projectSegments(
        segments: RoadSegment[],
        cameraX: number,
        cameraY: number,
        cameraZ: number,
        cameraDepth: number,
        width: number,
        height: number,
        roadWidth: number,
        basePercent = 0
    ) {
        let x = 0;
        let dx = 0;

        const cameraSegmentIndex = Math.floor(cameraZ / this.segmentLength);

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            const segmentIndex = (cameraSegmentIndex + i) % this.segments.length;

            const worldZ1 = i * this.segmentLength - (basePercent * this.segmentLength);
            const worldZ2 = worldZ1 + this.segmentLength;

            segment.p1.world.x = x;
            segment.p2.world.x = x + dx;

            dx += segment.curve * 0.01;
            x += dx;

            RoadProjector.project(
                segment.p1,
                worldZ1 + cameraZ,
                cameraX,
                cameraY,
                cameraZ,
                cameraDepth,
                width,
                height,
                roadWidth
            );

            RoadProjector.project(
                segment.p2,
                worldZ2 + cameraZ,
                cameraX,
                cameraY,
                cameraZ,
                cameraDepth,
                width,
                height,
                roadWidth
            );
        }
    }
}
