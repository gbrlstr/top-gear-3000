import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { TrackManager } from '../road/TrackManager';
import { RoadRenderer } from '../road/RoadRenderer';
import { track1 } from '../tracks/track1';
import { HUDManager } from '../ui/HUDManager';
import { EnemyManager } from '../elements/EnemyManager';
import { PlayerManager } from '../elements/PlayerManager';
import { CollisionManager } from '../elements/CollisionManager';

export class RaceScene extends Scene {
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: Starfield;
    private hudManager!: HUDManager;
    private enemyManager!: EnemyManager;
    private playerManager!: PlayerManager;

    private roadWidth = 2000;
    private drawDistance = 120; // Reduzido para evitar sobreposição excessiva e jitter
    private camHeight = 1000;   // Baixar a câmera aumenta a sensação de velocidade
    private camDepth = 0.8;     // Profundidade menor achata a pista e a faz passar mais rápido
    private spriteGroup!: Phaser.GameObjects.Group;

    private currentLap: number = 1;
    private totalLaps: number = 3;
    private lastPosition: number = 0;
    private isRacing: boolean = false;



    constructor() {
        super('RaceScene');
    }

    create() {
        // Inicializa o gerenciador de pista
        const selectedTrack = track1;
        this.trackManager = new TrackManager(selectedTrack);

        // Fundo (Estrelas)
        this.starfield = new Starfield(this);

        // Camada de renderização da estrada
        this.roadGraphics = this.add.graphics().setName('roadGraphics').setDepth(10);

        // GRUPO PARA SPRITES LATERAIS (Árvores/Placas)
        // Usamos um grupo para gerenciar imagens individuais, permitindo escalas diferentes.
        this.spriteGroup = this.add.group().setDepth(20);

        // Veículo do jogador
        this.playerManager = new PlayerManager(this);
        this.playerManager.create();

        // Inimigos
        this.enemyManager = new EnemyManager();
        this.enemyManager.createEnemies();

        // Inicializa o Gerenciador de HUD e Inimigos
        this.hudManager = new HUDManager(this);
        this.hudManager.create(
            this.trackManager.currentTrack.trackMapFrame || 'track_01',
            this.trackManager.currentTrack.trackMapOffset || 0
        );

        EventBus.emit('current-scene-ready', this);
    }

    update(_time: number, delta: number) {
        const dt = delta / 1000;

        if (!this.isRacing) {
            const countdownFinished = this.hudManager.updateCountdown(dt);

            if (countdownFinished) {
                this.isRacing = true;
            }

            this.enemyManager.update(
                dt,
                this.isRacing,
                this.trackManager,
                this.playerManager.x,
                this.totalLaps
            );

            this.playerManager.updateVisuals(_time, this.trackManager, this.camHeight);
            this.renderRoad();
            if (this.starfield) this.starfield.update();
            this.updateRankings();
            return;
        }

        this.playerManager.handleInput(dt, this.trackManager);

        const currentPos = this.trackManager.position;

        // DETEÇÃO DE VOLTA: 
        // Se a posição "pulou" do fim para o início
        if (currentPos < this.lastPosition && this.playerManager.speed > 0) {
            this.onLapComplete();
        }

        // Atualiza a posição na pista
        this.trackManager.update(this.playerManager.speed * dt);

        this.lastPosition = currentPos;

        this.hudManager.updateSpeed(this.playerManager.speed);

        const playerProgress = this.trackManager.position / this.trackManager.trackLength;
        this.hudManager.update(dt, playerProgress);

        if (this.starfield) {
            this.starfield.update();
        }

        this.enemyManager.update(
            dt,
            this.isRacing,
            this.trackManager,
            this.playerManager.x,
            this.totalLaps
        );

        CollisionManager.handleCollisions(
            this.playerManager,
            this.trackManager,
            this.enemyManager.enemies,
            this
        );

        this.updateRankings();

        this.renderRoad();
        this.playerManager.updateVisuals(_time, this.trackManager, this.camHeight);

    }

    private updateRankings() {
        const trackLen = this.trackManager.trackLength;
        const playerDist = (this.currentLap - 1) * trackLen + this.trackManager.position;

        const participants = this.enemyManager.getParticipants(playerDist, trackLen);
        this.hudManager.updateRankings(participants);
    }



    private renderRoad() {
        const baseSegmentIndex = Math.floor(this.trackManager.position / this.trackManager.segmentLength) % this.trackManager.segments.length;
        const currentSegment = this.trackManager.segments[baseSegmentIndex];

        // Interpolação da altura para evitar "trancos" em subidas
        const percent = (this.trackManager.position % this.trackManager.segmentLength) / this.trackManager.segmentLength;
        const playerYWorld = Phaser.Math.Linear(currentSegment.p1.world.y, currentSegment.p2.world.y, percent);

        const segmentsToRender = this.trackManager.getSegmentsToRender(this.drawDistance);

        this.trackManager.projectSegments(
            segmentsToRender,
            this.playerManager.x * this.roadWidth,
            this.camHeight + playerYWorld, // Soma a altura do mundo à altura da câmera
            this.camDepth,
            this.scale.width,
            this.scale.height,
            this.roadWidth,
            this.scale.height * 0.35
        );


        RoadRenderer.render(
            this.roadGraphics,
            this.spriteGroup, // O grupo que você criou no create()
            this.scale.width,
            this.scale.height * 0.35,
            segmentsToRender,
            this.enemyManager.enemies // O array de 10 carros
        );
    }

    private onLapComplete() {
        this.currentLap++;

        if (this.currentLap > this.totalLaps) {
            this.playerManager.speed = 0;
            this.hudManager.setFinish();

            // Captura o ranking final
            const trackLen = this.trackManager.trackLength;
            const playerDist = (this.totalLaps) * trackLen; // Player terminou tudo
            const finalRankings = this.enemyManager.getParticipants(playerDist, trackLen);

            this.time.delayedCall(2000, () => {
                this.scene.start('ResultsScene', { rankings: finalRankings });
            });
        } else {
            this.hudManager.onLapComplete(this.currentLap, this.totalLaps);
        }
    }

}