export interface HistoryItem {
    id: string;
    quizTitle: string;
    category: string;
    questionCount: number;
    durationMinutes: number;
    score: number;
    accuracy: string;
    playedAt: string;
    sessionId: string;
    isHost: boolean;
}

export interface HistoryFilters {
    search: string;
    category: string | null;
    dateFrom: Date | null;
    dateTo: Date | null;
}
