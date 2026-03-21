import { RoadColors } from "../road/RoadSegment";

export interface TrackData {
    id: string;
    name: string;
    palette: {
        light: RoadColors;
        dark: RoadColors;
    };
    segments: TrackSegmentData[];
}

export interface TrackSegmentData {
    length: number;
    curve: number;
    hill: number;
}
