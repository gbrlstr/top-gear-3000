import { RaceRewardEntry } from './championship';

export const SECRET_BONUS_VALUES = {
    A: 30000,
    C: 70000,
    D: 40000,
    E: 20000
} as const;

export interface RaceTelemetry {
    boostUsed: boolean;
    finishWithBoostActive: boolean;
    carCollisionCount: number;
    obstacleCollisionCount: number;
    offRoadMoments: number;
    collectedTrackCredits: number;
    collectedBoostPickups: number;
}

export interface SecretBonusOutcome {
    rewardEntries: RaceRewardEntry[];
    pendingEntries: string[];
}

export function createRaceTelemetry(): RaceTelemetry {
    return {
        boostUsed: false,
        finishWithBoostActive: false,
        carCollisionCount: 0,
        obstacleCollisionCount: 0,
        offRoadMoments: 0,
        collectedTrackCredits: 0,
        collectedBoostPickups: 0
    };
}

export function evaluateSecretBonuses(telemetry: RaceTelemetry): SecretBonusOutcome {
    const rewardEntries: RaceRewardEntry[] = [];

    if (telemetry.collectedTrackCredits > 0) {
        rewardEntries.push({
            label: 'TRACK BONUS',
            amount: telemetry.collectedTrackCredits
        });
    }

    if (telemetry.finishWithBoostActive) {
        rewardEntries.push({
            label: 'SECRET BONUS A',
            amount: SECRET_BONUS_VALUES.A
        });
    }

    if (telemetry.carCollisionCount === 0) {
        rewardEntries.push({
            label: 'SECRET BONUS C',
            amount: SECRET_BONUS_VALUES.C
        });
    }

    if (telemetry.obstacleCollisionCount === 0) {
        rewardEntries.push({
            label: 'SECRET BONUS D',
            amount: SECRET_BONUS_VALUES.D
        });
    }

    if (telemetry.offRoadMoments === 0) {
        rewardEntries.push({
            label: 'SECRET BONUS E',
            amount: SECRET_BONUS_VALUES.E
        });
    }

    return {
        rewardEntries,
        pendingEntries: ['SECRET BONUS B - PENDING']
    };
}
