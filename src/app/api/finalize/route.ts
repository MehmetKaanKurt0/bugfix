import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("bugfix_admin_token")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { round_id } = await req.json();
  if (!round_id) return NextResponse.json({ error: "round_id gerekli" }, { status: 400 });

  const supabase = createServerClient();

  // Get the round
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", round_id)
    .single();

  if (roundErr || !round) {
    return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });
  }

  // Get approved submissions for this round (scores already applied to teams)
  const { data: roundSubs } = await supabase
    .from("submissions")
    .select("team_id, final_score")
    .eq("round_id", round_id)
    .eq("status", "approved");

  const roundScoreMap = new Map<string, number>();
  for (const sub of roundSubs || []) {
    roundScoreMap.set(sub.team_id, sub.final_score || 0);
  }

  // Get current teams (scores already include this round)
  const { data: currentTeams } = await supabase
    .from("teams")
    .select("*")
    .order("total_score", { ascending: false });

  if (!currentTeams) {
    return NextResponse.json({ error: "Takımlar yüklenemedi" }, { status: 500 });
  }

  // Calculate old scores (before this round) to find old rankings
  const teamsWithOldScores = currentTeams.map((t) => ({
    ...t,
    old_score: t.total_score - (roundScoreMap.get(t.id) || 0),
  }));

  const oldRanking = [...teamsWithOldScores].sort((a, b) => b.old_score - a.old_score);
  const oldRankMap = new Map<string, { rank: number; score: number }>();
  oldRanking.forEach((t, i) => {
    oldRankMap.set(t.id, { rank: i + 1, score: t.old_score });
  });

  // Build ranking_changes (current order is by total_score desc)
  const ranking_changes = currentTeams.map((t, i) => {
    const old = oldRankMap.get(t.id);
    return {
      team_id: t.id,
      team_name: t.name,
      team_color: t.avatar_color,
      old_rank: old?.rank ?? i + 1,
      new_rank: i + 1,
      old_score: old?.score ?? 0,
      new_score: t.total_score,
      score_change: roundScoreMap.get(t.id) || 0,
    };
  });

  // Insert event
  const { error: eventErr } = await supabase.from("events").insert({
    type: "round_finalized",
    data: {
      round_id: round.id,
      round_title: round.title,
      ranking_changes,
    },
  });

  if (eventErr) {
    return NextResponse.json({ error: eventErr.message }, { status: 500 });
  }

  // Deactivate round
  await supabase.from("rounds").update({ is_active: false }).eq("id", round_id);

  return NextResponse.json({
    success: true,
    ranking_changes,
    message: "Tur sonlandırıldı!",
  });
}
