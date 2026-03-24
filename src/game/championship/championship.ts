import { RaceParticipant, sortRaceParticipants } from '../league/league';

export const CHAMPIONSHIP_CREDITS = [
    120000,
    90000,
    70000,
    55000,
    45000,
    36000,
    30000,
    25000,
    21000,
    17000,
    13000,
    10000,
    8000,
    6000,
    5000,
    4000,
    3000,
    2000,
    1000,
    500
] as const;

export interface ChampionshipState {
    credits: number;
}

export interface RaceRewardEntry {
    label: string;
    amount: number;
}

export interface RaceCreditSummary {
    position: number;
    baseCredits: number;
    rewardEntries: RaceRewardEntry[];
    pendingEntries: string[];
    earnedCredits: number;
    totalCredits: number;
}

const CHAMPIONSHIP_STORAGE_KEY = 'tg3k_championship_state';

export function loadChampionshipState(): ChampionshipState {
    try {
        const raw = localStorage.getItem(CHAMPIONSHIP_STORAGE_KEY);
        if (!raw) return { credits: 0 };

        const parsed = JSON.parse(raw);
        return {
            credits: typeof parsed?.credits === 'number' ? Math.max(0, Math.floor(parsed.credits)) : 0
        };
    } catch {
        return { credits: 0 };
    }
}

export function saveChampionshipState(state: ChampionshipState) {
    localStorage.setItem(CHAMPIONSHIP_STORAGE_KEY, JSON.stringify({
        credits: Math.max(0, Math.floor(state.credits))
    }));
}

export function resetChampionshipState() {
    saveChampionshipState({ credits: 0 });
}

export function getCreditsForPosition(position: number) {
    return CHAMPIONSHIP_CREDITS[position - 1] ?? 0;
}

export function awardRaceCredits(
    participants: RaceParticipant[],
    rewardEntries: RaceRewardEntry[] = [],
    pendingEntries: string[] = []
): RaceCreditSummary {
    const sorted = sortRaceParticipants(participants);
    const playerIndex = sorted.findIndex(participant => participant.isPlayer);
    const position = playerIndex >= 0 ? playerIndex + 1 : sorted.length;
    const baseCredits = getCreditsForPosition(position);
    const extraCredits = rewardEntries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.amount)), 0);
    const earnedCredits = baseCredits + extraCredits;

    const state = loadChampionshipState();
    const totalCredits = state.credits + earnedCredits;

    saveChampionshipState({
        credits: totalCredits
    });

    return {
        position,
        baseCredits,
        rewardEntries: rewardEntries.filter(entry => entry.amount > 0),
        pendingEntries,
        earnedCredits,
        totalCredits
    };
}
