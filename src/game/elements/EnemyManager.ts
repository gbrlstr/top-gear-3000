import { EnemyVehicle } from './EnemyVehicle';
import { TrackManager } from '../road/TrackManager';
import { ENEMY_DRIVER_NAMES, RaceParticipant } from '../league/league';

export class EnemyManager {
    private static readonly LANE_CENTERS = [-0.54, -0.18, 0.18, 0.54];
    private static readonly START_GRID_LANES = [-0.18, 0.18];
    private static readonly LANE_CAPTURE_RANGE = 0.14;
    private static readonly SAFE_AHEAD_DISTANCE = 900;
    private static readonly EMERGENCY_BRAKE_DISTANCE = 240;
    private static readonly SAFE_REAR_DISTANCE = 260;
    private static readonly OVERTAKE_TRIGGER_DISTANCE = 520;
    private static readonly OVERTAKE_MIN_GAIN = 220;
    private static readonly RETURN_TO_LANE_DISTANCE = 1100;
    private static readonly START_BASE_Z = 2820;
    private static readonly START_ROW_SPACING = 230;
    private static readonly LAUNCH_SETTLE_TIME = 1.25;
    private static readonly GRID_ROWS = 10;
    private static readonly PLAYER_GRID_ROW = 9;
    private static readonly PLAYER_GRID_COL = 0;

    public enemies: EnemyVehicle[] = [];

    constructor() { }

    createEnemies() {
        // CORES: Podes adicionar ou remover cores aqui (r00 a r19)
        const colors = ['r00', 'r03', 'r05', 'r07', 'r11', 'r14', 'r17', 'r19'];
        this.enemies = [];

        let enemyId = 0;
        for (let row = 0; row < EnemyManager.GRID_ROWS; row++) {
            for (let col = 0; col < EnemyManager.START_GRID_LANES.length; col++) {
                if (row === EnemyManager.PLAYER_GRID_ROW && col === EnemyManager.PLAYER_GRID_COL) {
                    continue;
                }

                const finalX = EnemyManager.START_GRID_LANES[col];
                const finalZ = EnemyManager.START_BASE_Z - (row * EnemyManager.START_ROW_SPACING);
                const paceRank = row * EnemyManager.START_GRID_LANES.length + col;
                const targetSpeed = 8600 + ((19 - paceRank) * 110);
                const accelRate = 1320 + ((EnemyManager.GRID_ROWS - row) * 45) + (col === 1 ? 50 : 0);
                const launchDelay = (row * 0.12) + (col * 0.03);
                const color = colors[enemyId % colors.length];
                const name = ENEMY_DRIVER_NAMES[enemyId] || `RIVAL ${enemyId + 1}`;

                this.enemies.push({
                    id: enemyId,
                    name,
                    z: finalZ,
                    x: finalX,
                    speed: 0,
                    targetSpeed,
                    accelRate,
                    color,
                    frame: '00',
                    targetX: finalX,
                    preferredLane: finalX,
                    launchDelay,
                    steering: 0,
                    flipX: false,
                    laps: 0,
                    lastZ: finalZ,
                    finished: false,
                    finishTime: null,
                    percent: 0
                });

                enemyId++;
            }
        }
    }

    update(
        dt: number,
        isRacing: boolean,
        trackManager: TrackManager,
        playerZ: number,
        playerX: number,
        totalLaps: number,
        playerActive: boolean
    ) {
        const trackLength = trackManager.trackLength;

        if (!isRacing) {
            // Garante que os inimigos fiquem retos e parados durante o countdown
            this.enemies.forEach(enemy => {
                enemy.frame = '00';
                enemy.flipX = false;
                enemy.steering = 0;
                enemy.targetX = enemy.x; // Mantém na posição inicial
            });
            return;
        }

        this.enemies.forEach(enemy => {
            enemy.percent += dt;

            // Pega o segmento atual do inimigo para saber a curva
            const segmentIndex = Math.floor(enemy.z / trackManager.segmentLength) % trackManager.segments.length;
            const segment = trackManager.segments[segmentIndex];
            const curve = segment ? segment.curve : 0;

            if (enemy.finished) {
                enemy.speed = Math.max(0, enemy.speed - dt * 2000);
            } else {
                let dynamicTargetSpeed = enemy.targetSpeed;
                if (Math.abs(curve) > 2) {
                    const curveFactor = Math.abs(curve) / 5;
                    dynamicTargetSpeed = enemy.targetSpeed * (1 - (curveFactor * 0.32));
                }

                const launchProgress = Phaser.Math.Clamp(
                    (enemy.percent - enemy.launchDelay) / 3.2,
                    0,
                    1
                );
                const launchTargetSpeed = dynamicTargetSpeed * (0.25 + (launchProgress * 0.75));

                if (enemy.speed < launchTargetSpeed) {
                    enemy.speed += enemy.accelRate * dt;
                    if (enemy.speed > launchTargetSpeed) enemy.speed = launchTargetSpeed;
                } else if (enemy.speed > dynamicTargetSpeed) {
                    enemy.speed -= 3000 * dt;
                } else if (enemy.speed > launchTargetSpeed) {
                    enemy.speed -= 1800 * dt;
                }
            }

            enemy.z += enemy.speed * dt;

            // DETEÇÃO DE VOLTA PARA NPC
            if (enemy.z >= trackLength) {
                enemy.z -= trackLength;
                enemy.laps++;
                if (enemy.laps >= totalLaps) {
                    enemy.finished = true;
                    enemy.finishTime ??= enemy.percent;
                }
            }
            enemy.lastZ = enemy.z;

            // --- INTELIGÊNCIA DE DESVIO/ULTRAPASSAGEM ---
            const inLaunchPhase = enemy.percent < EnemyManager.LAUNCH_SETTLE_TIME;
            const laneDecision = this.chooseLane(enemy, playerZ, playerX, trackLength, playerActive);
            enemy.targetX = inLaunchPhase ? enemy.preferredLane : laneDecision.targetLane;

            if (laneDecision.aheadDistance < EnemyManager.EMERGENCY_BRAKE_DISTANCE) {
                enemy.speed = Math.min(enemy.speed, laneDecision.aheadSpeed * 0.96);
                enemy.speed = Math.max(0, enemy.speed - dt * 2600);
            }

            // Movimentação suave lateral
            const steerSpeed = (inLaunchPhase ? 0.45 : 0.62) * dt;
            if (Math.abs(enemy.x - enemy.targetX) > 0.01) {
                const dir = enemy.x < enemy.targetX ? 1 : -1;
                enemy.x += dir * steerSpeed;
                enemy.steering = dir;
            } else {
                enemy.x = enemy.targetX;
                enemy.steering = 0;
            }

            // Clamp para não sair da pista
            enemy.x = Phaser.Math.Clamp(enemy.x, -0.9, 0.9);

            // --- ATUALIZAÇÃO VISUAL BASEADA EM CURVA E STEERING ---
            let steerFrame = '00';
            const totalSteer = enemy.steering + (curve * 0.1); // Combina o desvio do carro com a curva da pista

            if (Math.abs(totalSteer) > 0.6) steerFrame = '03';
            else if (Math.abs(totalSteer) > 0.3) steerFrame = '02';
            else if (Math.abs(totalSteer) > 0.1) steerFrame = '01';

            enemy.frame = steerFrame;
            enemy.flipX = totalSteer < 0;
        });
    }

    private chooseLane(subject: EnemyVehicle, playerZ: number, playerX: number, trackLength: number, playerActive: boolean) {
        const currentLane = this.getNearestLane(subject.targetX);
        const homeLane = subject.preferredLane;
        const lookAheadDistance = Phaser.Math.Clamp(
            EnemyManager.SAFE_AHEAD_DISTANCE + subject.speed * 0.06,
            EnemyManager.SAFE_AHEAD_DISTANCE,
            1500
        );
        const currentTraffic = this.getLaneTraffic(subject, currentLane, playerZ, playerX, trackLength, playerActive);
        const currentAheadDistance = currentTraffic.aheadDistance ?? 9999;
        const currentAheadSpeed = currentTraffic.aheadSpeed ?? subject.targetSpeed;

        const isBlockedAhead = currentAheadDistance < EnemyManager.OVERTAKE_TRIGGER_DISTANCE;
        if (!isBlockedAhead) {
            const homeTraffic = this.getLaneTraffic(subject, homeLane, playerZ, playerX, trackLength, playerActive);
            const homeAheadDistance = homeTraffic.aheadDistance ?? 9999;
            const homeBehindDistance = homeTraffic.behindDistance ?? 9999;
            const canReturnHome =
                homeLane !== currentLane &&
                homeAheadDistance > EnemyManager.RETURN_TO_LANE_DISTANCE &&
                homeBehindDistance > EnemyManager.SAFE_REAR_DISTANCE;

            return {
                targetLane: canReturnHome ? homeLane : currentLane,
                aheadDistance: currentAheadDistance,
                aheadSpeed: currentAheadSpeed
            };
        }

        let bestLane = currentLane;
        let bestAheadDistance = currentAheadDistance;
        let bestAheadSpeed = currentAheadSpeed;

        for (const lane of EnemyManager.LANE_CENTERS) {
            if (lane === currentLane) continue;

            const traffic = this.getLaneTraffic(subject, lane, playerZ, playerX, trackLength, playerActive);
            const aheadDistance = traffic.aheadDistance ?? 9999;
            const behindDistance = traffic.behindDistance ?? 9999;
            const hasSafeRearGap = behindDistance > EnemyManager.SAFE_REAR_DISTANCE;
            const hasMeaningfulGain = aheadDistance > currentAheadDistance + EnemyManager.OVERTAKE_MIN_GAIN;
            const laneStillCrowded = aheadDistance < lookAheadDistance;

            if (!hasSafeRearGap || !hasMeaningfulGain || laneStillCrowded) {
                continue;
            }

            if (aheadDistance > bestAheadDistance) {
                bestLane = lane;
                bestAheadDistance = aheadDistance;
                bestAheadSpeed = traffic.aheadSpeed ?? subject.targetSpeed;
            }
        }

        return {
            targetLane: bestLane,
            aheadDistance: bestAheadDistance,
            aheadSpeed: bestAheadSpeed
        };
    }

    private getLaneTraffic(
        subject: EnemyVehicle,
        lane: number,
        playerZ: number,
        playerX: number,
        trackLength: number,
        playerActive: boolean
    ) {
        let aheadDistance: number | null = null;
        let aheadSpeed: number | null = null;
        let behindDistance: number | null = null;

        this.enemies.forEach(other => {
            if (other.id === subject.id) return;
            if (Math.abs(other.x - lane) > EnemyManager.LANE_CAPTURE_RANGE) return;

            const distAhead = this.forwardDistance(subject.z, other.z, trackLength);
            if (distAhead > 0 && (aheadDistance === null || distAhead < aheadDistance)) {
                aheadDistance = distAhead;
                aheadSpeed = other.speed;
            }

            const distBehind = this.forwardDistance(other.z, subject.z, trackLength);
            if (distBehind > 0 && (behindDistance === null || distBehind < behindDistance)) {
                behindDistance = distBehind;
            }
        });

        if (playerActive && Math.abs(playerX - lane) <= EnemyManager.LANE_CAPTURE_RANGE) {
            const playerAheadDistance = this.forwardDistance(subject.z, playerZ, trackLength);
            if (playerAheadDistance > 0 && (aheadDistance === null || playerAheadDistance < aheadDistance)) {
                aheadDistance = playerAheadDistance;
                aheadSpeed = 0;
            }

            const playerBehindDistance = this.forwardDistance(playerZ, subject.z, trackLength);
            if (playerBehindDistance > 0 && (behindDistance === null || playerBehindDistance < behindDistance)) {
                behindDistance = playerBehindDistance;
            }
        }

        return { aheadDistance, aheadSpeed, behindDistance };
    }

    private getNearestLane(x: number) {
        let bestLane = EnemyManager.LANE_CENTERS[0];
        let bestDistance = Math.abs(x - bestLane);

        for (const lane of EnemyManager.LANE_CENTERS) {
            const distance = Math.abs(x - lane);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestLane = lane;
            }
        }

        return bestLane;
    }

    private forwardDistance(fromZ: number, toZ: number, trackLength: number) {
        let dist = toZ - fromZ;
        if (dist < 0) dist += trackLength;
        return dist;
    }

    getParticipants(
        playerName: string,
        playerDist: number,
        playerFinished: boolean,
        playerFinishTime: number | null,
        trackLen: number
    ): RaceParticipant[] {
        return [
            {
                id: 'player',
                name: playerName,
                dist: playerDist,
                isPlayer: true,
                finished: playerFinished,
                finishTime: playerFinishTime
            },
            ...this.enemies.map(enemy => ({
                id: `enemy:${enemy.name}`,
                name: enemy.name,
                dist: enemy.finished ? trackLen * 999 : enemy.laps * trackLen + enemy.z,
                isPlayer: false,
                finished: enemy.finished,
                finishTime: enemy.finishTime
            }))
        ];
    }
}
