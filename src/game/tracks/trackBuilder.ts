import { TrackSegmentData } from "./trackTypes";

export class TrackBuilder {
    private segments: TrackSegmentData[] = [];

    addStraight(length: number): this {
        this.segments.push({ length, curve: 0, hill: 0 });
        return this;
    }

    addCurve(length: number, intensity: number): this {
        this.segments.push({ length, curve: intensity, hill: 0 });
        return this;
    }

    addHill(length: number, height: number): this {
        this.segments.push({ length, curve: 0, hill: height });
        return this;
    }

    build(): TrackSegmentData[] {
        return this.segments;
    }
}
