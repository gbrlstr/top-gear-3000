import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';

export class ResultsScene extends Scene {
    private starfield!: Starfield;
    private rankings: any[] = [];
    private points = [20, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];

    constructor() {
        super('ResultsScene');
    }

    init(data: { rankings: any[] }) {
        this.rankings = data.rankings || [];
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);
        this.starfield = new Starfield(this);

        const width = this.scale.width;
        const height = this.scale.height;

        // --- TITLE: SYSTEM LEAGUE TABLE ---
        this.add.text(width / 2, 60, 'SYSTEM LEAGUE TABLE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            color: '#00ff00', // Green
            align: 'center'
        }).setOrigin(0.5);

        // --- DIVIDER: RED LINE ---
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xbb0000, 1);
        graphics.lineBetween(50, 100, width - 50, 100);

        // --- RANKING LIST (Show top 20 like the screenshot) ---
        const startY = 140;
        const rowHeight = 30;
        const columnX = {
            rank: 100,
            name: 200,
            points: width - 100
        };

        for (let i = 0; i < 20; i++) {
            const y = startY + (i * rowHeight);
            const entry = this.rankings[i];

            // Determina a cor baseada na posição (Gradiente Amarelo -> Laranja -> Vermelho)
            let color = '#ff0000'; // Red (default para posições baixas)
            if (i < 3) color = '#ffff00'; // Yellow/Gold
            else if (i < 8) color = '#ff8800'; // Orange
            else if (i < 15) color = '#ff4400'; // Red-Orange

            const fontConfig = {
                fontFamily: '"Press Start 2P"',
                fontSize: '20px',
                color: color
            };

            // Rank Number
            this.add.text(columnX.rank, y, `${i + 1}`, fontConfig).setOrigin(1, 0.5);

            // Name (Se não houver, usa placeholder)
            const name = entry ? entry.name.toUpperCase() : '-----------';
            this.add.text(columnX.name, y, name, fontConfig).setOrigin(0, 0.5);

            // Points
            const pts = this.points[i] || 0;
            this.add.text(columnX.points, y, pts.toString(), fontConfig).setOrigin(1, 0.5);
        }

        // Instructions at the bottom
        this.add.text(width / 2, height - 40, 'PRESS ANY KEY TO RETURN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.7);

        this.input.keyboard?.once('keydown', () => {
            this.scene.start('MainMenu');
        });

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.starfield) this.starfield.update();
    }
}
