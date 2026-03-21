import { RoadSegment } from './RoadSegment';

export class RoadRenderer {
    static render(graphics: Phaser.GameObjects.Graphics, width: number, horizon: number, segments: RoadSegment[]) {
        graphics.clear();

        let maxy = horizon; // Linha de clipping para evitar que a pista "suba" demais

        // Desenha do segmento mais distante para o mais próximo
        for (let i = segments.length - 1; i >= 0; i--) {
            const segment = segments[i];
            const p1 = segment.p1.screen;
            const p2 = segment.p2.screen;

            // Se o ponto mais distante está abaixo do mais próximo, ou sumiu no horizonte, pula
            if (p1.y <= p2.y || p2.y < horizon) continue;

            // Grama
            graphics.fillStyle(segment.colors.grass);
            graphics.fillRect(0, p2.y, width, p1.y - p2.y);

            // Rumble (zebras)
            this.drawPolygon(graphics, segment.colors.rumble, p1.x, p1.y, p1.w * 1.2, p2.x, p2.y, p2.w * 1.2);

            // Estrada
            this.drawPolygon(graphics, segment.colors.road, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w);

            // Linha central
            if (segment.colors.lane) {
                this.drawPolygon(graphics, segment.colors.lane, p1.x, p1.y, p1.w * 0.02, p2.x, p2.y, p2.w * 0.02);
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