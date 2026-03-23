import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { LEAGUE_POINTS, LeagueEntry, RaceParticipant, loadLeagueTable } from '../league/league';

export class ResultsScene extends Scene {
    private starfield!: Starfield;
    private raceRankings: RaceParticipant[] = [];
    private leagueTable: LeagueEntry[] = [];
    private trackId: number;

    constructor() {
        super('ResultsScene');
    }

    init(data: { rankings?: RaceParticipant[], leagueTable?: LeagueEntry[], trackId?: number }) {
        this.raceRankings = data.rankings || [];
        this.leagueTable = data.leagueTable || loadLeagueTable();
        this.trackId = data.trackId || 1;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);
        this.starfield = new Starfield(this);

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, 52, 'RACE RESULTS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            color: '#00ff00',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, 88, 'POSITION OF CURRENT RACE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xbb0000, 1);
        graphics.lineBetween(50, 116, width - 50, 116);

        const startY = 146;
        const rowHeight = 30;
        const columnX = {
            rank: 90,
            name: 170,
            racePoints: width - 230,
            totalPoints: width - 80
        };

        this.add.text(columnX.rank, 126, 'POS', this.getHeaderStyle()).setOrigin(1, 0.5);
        this.add.text(columnX.name, 126, 'DRIVER', this.getHeaderStyle()).setOrigin(0, 0.5);
        this.add.text(columnX.racePoints, 126, 'RACE', this.getHeaderStyle()).setOrigin(1, 0.5);
        this.add.text(columnX.totalPoints, 126, 'TOTAL', this.getHeaderStyle()).setOrigin(1, 0.5);

        const totalPointsById = new Map(this.leagueTable.map(entry => [entry.id, entry.points]));

        for (let i = 0; i < 20; i++) {
            const y = startY + (i * rowHeight);
            const entry = this.raceRankings[i];

            let color = '#ff0000';
            if (i < 3) color = '#ffff00';
            else if (i < 8) color = '#ff8800';
            else if (i < 15) color = '#ff4400';

            const fontConfig = {
                fontFamily: '"Press Start 2P"',
                fontSize: '20px',
                color: color
            };

            this.add.text(columnX.rank, y, `${i + 1}`, fontConfig).setOrigin(1, 0.5);

            const name = entry ? entry.name.toUpperCase() : '-----------';
            this.add.text(columnX.name, y, name, fontConfig).setOrigin(0, 0.5);

            const racePts = entry ? (LEAGUE_POINTS[i] ?? 0) : '-';
            this.add.text(columnX.racePoints, y, racePts.toString(), fontConfig).setOrigin(1, 0.5);

            const totalPts = entry ? (totalPointsById.get(entry.id) ?? 0) : '-';
            this.add.text(columnX.totalPoints, y, totalPts.toString(), fontConfig).setOrigin(1, 0.5);
        }

        // Instructions at the bottom
        this.add.text(width / 2, height - 60, 'PRESS [N] FOR NEXT TRACK', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#00ffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 30, 'PRESS [ESC] FOR MAIN MENU', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.7);

        this.input.keyboard?.on('keydown-N', () => {
            const nextId = (this.trackId % 34) + 1;
            this.scene.start('RaceScene', { trackId: nextId });
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.starfield) this.starfield.update();
    }

    private getHeaderStyle() {
        return {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#00ffff'
        };
    }
}
