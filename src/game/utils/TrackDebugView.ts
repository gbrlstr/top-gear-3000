import { TrackManager } from '../road/TrackManager';

export class TrackDebugView {
    private graphics: Phaser.GameObjects.Graphics;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5000);
        this.graphics.setScrollFactor(0);
    }

    public update(trackManager: TrackManager, playerProgress: number) {
        this.graphics.clear();

        const macroPoints = trackManager.getMacroPoints();
        if (macroPoints.length === 0) return;

        const padding = 20;
        const mapSize = 200; // Tamanho do mapa
        const startX = this.scene.scale.width - mapSize - padding;
        const startY = 350;

        // 1. Encontrar limites para escala
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const p of macroPoints) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
        }

        const width = maxX - minX;
        const height = maxZ - minZ;
        const scale = (mapSize - 40) / Math.max(width, height);

        const offsetX = startX + mapSize / 2 - (minX + width / 2) * scale;
        const offsetY = startY + mapSize / 2 - (minZ + height / 2) * scale;

        // 2. Desenhar Fundo e Moldura
        this.graphics.fillStyle(0x000000, 0.6);
        this.graphics.fillRect(startX, startY, mapSize, mapSize);
        this.graphics.lineStyle(2, 0xffffff, 0.3);
        this.graphics.strokeRect(startX, startY, mapSize, mapSize);

        // 3. Desenhar a Pista (Verde)
        this.graphics.lineStyle(4, 0x00ff00, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(macroPoints[0].x * scale + offsetX, macroPoints[0].z * scale + offsetY);
        for (let i = 1; i < macroPoints.length; i++) {
            this.graphics.lineTo(macroPoints[i].x * scale + offsetX, macroPoints[i].z * scale + offsetY);
        }
        this.graphics.closePath();
        this.graphics.strokePath();

        // 4. POSIÇÃO DO PLAYER (Sincronização Direta)
        // Em vez de usar index, usamos o percentual exato da pista no array de pontos
        const progressPercent = playerProgress / trackManager.trackLength;
        const playerPointIdx = Math.floor(progressPercent * macroPoints.length) % macroPoints.length;
        const pPos = macroPoints[playerPointIdx];

        if (pPos) {
            const px = pPos.x * scale + offsetX;
            const pz = pPos.z * scale + offsetY;

            // Desenha o brilho do ponto
            this.graphics.fillStyle(0xffffff, 0.5);
            this.graphics.fillCircle(px, pz, 8);

            // Desenha o ponto vermelho (Player)
            this.graphics.fillStyle(0xff0000, 1);
            this.graphics.fillCircle(px, pz, 5);
            this.graphics.lineStyle(2, 0xffffff, 1);
            this.graphics.strokeCircle(px, pz, 5);
        }
    }
}
