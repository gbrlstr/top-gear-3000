import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
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
import { RaceAudioManager } from '../audio/RaceAudioManager';
import { awardRaceCredits, resetChampionshipState } from '../championship/championship';
import { createRaceTelemetry, evaluateSecretBonuses, RaceTelemetry } from '../championship/bonuses';
import { ParallaxBackground } from '../backgrounds/ParallaxBackground';

type RacePickupType = 'credits' | 'boost';

interface RacePickup {
    id: string;
    z: number;
    x: number;
    type: RacePickupType;
    amount: number;
    collected: boolean;
}

export class RaceScene extends Scene {
    private trackId: number = 1;
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private parallaxBackground!: ParallaxBackground;
    private hudManager!: HUDManager;
    private enemyManager!: EnemyManager;
    private playerManager!: PlayerManager;
    private raceAudio!: RaceAudioManager;
    private debugView!: TrackDebugView;
    private pickupGroup!: Phaser.GameObjects.Group;
    private pickups: RacePickup[] = [];
    private telemetry: RaceTelemetry = createRaceTelemetry();

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
    private playerLapArmed: boolean = false;
    private finishCameraLocked: boolean = false;
    private finishCameraPosition: number = 0;
    private finishedPlayerCar: EnemyVehicle | null = null;
    private finishCameraDeadlineMs: number | null = null;
    private resetChampionship: boolean = false;
    private static readonly MAX_CAMERA_DEADLINE_MS = 4000;



    init(data: { trackId?: number, resetChampionship?: boolean }) {
        this.trackId = data.trackId || 1;
        this.resetChampionship = Boolean(data.resetChampionship);
    }

    constructor() {
        super('RaceScene');
    }

    create() {
        if (this.resetChampionship) {
            resetChampionshipState();
        }

        this.playerName = getPlayerName();
        this.playerFinished = false;
        this.playerFinishTime = null;
        this.resultsQueued = false;
        this.playerLapArmed = false;
        this.finishCameraLocked = false;
        this.finishCameraPosition = 0;
        this.finishedPlayerCar = null;
        this.finishCameraDeadlineMs = null;
        this.resetChampionship = false;
        this.telemetry = createRaceTelemetry();
        this.pickups = [];

        // Inicializa o gerenciador de pista
        const selectedTrack = TRACK_COLLECTION.find(t => t.id === this.trackId);
        this.trackManager = new TrackManager(selectedTrack!);

        // Fundo com parallax baseado no background da pista.
        this.parallaxBackground = new ParallaxBackground(this);
        this.parallaxBackground.create(this.trackManager.currentTrack, this.scale.height * 0.35);

        // Camada de renderização da estrada
        this.roadGraphics = this.add.graphics().setName('roadGraphics').setDepth(10);

        // GRUPO PARA SPRITES LATERAIS (Árvores/Placas)
        // Usamos um grupo para gerenciar imagens individuais, permitindo escalas diferentes.
        this.spriteGroup = this.add.group().setDepth(20);
        this.pickupGroup = this.add.group().setDepth(19);
        this.createPickupTextures();
        this.pickups = this.generateTrackPickups();

        // Veículo do jogador
        this.playerManager = new PlayerManager(this);
        this.playerManager.create();

        // Áudio dinâmico da corrida
        this.raceAudio = new RaceAudioManager(this);
        this.raceAudio.create();

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
            this.raceAudio.setRepairActive(false);
            this.raceAudio.setRechargeActive(false);
            this.hudManager.setRechargeVisible(false);
            this.hudManager.setRepairVisible(false);
            const playerWorldZ = this.getPlayerWorldZ();
            const countdownFinished = this.hudManager.updateCountdown(dt);

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
            this.hudManager.updateCarLife(this.playerManager.health / this.playerManager.maxHealth);
            this.hudManager.updateFuel(this.playerManager.fuel / this.playerManager.maxFuel);
            this.raceAudio.update(
                this.playerManager.speed,
                this.playerManager.health / this.playerManager.maxHealth,
                this.isRacing && !this.playerFinished,
                this.playerManager.isBroken
            );

            // TRACKERS UPDATE
            const playerProgress = this.trackManager.position / this.trackManager.trackLength;
            this.hudManager.update(dt, playerProgress);
            if (this.debugView) {
                this.debugView.update(this.trackManager, this.trackManager.position);
            }

            this.renderRoad();
            this.renderPickups();
            if (this.parallaxBackground) {
                this.parallaxBackground.update(dt, this.playerManager.speed, this.playerManager.x, this.trackManager);
            }
            this.updateRankings();
            return;
        }

        if (!this.playerFinished) {
            this.playerManager.handleInput(dt, this.trackManager);
            if (this.playerManager.isOffRoad) {
                this.telemetry.offRoadMoments++;
            }
            if (this.playerManager.hasUsedBoost()) {
                this.telemetry.boostUsed = true;
            }
        }
        const previousPlayerWorldZ = this.getPlayerWorldZ();

        // Atualiza a posição na pista
        if (!this.playerFinished && !this.finishCameraLocked) {
            this.trackManager.update(this.playerManager.speed * dt);
        }

        this.hudManager.updateSpeed(this.playerManager.speed);
        this.hudManager.updateCarLife(this.playerManager.health / this.playerManager.maxHealth);
        this.hudManager.updateFuel(this.playerManager.fuel / this.playerManager.maxFuel);
        this.raceAudio.update(
            this.playerManager.speed,
            this.playerManager.health / this.playerManager.maxHealth,
            this.isRacing && !this.playerFinished,
            this.playerManager.isBroken
        );

        const playerProgress = this.trackManager.position / this.trackManager.trackLength;
        this.hudManager.update(dt, playerProgress);

        if (this.parallaxBackground) {
            this.parallaxBackground.update(dt, this.playerManager.speed, this.playerManager.x, this.trackManager);
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
            const collisionState = CollisionManager.handleCollisions(
                this.playerManager,
                this.trackManager,
                this.enemyManager.enemies,
                this,
                playerWorldZ
            );
            if (collisionState.carCollision) this.telemetry.carCollisionCount++;
            if (collisionState.obstacleCollision) this.telemetry.obstacleCollisionCount++;
        }

        if (!this.playerFinished && this.isRacing) {
            this.handleSupportZones(playerWorldZ, dt);
            this.updatePickupCollection(playerWorldZ);
        }

        if (!this.playerFinished && crossedFinishLine) {
            this.onLapComplete();
        }

        this.updateFinishedPlayerCar(dt);

        this.updateRankings();
        this.updateRaceCompletionFlow();

        this.renderRoad();
        this.renderPickups();
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
            this.getRenderableCars(),
            this.time.now
        );
    }

    private onLapComplete() {
        if (!this.playerLapArmed) {
            this.playerLapArmed = true;
            return;
        }

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

    private handleSupportZones(playerWorldZ: number, dt: number) {
        const recharge = this.trackManager.isPlayerOnRechargeZone(playerWorldZ, this.playerManager.x);
        const repair = this.trackManager.isPlayerOnRepairZone(playerWorldZ, this.playerManager.x);
        const isRecharging = Boolean(recharge);
        const isRepairing = Boolean(repair);

        this.raceAudio.setRechargeActive(isRecharging);
        this.raceAudio.setRepairActive(isRepairing);
        this.hudManager.setRechargeVisible(isRecharging);
        this.hudManager.setRepairVisible(isRepairing);

        if (recharge) {
            this.playerManager.refuel(recharge.refuelPerSecond * dt);
        }

        if (repair) {
            this.playerManager.repair(repair.healPerSecond * dt);
        }
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
        this.telemetry.finishWithBoostActive = this.playerManager.isBoostActive();
        this.playerFinishTime ??= this.hudManager.getRaceTime();
        this.finishCameraDeadlineMs = this.time.now + RaceScene.MAX_CAMERA_DEADLINE_MS;
        this.raceAudio.setRepairActive(false);
        this.raceAudio.setRechargeActive(false);
        this.hudManager.setRechargeVisible(false);
        this.hudManager.setRepairVisible(false);
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
        const bonusOutcome = evaluateSecretBonuses(this.telemetry);
        const creditSummary = awardRaceCredits(finalRankings, bonusOutcome.rewardEntries, bonusOutcome.pendingEntries);

        this.time.delayedCall(2000, () => {
            this.scene.start('ResultsScene', {
                rankings: finalRankings,
                leagueTable,
                trackId: this.trackId,
                creditSummary
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

    private createPickupTextures() {
        if (!this.textures.exists('pickup_credits')) {
            const graphics = this.make.graphics({});
            graphics.fillStyle(0xffd54a, 1);
            graphics.fillCircle(10, 10, 8);
            graphics.lineStyle(2, 0x7a3c00, 1);
            graphics.strokeCircle(10, 10, 8);
            graphics.generateTexture('pickup_credits', 20, 20);
            graphics.destroy();
        }

        if (!this.textures.exists('pickup_boost')) {
            const graphics = this.make.graphics({});
            graphics.fillStyle(0x3ad1ff, 1);
            graphics.fillCircle(10, 10, 8);
            graphics.lineStyle(2, 0x003e66, 1);
            graphics.strokeCircle(10, 10, 8);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(10, 3, 10, 17);
            graphics.lineBetween(3, 10, 17, 10);
            graphics.generateTexture('pickup_boost', 20, 20);
            graphics.destroy();
        }
    }

    private generateTrackPickups(): RacePickup[] {
        const trackLength = this.trackManager.trackLength;
        const seed: Array<Pick<RacePickup, 'type' | 'amount'> & { progress: number; x: number }> = [
            { type: 'credits', amount: 10000, progress: 0.16, x: -0.54 },
            { type: 'boost', amount: 1, progress: 0.33, x: 0.18 },
            { type: 'credits', amount: 15000, progress: 0.51, x: -0.18 },
            { type: 'boost', amount: 1, progress: 0.69, x: 0.54 },
            { type: 'credits', amount: 20000, progress: 0.83, x: 0.18 }
        ];

        return seed.map((pickup, index) => ({
            id: `pickup:${index}`,
            z: trackLength * pickup.progress,
            x: pickup.x,
            type: pickup.type,
            amount: pickup.amount,
            collected: false
        }));
    }

    private updatePickupCollection(playerWorldZ: number) {
        const trackLength = this.trackManager.trackLength;

        this.pickups.forEach(pickup => {
            if (pickup.collected) return;

            let dz = pickup.z - playerWorldZ;
            if (dz > trackLength / 2) dz -= trackLength;
            if (dz < -trackLength / 2) dz += trackLength;

            const closeEnoughZ = Math.abs(dz) <= 120;
            const closeEnoughX = Math.abs(this.playerManager.x - pickup.x) <= 0.18;
            if (!closeEnoughZ || !closeEnoughX) return;

            pickup.collected = true;
            if (pickup.type === 'credits') {
                this.telemetry.collectedTrackCredits += pickup.amount;
            } else {
                this.playerManager.addBoostUses(pickup.amount);
                this.telemetry.collectedBoostPickups += pickup.amount;
            }

            this.raceAudio.playBonus();
        });
    }

    private renderPickups() {
        this.pickupGroup.children.iterate((child: any) => {
            child.setVisible(false);
            return true;
        });

        let spriteIndex = 0;
        const children = this.pickupGroup.getChildren() as Phaser.GameObjects.Image[];

        this.pickups.forEach(pickup => {
            if (pickup.collected) return;

            const segment = this.trackManager.getSegment(pickup.z);
            const p1 = segment.p1.screen;
            const p2 = segment.p2.screen;
            if (p1.y < p2.y) return;
            if (p2.y < this.scale.height * 0.35 - 20) return;

            const segmentZ = Math.max(1, segment.p2.world.z - segment.p1.world.z);
            const percent = Phaser.Math.Clamp((pickup.z - segment.p1.world.z) / segmentZ, 0, 1);
            const y = p1.y + (p2.y - p1.y) * percent;
            const roadHalfWidth = p1.w + (p2.w - p1.w) * percent;
            const x = p1.x + (p2.x - p1.x) * percent + roadHalfWidth * pickup.x;
            const scale = Math.max(0.18, (p1.scale! + (p2.scale! - p1.scale!) * percent) * 900);

            let sprite = children[spriteIndex];
            if (!sprite) {
                sprite = this.add.image(x, y, 'pickup_credits');
                this.pickupGroup.add(sprite);
            }

            sprite.setTexture(pickup.type === 'credits' ? 'pickup_credits' : 'pickup_boost');
            sprite.setVisible(true);
            sprite.setPosition(x, y);
            sprite.setScale(scale);
            sprite.setOrigin(0.5, 1);
            sprite.setDepth(19 + (y / 1000));
            spriteIndex++;
        });
    }

}