import { RoadSegment } from './RoadSegment';

export class RoadRenderer {
    // No seu RoadRenderer.ts
    static render(graphics: Phaser.GameObjects.Graphics, width: number, horizon: number, segments: RoadSegment[]) {
        graphics.clear();

        for (let i = segments.length - 1; i >= 0; i--) {
            const segment = segments[i];
            const p1 = segment.p1.screen;
            const p2 = segment.p2.screen;

            // Se p1 (mais próximo) está acima de p2 (mais distante), a perspectiva está correta.
            // Se não, o segmento está corrompido ou atrás da câmera.
            if (p1.y <= p2.y || p2.y < horizon) continue;

            // 1. Desenha a Grama
            graphics.fillStyle(segment.colors.grass);
            graphics.fillRect(0, p2.y, width, p1.y - p2.y);

            // 2. Desenha o Rumble (Zebra)
            this.drawPolygon(graphics, segment.colors.rumble, p1.x, p1.y, p1.w * 1.15, p2.x, p2.y, p2.w * 1.15);

            // 3. Desenha a Estrada ou Linha de Chegada
            if (segment.isStartLine) {
                // 1. Fundo Branco
                this.drawPolygon(graphics, segment.colors.lane!, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w);

                // 2. Quadrados Pretos (Xadrez)
                // Usamos 10 divisões para um visual mais detalhado
                const columns = 15;
                const checkW1 = (p1.w * 2) / columns;
                const checkW2 = (p2.w * 2) / columns;

                for (let c = 0; c < columns; c++) {
                    // Alterna entre desenhar ou não baseado na coluna
                    if (c % 2 === 0) {
                        const x1 = p1.x - p1.w + (c * checkW1);
                        const x2 = p2.x - p2.w + (c * checkW2);

                        this.drawPolygon(graphics, segment.colors.grass,
                            x1 + checkW1 / 2, p1.y, checkW1 / 2,
                            x2 + checkW2 / 2, p2.y, checkW2 / 2);
                    }
                }
            } else {
                // Estrada normal
                this.drawPolygon(graphics, segment.colors.road, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w);

                // Faixas brancas centrais
                if (segment.colors.lane) {
                    this.drawPolygon(graphics, segment.colors.lane, p1.x, p1.y, p1.w * 0.02, p2.x, p2.y, p2.w * 0.02);
                }
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