import { RoadSegment } from './RoadSegment';

export class RoadRenderer {
    static render(graphics: Phaser.GameObjects.Graphics, width: number, horizon: number, segments: RoadSegment[]) {
        graphics.clear();

        // Draw Sky if needed, but we use Starfield

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const p1 = segment.p1.screen;
            const p2 = segment.p2.screen;

            if (p1.y <= p2.y || p2.y < horizon) continue;

            // Grass
            graphics.fillStyle(segment.colors.grass);
            graphics.fillRect(0, p2.y, width, p1.y - p2.y);

            // Rumble strips (wider for better speed sense)
            const rumbleW1 = p1.w * 1.15;
            const rumbleW2 = p2.w * 1.15;
            this.drawPolygon(graphics, segment.colors.rumble,
                p1.x, p1.y, rumbleW1,
                p2.x, p2.y, rumbleW2);

            // Road
            this.drawPolygon(graphics, segment.colors.road,
                p1.x, p1.y, p1.w,
                p2.x, p2.y, p2.w);

            // Lane markers
            if (segment.colors.lane) {
                const laneW1 = p1.w * 0.02;
                const laneW2 = p2.w * 0.02;
                this.drawPolygon(graphics, segment.colors.lane,
                    p1.x, p1.y, laneW1,
                    p2.x, p2.y, laneW2);
            }
        }
    }

    private static drawPolygon(g: Phaser.GameObjects.Graphics, color: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) {
        g.fillStyle(color);
        g.beginPath();
        g.moveTo(x1 - w1, y1);
        g.lineTo(x2 - w2, y2);
        g.lineTo(x2 + w2, y2);
        g.lineTo(x1 + w1, y1);
        g.closePath();
        g.fillPath();
    }
}
