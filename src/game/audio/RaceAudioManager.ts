import { Scene } from 'phaser';

export class RaceAudioManager {
    private static readonly DATA_KEY = 'raceAudioManager';

    private scene: Scene;
    private engineLow?: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound;
    private engineMid?: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound;
    private engineHigh?: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound;
    private rechargeLoop?: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound;
    private repairLoop?: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound;
    private lastCountdownValue: number | null = null;
    private lastCollisionMs = -9999;
    private lastSkidMs = -9999;
    private lastLowEnergyMs = -9999;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    static fromScene(scene: Scene) {
        return (scene.data.get(RaceAudioManager.DATA_KEY) as RaceAudioManager | undefined) ?? null;
    }

    create() {
        this.scene.data.set(RaceAudioManager.DATA_KEY, this);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
    }

    update(playerSpeed: number, healthPercent: number, isRacing: boolean, isBroken: boolean) {
        const engineActive = isRacing && !isBroken;
        this.updateEngine(playerSpeed, engineActive);
        this.updateLowEnergy(healthPercent, isRacing && !isBroken);
    }

    handleCountdown(displayValue: number) {
        const clamped = Phaser.Math.Clamp(displayValue, 0, 3);
        if (displayValue > 3 || clamped === this.lastCountdownValue) return;

        this.lastCountdownValue = clamped;
        if (clamped === 0) {
            this.playOneShot('Go', 0.9);
            return;
        }

        this.playOneShot('Ready', 0.6 + (3 - clamped) * 0.08);
    }

    playCollision(heavy = false) {
        const now = this.scene.time.now;
        const cooldownMs = heavy ? 140 : 90;
        if (now - this.lastCollisionMs < cooldownMs) return;

        this.lastCollisionMs = now;
        this.playOneShot(heavy ? 'CollisionHeavy' : 'Collision', heavy ? 0.6 : 0.42);
    }

    playSkid() {
        const now = this.scene.time.now;
        if (now - this.lastSkidMs < 120) return;

        this.lastSkidMs = now;
        this.playOneShot('Skid', 0.22);
    }

    playExplosion() {
        this.playOneShot('CollisionHeavy', 0.7);
    }

    playBonus() {
        this.playOneShot('Bonus', 0.5);
    }

    playOneShotBoost() {
        this.playOneShot('Nitro', 0.42);
    }

    setRechargeActive(active: boolean) {
        if (!active) {
            this.stopEngineLayer(this.rechargeLoop);
            return;
        }

        this.rechargeLoop = this.ensureLoop(this.rechargeLoop, 'Recharge', 0.32);
    }

    setRepairActive(active: boolean) {
        if (!active) {
            this.stopEngineLayer(this.repairLoop);
            return;
        }

        this.repairLoop = this.ensureLoop(this.repairLoop, 'Repair', 0.3);
    }

    destroy() {
        this.stopEngineLayer(this.engineLow);
        this.stopEngineLayer(this.engineMid);
        this.stopEngineLayer(this.engineHigh);
        this.stopEngineLayer(this.rechargeLoop);
        this.stopEngineLayer(this.repairLoop);
        this.engineLow = undefined;
        this.engineMid = undefined;
        this.engineHigh = undefined;
        this.rechargeLoop = undefined;
        this.repairLoop = undefined;

        if (this.scene.data.get(RaceAudioManager.DATA_KEY) === this) {
            this.scene.data.remove(RaceAudioManager.DATA_KEY);
        }
    }

    private updateEngine(playerSpeed: number, active: boolean) {
        if (!active) {
            this.stopEngineLayer(this.engineLow);
            this.stopEngineLayer(this.engineMid);
            this.stopEngineLayer(this.engineHigh);
            return;
        }

        this.engineLow = this.ensureLoop(this.engineLow, 'EngineLow', 0.10);
        this.engineMid = this.ensureLoop(this.engineMid, 'EngineMid', 0.0);
        this.engineHigh = this.ensureLoop(this.engineHigh, 'EngineHigh', 0.0);

        const speedPercent = Phaser.Math.Clamp(playerSpeed / 12000, 0, 1);
        const lowVolume = 0.08 + (1 - speedPercent) * 0.18;
        const midVolume = Phaser.Math.Clamp((speedPercent - 0.18) / 0.45, 0, 1) * 0.18;
        const highVolume = Phaser.Math.Clamp((speedPercent - 0.55) / 0.35, 0, 1) * 0.22;
        const engineLow = this.asAdjustableSound(this.engineLow);
        const engineMid = this.asAdjustableSound(this.engineMid);
        const engineHigh = this.asAdjustableSound(this.engineHigh);

        engineLow?.setVolume(lowVolume);
        engineMid?.setVolume(midVolume);
        engineHigh?.setVolume(highVolume);

        engineLow?.setRate(0.92 + speedPercent * 0.25);
        engineMid?.setRate(0.96 + speedPercent * 0.35);
        engineHigh?.setRate(1.0 + speedPercent * 0.45);
    }

    private updateLowEnergy(healthPercent: number, active: boolean) {
        if (!active || healthPercent > 0.25) return;

        const now = this.scene.time.now;
        if (now - this.lastLowEnergyMs < 2500) return;

        this.lastLowEnergyMs = now;
        this.playOneShot('LowEnergy', 0.35);
    }

    private ensureLoop(
        sound: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound | undefined,
        key: string,
        volume: number
    ): Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound {
        if (sound?.isPlaying) {
            return sound;
        }

        const nextSound = sound ?? this.scene.sound.add(key, { loop: true, volume });
        if (!nextSound.isPlaying) {
            nextSound.play();
        }

        return nextSound;
    }

    private stopEngineLayer(sound: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound | undefined) {
        if (sound?.isPlaying) {
            sound.stop();
        }
    }

    private asAdjustableSound(sound: Phaser.Sound.BaseSound | Phaser.Sound.NoAudioSound | undefined) {
        if (!sound || !('setVolume' in sound) || !('setRate' in sound)) {
            return null;
        }

        return sound as Phaser.Sound.BaseSound & {
            setVolume(value: number): Phaser.Sound.BaseSound;
            setRate(value: number): Phaser.Sound.BaseSound;
        };
    }

    private playOneShot(key: string, volume: number) {
        if (!this.scene.cache.audio.exists(key)) return;
        this.scene.sound.play(key, { volume });
    }
}
