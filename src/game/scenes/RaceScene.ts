import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { TrackManager } from '../road/TrackManager';
import { RoadRenderer } from '../road/RoadRenderer';
import { TRACK_COLLECTION } from '../tracks/trackRegistry';
import { HUDManager } from '../ui/HUDManager';
import { EnemyManager } from '../elements/EnemyManager';
import { EnemyVehicle } from '../elements/EnemyVehicle';
import { PlayerManager } from '../elements/PlayerManager';
import { CollisionManager } from '../elements/CollisionManager';
import { TrackDebugView } from '../utils/TrackDebugView';
import { getPlayerName, mergeLeaguePoints, RaceParticipant, sortRaceParticipants } from '../league/league';

export class RaceScene extends Scene {
    private trackId: number = 1;
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: Starfield;
    private hudManager!: HUDManager;
    private enemyManager!: EnemyManager;
    private playerManager!: PlayerManager;
    private debugView!: TrackDebugView;

    private roadWidth = 2000;
    private drawDistance = 120; // Reduzido para evitar sobreposição excessiva e jitter
    private camHeight = 1000;   // Baixar a câmera aumenta a sensação de velocidade
    private camDepth = 0.8;     // Profundidade menor achata a pista e a faz passar mais rápido
    private spriteGroup!: Phaser.GameObjects.Group;

    private currentLap: number = 1;
    private totalLaps: number = 3;
    private isRacing: boolean = false;
    private playerName: string = 'PLAYER';
    private playerFinished: boolean = false;
    private playerFinishTime: number | null = null;
    private resultsQueued: boolean = false;
    private finishCameraLocked: boolean = false;
    private finishCameraPosition: number = 0;
    private finishedPlayerCar: EnemyVehicle | null = null;
    private finishCameraDeadlineMs: number | null = null;
    private static readonly MAX_CAMERA_DEADLINE_MS = 4000;



    init(data: { trackId?: number }) {
        this.trackId = data.trackId || 1;
    }

    constructor() {
        super('RaceScene');
    }

    create() {
        this.playerName = getPlayerName();
        this.playerFinished = false;
        this.playerFinishTime = null;
        this.resultsQueued = false;
        this.finishCameraLocked = false;
        this.finishCameraPosition = 0;
        this.finishedPlayerCar = null;
        this.finishCameraDeadlineMs = null;

        // Inicializa o gerenciador de pista
        const selectedTrack = TRACK_COLLECTION.find(t => t.id === this.trackId);
        this.trackManager = new TrackManager(selectedTrack!);

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
            this.trackManager.currentTrack.trackMapFrame,
            this.trackManager.currentTrack.trackMapOffset
        );
        this.hudManager.setTrackPath(this.trackManager.getMacroPoints());

        // Debug Track Map
        this.debugView = new TrackDebugView(this);

        EventBus.emit('current-scene-ready', this);
    }

    update(_time: number, delta: number) {
        const dt = delta / 1000;

        if (!this.isRacing) {
            const playerWorldZ = this.getPlayerWorldZ();
            const countdownFinished = this.hudManager.updateCountdown(delta / 300);

            if (countdownFinished) {
                this.isRacing = true;
            }

            this.enemyManager.update(
                dt,
                this.isRacing,
                this.trackManager,
                playerWorldZ,
                this.playerManager.x,
                this.totalLaps,
                !this.playerFinished
            );

            this.playerManager.updateVisuals(_time, this.trackManager, this.camHeight);

            // TRACKERS UPDATE
            const playerProgress = this.trackManager.position / this.trackManager.trackLength;
            this.hudManager.update(dt, playerProgress);
            if (this.debugView) {
                this.debugView.update(this.trackManager, this.trackManager.position);
            }

            this.renderRoad();
            if (this.starfield) this.starfield.update();
            this.updateRankings();
            return;
        }

        if (!this.playerFinished) {
            this.playerManager.handleInput(dt, this.trackManager);
        }
        const previousPlayerWorldZ = this.getPlayerWorldZ();

        // Atualiza a posição na pista
        if (!this.playerFinished && !this.finishCameraLocked) {
            this.trackManager.update(this.playerManager.speed * dt);
        }

        this.hudManager.updateSpeed(this.playerManager.speed);

        const playerProgress = this.trackManager.position / this.trackManager.trackLength;
        this.hudManager.update(dt, playerProgress);

        if (this.starfield) {
            this.starfield.update();
        }

        const playerWorldZ = this.getPlayerWorldZ();
        const crossedFinishLine = this.didPlayerCrossFinishLine(previousPlayerWorldZ, playerWorldZ);

        if (this.finishCameraLocked) {
            this.trackManager.position = this.finishCameraPosition;
        }

        this.enemyManager.update(
            dt,
            this.isRacing,
            this.trackManager,
            playerWorldZ,
            this.playerManager.x,
            this.totalLaps,
            !this.playerFinished
        );

        if (!this.playerFinished) {
            CollisionManager.handleCollisions(
                this.playerManager,
                this.trackManager,
                this.enemyManager.enemies,
                this,
                playerWorldZ
            );
        }

        if (!this.playerFinished && crossedFinishLine) {
            this.onLapComplete();
        }

        this.updateFinishedPlayerCar(dt);

        this.updateRankings();
        this.updateRaceCompletionFlow();

        this.renderRoad();
        this.playerManager.updateVisuals(_time, this.trackManager, this.camHeight);

        // Update Debug View
        if (this.debugView) {
            this.debugView.update(this.trackManager, this.trackManager.position);
        }
    }

    private updateRankings() {
        const trackLen = this.trackManager.trackLength;
        const playerDist = this.playerFinished
            ? this.totalLaps * trackLen
            : (this.currentLap - 1) * trackLen + this.trackManager.position;

        const participants = sortRaceParticipants(this.enemyManager.getParticipants(
            this.playerName,
            playerDist,
            this.playerFinished,
            this.playerFinishTime,
            trackLen
        ));
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
            this.getRenderableCars()
        );
    }

    private onLapComplete() {
        if (this.currentLap >= this.totalLaps) {
            this.finishPlayerRace();
            return;
        }

        this.currentLap++;
        this.hudManager.onLapComplete(this.currentLap, this.totalLaps);
    }

    private getPlayerWorldZ() {
        const trackLength = this.trackManager.trackLength;
        const playerOffsetZ = this.camHeight * this.camDepth;
        const worldZ = this.trackManager.position + playerOffsetZ;
        return ((worldZ % trackLength) + trackLength) % trackLength;
    }

    private didPlayerCrossFinishLine(previousWorldZ: number, currentWorldZ: number) {
        if (this.playerManager.speed <= 0) return false;

        const { endZ } = this.trackManager.getStartLineRange();
        const trackLength = this.trackManager.trackLength;
        let traveled = currentWorldZ - previousWorldZ;
        if (traveled < 0) traveled += trackLength;

        let distanceToFinish = endZ - previousWorldZ;
        if (distanceToFinish < 0) distanceToFinish += trackLength;

        return distanceToFinish > 0 && distanceToFinish <= traveled;
    }

    private finishPlayerRace() {
        const { startZ, endZ } = this.trackManager.getStartLineRange();
        const lineMidZ = (startZ + endZ) / 2;
        const playerOffsetZ = this.camHeight * this.camDepth;
        this.finishCameraPosition = this.wrapTrackZ(lineMidZ - playerOffsetZ);
        this.finishCameraLocked = true;
        this.trackManager.position = this.finishCameraPosition;

        this.finishedPlayerCar = {
            id: -1,
            name: this.playerName,
            z: this.getPlayerWorldZ(),
            x: this.playerManager.x,
            speed: Math.max(this.playerManager.speed * 0.75, 4200),
            color: 'r01',
            frame: '00',
            targetX: this.playerManager.x,
            steering: 0,
            flipX: false,
            laps: this.totalLaps,
            lastZ: this.getPlayerWorldZ(),
            finished: true,
            finishTime: this.hudManager.getRaceTime(),
            targetSpeed: 0,
            accelRate: 0,
            preferredLane: this.playerManager.x,
            launchDelay: 0,
            percent: 0
        };

        this.playerFinished = true;
        this.playerFinishTime ??= this.hudManager.getRaceTime();
        this.finishCameraDeadlineMs = this.time.now + RaceScene.MAX_CAMERA_DEADLINE_MS;
        this.playerManager.speed = 0;
        this.playerManager.vehicle.setVisible(false);
        this.hudManager.setFinish();
        this.hudManager.stopRaceClock();
    }

    private updateRaceCompletionFlow() {
        if (!this.playerFinished || this.resultsQueued) return;

        const everyoneFinished = this.enemyManager.enemies.every(enemy => enemy.finished);
        const finishCameraExpired =
            this.finishCameraDeadlineMs !== null &&
            this.time.now >= this.finishCameraDeadlineMs;

        if (!everyoneFinished && !finishCameraExpired) return;

        this.resultsQueued = true;
        const finalRankings = this.getSortedParticipants();
        const leagueTable = mergeLeaguePoints(finalRankings);

        this.time.delayedCall(2000, () => {
            this.scene.start('ResultsScene', {
                rankings: finalRankings,
                leagueTable,
                trackId: this.trackId
            });
        });
    }

    private getSortedParticipants(): RaceParticipant[] {
        const trackLen = this.trackManager.trackLength;
        const playerDist = this.totalLaps * trackLen;
        const participants = this.enemyManager.getParticipants(
            this.playerName,
            playerDist,
            this.playerFinished,
            this.playerFinishTime,
            trackLen
        );

        return sortRaceParticipants(participants);
    }

    private updateFinishedPlayerCar(dt: number) {
        if (!this.finishedPlayerCar) return;

        this.finishedPlayerCar.speed = Math.max(1800, this.finishedPlayerCar.speed - dt * 900);
        this.finishedPlayerCar.z = this.wrapTrackZ(this.finishedPlayerCar.z + this.finishedPlayerCar.speed * dt);
        this.finishedPlayerCar.lastZ = this.finishedPlayerCar.z;

        const segmentIndex = Math.floor(this.finishedPlayerCar.z / this.trackManager.segmentLength) % this.trackManager.segments.length;
        const segment = this.trackManager.segments[segmentIndex];
        const curve = segment?.curve ?? 0;
        const absCurve = Math.abs(curve);

        if (absCurve > 3) this.finishedPlayerCar.frame = '03';
        else if (absCurve > 1.5) this.finishedPlayerCar.frame = '02';
        else if (absCurve > 0.5) this.finishedPlayerCar.frame = '01';
        else this.finishedPlayerCar.frame = '00';

        this.finishedPlayerCar.flipX = curve < 0;
    }

    private getRenderableCars() {
        return this.finishedPlayerCar
            ? [...this.enemyManager.enemies, this.finishedPlayerCar]
            : this.enemyManager.enemies;
    }

    private wrapTrackZ(z: number) {
        const trackLength = this.trackManager.trackLength;
        return ((z % trackLength) + trackLength) % trackLength;
    }

}