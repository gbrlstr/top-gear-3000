import { RoadSegment } from './RoadSegment';

export class RoadRenderer {
    static render(
        graphics: Phaser.GameObjects.Graphics,
        spriteGroup: Phaser.GameObjects.Group,
        width: number,
        horizon: number,
        segments: RoadSegment[],
        enemies: any[] = [] // Adicione o array de inimigos como parâmetro
    ) {
        graphics.clear();

        // 1. Resetar o Pooling de Sprites
        spriteGroup.children.iterate((child: any) => {
            child.setVisible(false);
            return true;
        });

        let spriteCount = 0;
        const allChildren = spriteGroup.getChildren();

        // 2. Loop de renderização (do horizonte para o jogador)
        for (let i = segments.length - 1; i >= 0; i--) {
            const segment = segments[i];
            const p1 = segment.p1.screen;
            const p2 = segment.p2.screen;

            // Pula se estiver atrás da câmera (dz <= 0.1 no projetor já lida com isso)
            // Se p1.y < p2.y, o segmento está invertido (longe demais ou erro de projeção)
            if (p1.y < p2.y) continue;

            // Permite renderizar segmentos que tocam o horizonte
            if (p2.y < horizon - 20) continue;

            // --- CAMADA 1: CHÃO (Grama e Zebra) ---
            graphics.fillStyle(segment.colors.grass);
            graphics.fillRect(0, p2.y - 1, width, p1.y - p2.y + 1);
            this.drawPolygon(graphics, segment.colors.rumble, p1.x, p1.y, p1.w * 1.15, p2.x, p2.y - 1, p2.w * 1.15);

            // --- CAMADA 2: ESTRADA (Asfalto ou Linha de Chegada) ---
            // Desenha o asfalto base sempre para garantir que não haja vácuo
            this.drawPolygon(graphics, segment.colors.road, p1.x, p1.y, p1.w, p2.x, p2.y - 1, p2.w);

            if (segment.isStartLine) {
                // 1. Base branca (obrigatória)
                this.drawPolygon(graphics, 0xffffff, p1.x, p1.y, p1.w, p2.x, p2.y - 1, p2.w);

                // 2. Xadrez (agora visível de mais longe)
                if (p1.w > 5) { // Diminuído de 30 para 5 para aparecer no horizonte
                    const columns = 10;
                    const checkW1 = (p1.w * 2) / columns;
                    const checkW2 = (p2.w * 2) / columns;
                    for (let c = 0; c < columns; c++) {
                        if (c % 2 === 0) {
                            this.drawPolygon(graphics, 0x000000,
                                p1.x - p1.w + (c * checkW1) + checkW1 / 2, p1.y, checkW1 / 2,
                                p2.x - p2.w + (c * checkW2) + checkW2 / 2, p2.y - 1, checkW2 / 2);
                        }
                    }
                }

            } else {
                // Desenha a faixa pontilhada no centro para segmentos normais
                if (segment.colors.lane) {
                    this.drawPolygon(graphics, segment.colors.lane, p1.x, p1.y, p1.w * 0.02, p2.x, p2.y - 1, p2.w * 0.02);
                }
            }

            // --- CAMADA 3: OBJETOS LATERAIS (Árvores e Placas) ---
            // Importante: Desenhar os sprites DEPOIS da estrada para eles ficarem por cima do asfalto
            for (const obj of segment.sprites) {
                const spriteX = p1.x + (p1.w * obj.offset);
                const spriteScale = p1.scale! * (obj.scale || 1) * 400;
                this.renderAtPosition(spriteGroup, allChildren, spriteCount++, obj.source, obj.frame, spriteX, p1.y, spriteScale);
            }

            // --- CAMADA 4: CARROS INIMIGOS (NPCs) ---
            // Verifica se há um inimigo neste trecho Z da pista
            for (const enemy of enemies) {
                if (enemy.z >= segment.p1.world.z && enemy.z < segment.p2.world.z) {
                    // INTERPOLAÇÃO PARA MOVIMENTO SUAVE
                    const segmentZ = segment.p2.world.z - segment.p1.world.z;
                    const percent = (enemy.z - segment.p1.world.z) / segmentZ;

                    const carY = p1.y + (p2.y - p1.y) * percent;
                    const carX = p1.x + (p2.x - p1.x) * percent + (p1.w + (p2.w - p1.w) * percent) * enemy.x;
                    const carScale = (p1.scale! + (p2.scale! - p1.scale!) * percent) * 4000;
                    
                    const imageKey = `rear_${enemy.color}_c${enemy.frame}`;
                    const finalFlipX = enemy.frame === '00' ? false : enemy.flipX;

                    this.renderAtPosition(
                        spriteGroup,
                        allChildren,
                        spriteCount++,
                        'vehicles',
                        imageKey,
                        carX,
                        carY,
                        carScale,
                        finalFlipX
                    );
                }
            }
        }
    }

    // Função auxiliar para gerenciar o pooling de imagens
    private static renderAtPosition(group: Phaser.GameObjects.Group, children: any[], index: number, key: string, frame: any, x: number, y: number, scale: number, flipX: boolean = false) {
        let sprite: Phaser.GameObjects.Image;

        if (index < children.length) {
            sprite = children[index];
            sprite.setTexture(key, frame);
            sprite.setPosition(x, y);
        } else {
            sprite = group.scene.add.image(x, y, key, frame);
            group.add(sprite);
        }

        sprite.setVisible(true);
        sprite.setScale(scale);
        sprite.setOrigin(0.5, 1);
        sprite.setFlipX(flipX);
        sprite.setDepth(20 + (y / 1000));
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