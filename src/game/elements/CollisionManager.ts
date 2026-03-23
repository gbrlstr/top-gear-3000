import { PlayerManager } from './PlayerManager';
import { EnemyVehicle } from './EnemyVehicle';
import { TrackManager } from '../road/TrackManager';

export class CollisionManager {
    // Hitbox ajustada ao corpo visível do sprite, não à imagem inteira.
    private static readonly VEHICLE_HALF_WIDTH = 0.10;
    private static readonly VEHICLE_HALF_LENGTH = 72;

    // A colisão longitudinal usa frente/traseira dos carros, não só centro a centro.
    private static readonly COLLIDE_X = CollisionManager.VEHICLE_HALF_WIDTH * 2;
    private static readonly COLLIDE_Z = CollisionManager.VEHICLE_HALF_LENGTH * 2;
    private static readonly REAR_IMPACT_Z = 18;
    private static readonly REAR_ALIGN_X = 0.16;
    private static readonly SAFE_GAP_Z = CollisionManager.COLLIDE_Z + 12;

    // Contato lateral contínuo, mais próximo do "scrape" de Top Gear.
    private static readonly SIDE_SCRAPE_PUSH = 0.028;
    private static readonly SIDE_SCRAPE_ENEMY_PUSH = 0.018;

    // Borda da pista: primeiro atrito forte, depois ricochete para dentro.
    private static readonly ROAD_EDGE_X = 1.08;
    private static readonly ROAD_WALL_X = 1.28;
    private static readonly ROAD_LIMIT_X = 1.36;

    private static readonly IMPACT_COOLDOWN_MS = 180;
    private static readonly SCRAPE_FX_COOLDOWN_MS = 90;
    private static readonly EDGE_FX_COOLDOWN_MS = 120;

    private static readonly enemyImpactCooldowns = new Map<number, number>();
    private static readonly enemyScrapeCooldowns = new Map<number, number>();
    private static readonly edgeCooldowns = new WeakMap<Phaser.Scene, number>();

    public static handleCollisions(
        player: PlayerManager,
        trackManager: TrackManager,
        enemies: EnemyVehicle[],
        scene: Phaser.Scene,
        playerWorldZ: number
    ) {
        const trackLength = trackManager.trackLength;
        const now = scene.time.now;

        for (const enemy of enemies) {
            const collision = this.getCollisionData(player.x, playerWorldZ, enemy.x, enemy.z, trackLength);
            if (!collision) continue;

            const isRearImpact = collision.absDz > this.REAR_IMPACT_Z && collision.absDx < this.REAR_ALIGN_X;

            if (isRearImpact) {
                this.resolvePlayerRearImpact(player, trackManager, enemy, playerWorldZ, collision.dz, now, scene);
            } else {
                this.resolvePlayerSideScrape(player, enemy, collision.dx, now, scene);
            }
        }

        this.handleRoadEdgeCollision(player, scene);

        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const e1 = enemies[i];
                const e2 = enemies[j];
                const collision = this.getCollisionData(e1.x, e1.z, e2.x, e2.z, trackLength);
                if (!collision) continue;
                this.resolveEnemyCollision(e1, e2, collision.dz, trackLength);
            }
        }
    }

    private static getCollisionData(x1: number, z1: number, x2: number, z2: number, trackLength: number) {
        const dx = x2 - x1;
        const absDx = Math.abs(dx);
        if (absDx > this.COLLIDE_X) return null;

        const dz = this.getWrappedDistance(z2, z1, trackLength);
        const absDz = Math.abs(dz);
        if (absDz > this.COLLIDE_Z) return null;

        return { dx, dz, absDx, absDz };
    }

    private static resolvePlayerRearImpact(
        player: PlayerManager,
        trackManager: TrackManager,
        enemy: EnemyVehicle,
        playerWorldZ: number,
        dz: number,
        now: number,
        scene: Phaser.Scene
    ) {
        const trackLength = trackManager.trackLength;
        const playerOffsetZ = this.getWrappedDistance(playerWorldZ, trackManager.position, trackLength);
        const cooldownUntil = this.enemyImpactCooldowns.get(enemy.id) ?? 0;
        const impactReady = now >= cooldownUntil;

        if (dz > 0) {
            trackManager.position = this.wrapZ(enemy.z - playerOffsetZ - this.SAFE_GAP_Z, trackLength);

            const sideDir = player.x >= enemy.x ? 1 : -1;
            player.x += sideDir * 0.04;

            if (impactReady) {
                const relativeSpeed = Math.max(player.speed - enemy.speed, 0);
                const speedLoss = Math.max(900, 1250 + relativeSpeed * 0.35);

                player.speed = Math.max(350, player.speed - speedLoss);
                player.applyDamage(10, scene);
                enemy.speed += Math.max(180, relativeSpeed * 0.16);
                this.playCollisionFeedback(scene, 0.007, 0.55);
                this.enemyImpactCooldowns.set(enemy.id, now + this.IMPACT_COOLDOWN_MS);
            } else {
                player.speed = Math.min(player.speed, enemy.speed + 120);
            }
        } else {
            enemy.z = this.wrapZ(playerWorldZ - this.SAFE_GAP_Z, trackLength);

            const sideDir = player.x >= enemy.x ? 1 : -1;
            player.x += sideDir * 0.03;

            if (impactReady) {
                enemy.speed *= 0.82;
                player.speed = Math.max(0, player.speed - 320);
                player.applyDamage(5, scene);
                this.playCollisionFeedback(scene, 0.004, 0.35);
                this.enemyImpactCooldowns.set(enemy.id, now + this.IMPACT_COOLDOWN_MS);
            }
        }

        player.x = Phaser.Math.Clamp(player.x, -this.ROAD_LIMIT_X, this.ROAD_LIMIT_X);
    }

    private static resolvePlayerSideScrape(
        player: PlayerManager,
        enemy: EnemyVehicle,
        dx: number,
        now: number,
        scene: Phaser.Scene
    ) {
        const sideDir = dx >= 0 ? -1 : 1;
        const relativeSpeed = Math.abs(player.speed - enemy.speed);
        const playerDrag = Math.max(55, relativeSpeed * 0.025);
        const enemyDrag = Math.max(30, relativeSpeed * 0.015);

        player.x += sideDir * this.SIDE_SCRAPE_PUSH;
        enemy.x -= sideDir * this.SIDE_SCRAPE_ENEMY_PUSH;

        player.speed = Math.max(0, player.speed - playerDrag);
        enemy.speed = Math.max(0, enemy.speed - enemyDrag);

        enemy.x = Phaser.Math.Clamp(enemy.x, -0.92, 0.92);
        player.x = Phaser.Math.Clamp(player.x, -this.ROAD_LIMIT_X, this.ROAD_LIMIT_X);

        const cooldownUntil = this.enemyScrapeCooldowns.get(enemy.id) ?? 0;
        if (now >= cooldownUntil) {
            player.applyDamage(2, scene);
            this.playCollisionFeedback(scene, 0.0025, 0.25);
            this.enemyScrapeCooldowns.set(enemy.id, now + this.SCRAPE_FX_COOLDOWN_MS);
        }
    }

    private static handleRoadEdgeCollision(player: PlayerManager, scene: Phaser.Scene) {
        const absX = Math.abs(player.x);
        if (absX <= this.ROAD_EDGE_X) return;

        const dir = Math.sign(player.x) || 1;
        const now = scene.time.now;

        if (absX > this.ROAD_WALL_X) {
            player.speed = Math.max(0, player.speed - 420);
            player.x -= dir * 0.06;

            const cooldownUntil = this.edgeCooldowns.get(scene) ?? 0;
            if (now >= cooldownUntil) {
                player.applyDamage(3, scene);
                this.playCollisionFeedback(scene, 0.006, 0.4);
                this.edgeCooldowns.set(scene, now + this.EDGE_FX_COOLDOWN_MS);
            }
        } else {
            player.speed = Math.max(0, player.speed - 180);
            player.x -= dir * 0.025;
        }

        player.x = Phaser.Math.Clamp(player.x, -this.ROAD_LIMIT_X, this.ROAD_LIMIT_X);
    }

    private static resolveEnemyCollision(e1: EnemyVehicle, e2: EnemyVehicle, dz: number, trackLength: number) {
        if (Math.abs(dz) > this.REAR_IMPACT_Z && Math.abs(e1.x - e2.x) < this.REAR_ALIGN_X) {
            if (dz > 0) {
                e1.speed = Math.max(0, e1.speed - 240);
                e2.speed *= 0.9;
                e1.z = this.wrapZ(e2.z - this.SAFE_GAP_Z, trackLength);
            } else {
                e2.speed = Math.max(0, e2.speed - 240);
                e1.speed *= 0.9;
                e2.z = this.wrapZ(e1.z - this.SAFE_GAP_Z, trackLength);
            }
            return;
        }

        const sideDir = e1.x >= e2.x ? 1 : -1;
        e1.x += sideDir * 0.015;
        e2.x -= sideDir * 0.015;
        e1.speed = Math.max(0, e1.speed - 25);
        e2.speed = Math.max(0, e2.speed - 25);
        e1.x = Phaser.Math.Clamp(e1.x, -0.92, 0.92);
        e2.x = Phaser.Math.Clamp(e2.x, -0.92, 0.92);
    }

    private static playCollisionFeedback(scene: Phaser.Scene, shakeIntensity: number, volume: number) {
        scene.cameras.main.shake(70, shakeIntensity);
        if (scene.sound.get('Collision')) {
            scene.sound.play('Collision', { volume });
        }
    }

    private static getWrappedDistance(targetZ: number, sourceZ: number, trackLength: number) {
        let dz = targetZ - sourceZ;
        if (dz > trackLength / 2) dz -= trackLength;
        if (dz < -trackLength / 2) dz += trackLength;
        return dz;
    }

    private static wrapZ(z: number, trackLength: number): number {
        if (!Number.isFinite(trackLength) || trackLength <= 0) return z;
        if (z < 0) return z + trackLength;
        if (z >= trackLength) return z - trackLength;
        return z;
    }
}