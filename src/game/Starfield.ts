import { Scene } from 'phaser';

export class Starfield {
    private scene: Scene;
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Scene) {
        this.scene = scene;
        this.create();
    }

    private create() {
        const textureKey = 'star_pixel';

        // Create a small white texture if it doesn't exist (2x2 pixels)
        if (!this.scene.textures.exists(textureKey)) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture(textureKey, 2, 2);
            graphics.destroy();
        }

        // Create the particle emitter for twinkling stars
        this.emitter = this.scene.add.particles(0, 0, textureKey, {
            x: { min: 0, max: 1024 },
            y: { min: 0, max: 768 },
            scale: { min: 0.2, max: 1.0 },
            alpha: {
                onEmit: () => 0,
                onUpdate: (_, __, t) => {
                    // Smooth sin curve for twinkling: 0 -> 1 -> 0
                    return Math.sin(t * Math.PI);
                }
            },
            lifespan: { min: 3000, max: 6000 },
            frequency: 150, // New star roughly every 150ms
            quantity: 1,
            maxParticles: 150, // Allow more particles for a richer field
            blendMode: 'ADD'
        });

        this.emitter.setDepth(-10);

        // Pre-fill stars to avoid starting with an empty screen
        // We'll advance the emitter state so stars are at different stages of their life
        for (let i = 0; i < 100; i++) {
            const p = this.emitter.emitParticleAt(
                Phaser.Math.Between(0, 1024),
                Phaser.Math.Between(0, 768)
            );
            if (p) {
                // Randomly set the current life time (0 to 1) 
                // so they appear at different brightness levels immediately
                p.lifeT = Math.random();
            }
        }
    }

    // Keep the method signature to avoid breaking existing scenes, but scrolling is removed
    update() {
    }
}
