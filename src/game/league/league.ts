export const LEAGUE_POINTS = [20, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];

export const ENEMY_DRIVER_NAMES = [
    'NEIL',
    'ASH',
    'MARK',
    'MATTHEW',
    'NICK',
    'ADE',
    'PETE',
    'JIM',
    'KARL',
    'TERRIE',
    'BERNI',
    'TONY',
    'OLIVER',
    'RICHARD',
    'SYD',
    'ANDREW',
    'NASUNO',
    'PAUL',
    'DAVE'
];

export interface RaceParticipant {
    id: string;
    name: string;
    dist: number;
    isPlayer: boolean;
    finished: boolean;
    finishTime: number | null;
}

export interface LeagueEntry {
    id: string;
    name: string;
    points: number;
    isPlayer: boolean;
}

const LEAGUE_STORAGE_KEY = 'tg3k_league_table';
const PLAYER_STORAGE_KEY = 'playerName';

export function getPlayerName() {
    return localStorage.getItem(PLAYER_STORAGE_KEY)?.trim() || 'PLAYER';
}

export function loadLeagueTable(): LeagueEntry[] {
    try {
        const raw = localStorage.getItem(LEAGUE_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((entry): entry is LeagueEntry =>
            typeof entry?.id === 'string' &&
            typeof entry?.name === 'string' &&
            typeof entry?.points === 'number' &&
            typeof entry?.isPlayer === 'boolean'
        );
    } catch {
        return [];
    }
}

export function saveLeagueTable(entries: LeagueEntry[]) {
    localStorage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(entries));
}

export function sortRaceParticipants(participants: RaceParticipant[]) {
    return [...participants].sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? -1 : 1;

        if (a.finished && b.finished) {
            return (a.finishTime ?? Number.POSITIVE_INFINITY) - (b.finishTime ?? Number.POSITIVE_INFINITY);
        }

        return b.dist - a.dist;
    });
}

export function mergeLeaguePoints(participants: RaceParticipant[]) {
    const table = loadLeagueTable();
    const byId = new Map(table.map(entry => [entry.id, entry]));
    const sorted = sortRaceParticipants(participants);

    sorted.forEach((participant, index) => {
        const existing = byId.get(participant.id);
        const nextPoints = (existing?.points ?? 0) + (LEAGUE_POINTS[index] ?? 0);

        byId.set(participant.id, {
            id: participant.id,
            name: participant.name,
            points: nextPoints,
            isPlayer: participant.isPlayer
        });
    });

    const merged = [...byId.values()].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    saveLeagueTable(merged);
    return merged;
}
