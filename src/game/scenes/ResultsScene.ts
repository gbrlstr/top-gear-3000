import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { LEAGUE_POINTS, LeagueEntry, RaceParticipant, loadLeagueTable } from '../league/league';
import { CHAMPIONSHIP_CREDITS, loadChampionshipState, RaceCreditSummary } from '../championship/championship';

export class ResultsScene extends Scene {
    private starfield!: Starfield;
    private raceRankings: RaceParticipant[] = [];
    private leagueTable: LeagueEntry[] = [];
    private creditSummary: RaceCreditSummary | null = null;
    private trackId: number;
    private resultRows: Phaser.GameObjects.Container[] = [];

    constructor() {
        super('ResultsScene');
    }

    init(data: { rankings?: RaceParticipant[], leagueTable?: LeagueEntry[], trackId?: number, creditSummary?: RaceCreditSummary }) {
        this.raceRankings = data.rankings || [];
        this.leagueTable = data.leagueTable || loadLeagueTable();
        this.creditSummary = data.creditSummary || null;
        this.trackId = data.trackId || 1;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);
        this.starfield = new Starfield(this);

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, 54, 'SYSTEM LEAGUE TABLE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '30px',
            color: '#00ff00',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, 92, 'CURRENT RACE RESULT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xff0000, 1);
        graphics.lineBetween(58, 126, width - 58, 126);
        graphics.lineStyle(2, 0x2bd7ff, 1);
        graphics.strokeRoundedRect(width - 316, 138, 256, 146, 10);

        const creditSummary = this.creditSummary ?? {
            position: this.raceRankings.findIndex(entry => entry.isPlayer) + 1,
            baseCredits: CHAMPIONSHIP_CREDITS[this.raceRankings.findIndex(entry => entry.isPlayer)] ?? 0,
            rewardEntries: [],
            pendingEntries: [],
            earnedCredits: CHAMPIONSHIP_CREDITS[this.raceRankings.findIndex(entry => entry.isPlayer)] ?? 0,
            totalCredits: loadChampionshipState().credits
        };

        this.add.text(width - 298, 148, 'RACE CREDITS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            color: '#00ffff'
        }).setOrigin(0, 0);

        this.add.text(width - 298, 166, `POSITION P${creditSummary.position}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffe166'
        }).setOrigin(0, 0);

        let rewardY = 184;
        this.add.text(width - 298, rewardY, `BASE   +${this.formatCredits(creditSummary.baseCredits)} CR`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0, 0);
        rewardY += 16;

        creditSummary.rewardEntries.slice(0, 4).forEach(entry => {
            this.add.text(width - 298, rewardY, `${entry.label} +${this.formatCredits(entry.amount)} CR`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '9px',
                color: '#9dff9d'
            }).setOrigin(0, 0);
            rewardY += 15;
        });

        if (creditSummary.pendingEntries.length > 0) {
            this.add.text(width - 298, rewardY, creditSummary.pendingEntries[0], {
                fontFamily: '"Press Start 2P"',
                fontSize: '8px',
                color: '#d8a8ff'
            }).setOrigin(0, 0);
            rewardY += 14;
        }

        this.add.text(width - 298, rewardY + 4, `TOTAL +${this.formatCredits(creditSummary.earnedCredits)} CR`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffe166'
        }).setOrigin(0, 0);

        this.add.text(width - 298, rewardY + 22, `BANK ${this.formatCredits(creditSummary.totalCredits)} CR`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#7cff7c'
        }).setOrigin(0, 0);

        const startY = 186;
        const rowHeight = 26;
        const columnX = {
            rank: 88,
            name: 152,
            racePoints: width - 72
        };

        const totalPointsById = new Map(this.leagueTable.map(entry => [entry.id, entry.points]));

        for (let i = 0; i < 20; i++) {
            const y = startY + (i * rowHeight);
            const entry = this.raceRankings[i];

            const row = this.add.container(0, 0).setAlpha(0);
            const fontConfig = this.getRowStyle(i);

            const rankText = this.add.text(columnX.rank, y, `${i + 1}`, fontConfig).setOrigin(1, 0.5);
            rankText.setShadow(2, 2, '#5a1200', 0, false, true);

            const name = entry ? entry.name.toUpperCase() : '-----------';
            const nameText = this.add.text(columnX.name, y, name, fontConfig).setOrigin(0, 0.5);
            nameText.setShadow(2, 2, '#5a1200', 0, false, true);

            const racePts = entry ? (LEAGUE_POINTS[i] ?? 0) : '-';
            const pointsText = this.add.text(columnX.racePoints, y, racePts.toString(), fontConfig).setOrigin(1, 0.5);
            pointsText.setShadow(2, 2, '#5a1200', 0, false, true);

            const totalPts = entry ? (totalPointsById.get(entry.id) ?? 0) : 0;
            const totalText = this.add.text(columnX.racePoints - 90, y, `TOTAL ${totalPts}`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '8px',
                color: i < 5 ? '#f8d878' : '#d89a48'
            }).setOrigin(1, 0.5);
            totalText.setShadow(1, 1, '#4a1200', 0, false, true);

            row.add([rankText, nameText, pointsText, totalText]);
            this.resultRows.push(row);
        }

        this.add.text(width / 2, height - 60, 'PRESS [N] FOR NEXT TRACK', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#00ffff'
        }).setOrigin(0.5).setAlpha(0.85);

        this.add.text(width / 2, height - 30, 'PRESS [ESC] FOR MAIN MENU', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.7);

        this.revealRows();

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

    private revealRows() {
        this.resultRows.forEach((row, index) => {
            this.time.delayedCall(index * 140, () => {
                row.setAlpha(1);
                row.x = -12;
                this.tweens.add({
                    targets: row,
                    x: 0,
                    duration: 120,
                    ease: 'Quad.out'
                });
            });
        });
    }

    private getRowStyle(index: number) {
        let color = '#ff7a2a';
        let stroke = '#7a1800';

        if (index === 0) {
            color = '#fff27a';
            stroke = '#b86a00';
        } else if (index < 5) {
            color = '#ffd84a';
            stroke = '#a84800';
        } else if (index < 12) {
            color = '#ff9a36';
            stroke = '#8a2400';
        } else {
            color = '#ff6a3a';
            stroke = '#741000';
        }

        return {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            color,
            stroke,
            strokeThickness: 3
        };
    }

    private formatCredits(value: number) {
        return Math.max(0, Math.floor(value)).toLocaleString('en-US');
    }
}
