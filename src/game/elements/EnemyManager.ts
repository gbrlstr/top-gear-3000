import { EnemyVehicle } from './EnemyVehicle';
import { TrackManager } from '../road/TrackManager';

export class EnemyManager {
    public enemies: EnemyVehicle[] = [];

    constructor() { }

    createEnemies() {
        // CORES: Podes adicionar ou remover cores aqui (r00 a r19)
        const colors = ['r00', 'r03', 'r05', 'r07', 'r11', 'r14', 'r17', 'r19'];
        this.enemies = [];

        for (let i = 0; i < 9; i++) {
            // GRID DE LARGADA:
            // O Player está fixo na tela em Z=0.
            // Para que os inimigos não fiquem em cima do player, começamos em Z=400.

            const row = Math.floor(i / 2);

            // ESPAÇAMENTO Z: Aumenta o 400 para distanciar as filas longitudinalmente
            const z = 2550 - (row * 500);

            // POSIÇÃO X: -0.3 é esquerda, 0.3 é direita. 
            // AJUSTE AQUI para aproximar os carros do centro ou borda
            const x = (i % 2 === 0) ? 0.3 : -0.2;

            let finalX = x;
            let finalZ = z;

            // GRID DE LARGADA FINAL:
            // NPCs em 5 filas, com buffer Z=400 para o Player
            if (i === 8) {
                finalZ = 2750 - (row * 500);
                finalX = -0.15;
            }

            const color = colors[i % colors.length];
            this.enemies.push({
                id: i,
                z: finalZ,
                x: finalX,
                speed: 0,
                targetSpeed: Phaser.Math.Between(7000, 14000),
                color: color,
                frame: '00',
                targetX: finalX,
                steering: 0,
                flipX: false,
                laps: 0,
                lastZ: finalZ,
                finished: false,
                percent: 0
            });
        }
    }

    update(dt: number, isRacing: boolean, trackManager: TrackManager, playerX: number, totalLaps: number) {
        const trackLength = trackManager.trackLength;
        const playerZ = trackManager.position;

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
            // Pega o segmento atual do inimigo para saber a curva
            const segmentIndex = Math.floor(enemy.z / trackManager.segmentLength) % trackManager.segments.length;
            const segment = trackManager.segments[segmentIndex];
            const curve = segment ? segment.curve : 0;

            if (enemy.finished) {
                enemy.speed = Math.max(0, enemy.speed - dt * 2000);
            } else {
                // REDUÇÃO DE VELOCIDADE EM CURVAS:
                // Se a curva for acentuada (abs > 2), reduz a velocidade alvo significativamente
                let dynamicTargetSpeed = enemy.targetSpeed;
                if (Math.abs(curve) > 2) {
                    const curveFactor = Math.abs(curve) / 5; // Escala a penalidade
                    dynamicTargetSpeed = enemy.targetSpeed * (1 - (curveFactor * 0.4)); // Até 40% de perda
                }

                if (enemy.speed < dynamicTargetSpeed) {
                    enemy.speed += 2000 * dt;
                    if (enemy.speed > dynamicTargetSpeed) enemy.speed = dynamicTargetSpeed;
                } else if (enemy.speed > dynamicTargetSpeed) {
                    // Perda de velocidade forçada em curvas (frenagem)
                    enemy.speed -= 3000 * dt;
                }
            }

            enemy.z += enemy.speed * dt;

            // DETEÇÃO DE VOLTA PARA NPC
            if (enemy.z >= trackLength) {
                enemy.z -= trackLength;
                enemy.laps++;
                if (enemy.laps >= totalLaps) {
                    enemy.finished = true;
                }
            }
            enemy.lastZ = enemy.z;

            // --- INTELIGÊNCIA DE DESVIO/ULTRAPASSAGEM ---
            const carAhead = this.getCarAhead(enemy, playerZ, playerX, trackLength);
            if (carAhead && (carAhead.z - enemy.z) < 1500 && Math.abs(carAhead.x - enemy.x) < 0.4) {
                // Se alguém está na frente e na mesma zona lateral, muda de faixa
                enemy.targetX = carAhead.x > 0 ? -0.3 : 0.3;
            } else if (Math.abs(enemy.x - enemy.targetX) < 0.01) {
                // Se não há ninguém, garante que está numa das faixas padrão
                enemy.targetX = enemy.targetX > 0 ? 0.3 : -0.3;
            }

            // Movimentação suave lateral
            const steerSpeed = 0.5 * dt;
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

    private getCarAhead(subject: EnemyVehicle, playerZ: number, playerX: number, trackLength: number) {
        let closest: any = null;
        let minDist = 2000;

        // Check other NPCs
        this.enemies.forEach(other => {
            if (other.id === subject.id) return;
            let dist = other.z - subject.z;
            // Trata o wrap-around da pista
            if (dist < 0) dist += trackLength;

            if (dist > 0 && dist < minDist) {
                closest = other;
                minDist = dist;
            }
        });

        // Check if player is ahead (and within range)
        let playerDist = playerZ - subject.z;
        if (playerDist < 0) playerDist += trackLength;

        if (playerDist > 0 && playerDist < minDist) {
            closest = { z: playerZ, x: playerX };
        }

        return closest;
    }

    getParticipants(playerDist: number, trackLen: number) {
        const participants = [
            { name: 'PLAYER', dist: playerDist, isPlayer: true },
            ...this.enemies.map(e => ({ name: `PLAYER ${e.id + 1}`, dist: e.laps * trackLen + e.z, isPlayer: false }))
        ];

        // Ordena por distância (descendente)
        participants.sort((a, b) => b.dist - a.dist);
        return participants;
    }
}
