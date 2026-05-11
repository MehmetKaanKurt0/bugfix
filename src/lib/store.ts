import { create } from "zustand";
import type { Team, Round, Submission, LeaderboardEntry } from "@/types";

export interface RankingChange {
  team_id: string;
  team_name: string;
  team_color: string;
  old_rank: number;
  new_rank: number;
  old_score: number;
  new_score: number;
  score_change: number;
}

interface AppState {
  teams: Team[];
  currentRound: Round | null;
  submissions: Submission[];
  leaderboard: LeaderboardEntry[];
  rankingChanges: RankingChange[] | null;
  isAnimating: boolean;
  soundEnabled: boolean;
  setTeams: (teams: Team[]) => void;
  setCurrentRound: (round: Round | null) => void;
  setSubmissions: (submissions: Submission[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setRankingChanges: (changes: RankingChange[] | null) => void;
  setIsAnimating: (animating: boolean) => void;
  setBattleComplete: () => void;
  toggleSound: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  teams: [],
  currentRound: null,
  submissions: [],
  leaderboard: [],
  rankingChanges: null,
  isAnimating: false,
  soundEnabled: false,
  setTeams: (teams) => set({ teams }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setSubmissions: (submissions) => set({ submissions }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setRankingChanges: (rankingChanges) => set({ rankingChanges }),
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  setBattleComplete: () => set({ isAnimating: false }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}));
