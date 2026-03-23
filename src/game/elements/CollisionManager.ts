import { PlayerManager } from './PlayerManager';
import { EnemyVehicle } from './EnemyVehicle';
import { TrackManager } from '../road/TrackManager';

export class CollisionManager {
    // Thresholds ajustados para a escala do Top Gear
    private static readonly COLLIDE_X = 0.45; // Um pouco mais largo para facilitar a colisão
    private static readonly COLLIDE_Z = 160;  // Comprimento do carro
    private static readonly BOUNCE_FORCE_X = 0.15; // Força do ricochete lateral
    private static readonly BOUNCE_FORCE_Z = 1200; // Perda/Ganho instantâneo de velocidade

    public static handleCollisions(player: PlayerManager, trackManager: TrackManager, enemies: EnemyVehicle[], scene: Phaser.Scene) {
        const trackLength = trackManager.trackLength;
        const playerZ = trackManager.position;

        for (const enemy of enemies) {
            // Ignora inimigos muito distantes antes de calcular a colisão precisa (otimização)
            let dz = Math.abs(playerZ - enemy.z);
            if (dz > trackLength / 2) dz = trackLength - dz;
            if (dz > 1000) continue;

            if (this.isColliding(player.x, playerZ, enemy.x, enemy.z, trackLength)) {
                this.resolvePlayerEnemyCollision(player, trackManager, enemy, scene);
            }
        }

        // Colisão entre inimigos (opcionalmente mais simples para performance)
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const e1 = enemies[i];
                const e2 = enemies[j];
                if (this.isColliding(e1.x, e1.z, e2.x, e2.z, trackLength)) {
                    this.resolveEnemyCollision(e1, e2, trackLength);
                }
            }
        }
    }

    private static isColliding(x1: number, z1: number, x2: number, z2: number, trackLength: number): boolean {
        const dx = Math.abs(x1 - x2);
        if (dx > this.COLLIDE_X) return false;

        let dz = Math.abs(z1 - z2);
        if (dz > trackLength / 2) dz = trackLength - dz;
        return dz < this.COLLIDE_Z;
    }

    private static resolvePlayerEnemyCollision(player: PlayerManager, trackManager: TrackManager, enemy: EnemyVehicle, scene: Phaser.Scene) {
        const trackLength = trackManager.trackLength;
        const playerZ = trackManager.position;

        let dz = enemy.z - playerZ;
        if (dz > trackLength / 2) dz -= trackLength;
        if (dz < -trackLength / 2) dz += trackLength;

        // Efeito de Câmera e Som (Feel)
        scene.cameras.main.shake(100, 0.005);
        if (scene.sound.get('Collision')) scene.sound.play('Collision', { volume: 0.5 });

        // Determinar o tipo de colisão
        if (Math.abs(dz) > this.COLLIDE_Z * 0.6) {
            // COLISÃO TRASEIRA / FRONTAL
            if (dz > 0) {
                // Player bateu na traseira do inimigo
                player.speed = Math.max(player.speed - this.BOUNCE_FORCE_Z, 500);
                enemy.speed += this.BOUNCE_FORCE_Z * 0.8;
                // SNAP PLAYER BEHIND ENEMY (Evita atravessar)
                trackManager.position = this.wrapZ(enemy.z - this.COLLIDE_Z, trackLength);
            } else {
                // Inimigo bateu na traseira do player (Boost!)
                enemy.speed *= 0.6;
                player.speed = Math.min(player.speed + 800, player.maxSpeed * 1.1);
                // SNAP ENEMY BEHIND PLAYER
                enemy.z = this.wrapZ(playerZ - this.COLLIDE_Z, trackLength);
            }
        } else {
            // COLISÃO LATERAL (Esbarrão)
            const sideDir = player.x > enemy.x ? 1 : -1;

            // Ricochete lateral
            player.x += sideDir * this.BOUNCE_FORCE_X;
            enemy.x -= sideDir * this.BOUNCE_FORCE_X;

            // Perda de velocidade por fricção
            player.speed *= 0.92;
            enemy.speed *= 0.92;
        }

        // Impedir que o carro saia voando para fora da tela drasticamente
        player.x = Phaser.Math.Clamp(player.x, -2, 2);
    }

    private static resolveEnemyCollision(e1: EnemyVehicle, e2: EnemyVehicle, trackLength: number) {
        let dz = e1.z - e2.z;
        if (dz > trackLength / 2) dz -= trackLength;
        if (dz < -trackLength / 2) dz += trackLength;

        if (Math.abs(dz) > this.COLLIDE_Z * 0.6) {
            if (dz > 0) {
                // e2 bateu atrás de e1
                e2.speed *= 0.7;
                e1.speed += 300;
                e2.z = this.wrapZ(e1.z - this.COLLIDE_Z, trackLength);
            } else {
                // e1 bateu atrás de e2
                e1.speed *= 0.7;
                e2.speed += 300;
                e1.z = this.wrapZ(e2.z - this.COLLIDE_Z, trackLength);
            }
        } else {
            // Lógica simplificada para NPCs não se travarem
            const pushSide = e1.x > e2.x ? 0.05 : -0.05;
            e1.x += pushSide;
            e2.x -= pushSide;
            e1.speed *= 0.98;
            e2.speed *= 0.98;
        }
    }

    private static wrapZ(z: number, trackLength: number): number {
        if (z < 0) return z + trackLength;
        if (z >= trackLength) return z - trackLength;
        return z;
    }
}