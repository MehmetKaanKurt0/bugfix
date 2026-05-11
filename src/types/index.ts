export interface Team {
  id: string;
  name: string;
  avatar_color: string;
  total_score: number;
  created_at: string;
}

export interface Round {
  id: string;
  title: string;
  buggy_code: string;
  language: string;
  is_active: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  team_id: string;
  round_id: string;
  submitted_code: string;
  ai_score: number;
  ai_feedback: string;
  final_score: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface LeaderboardEntry {
  team: Team;
  previous_rank: number;
  current_rank: number;
  score_change: number;
}

export interface GradeResult {
  score: number;
  summary: string;
  detailed_feedback: string;
  bugs_found: string[];
  bugs_fixed: string[];
  bugs_missed: string[];
  new_bugs: string[];
  roast: string;
}
