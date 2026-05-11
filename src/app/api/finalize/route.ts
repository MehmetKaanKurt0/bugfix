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

  // Snapshot current rankings (before any updates)
  const { data: teamsBefore } = await supabase
    .from("teams")
    .select("*")
    .order("total_score", { ascending: false });

  if (!teamsBefore) {
    return NextResponse.json({ error: "Takımlar yüklenemedi" }, { status: 500 });
  }

  const oldRankMap = new Map<string, { rank: number; score: number }>();
  teamsBefore.forEach((t, i) => {
    oldRankMap.set(t.id, { rank: i + 1, score: t.total_score });
  });

  // Get new rankings after scores
  const { data: teamsAfter } = await supabase
    .from("teams")
    .select("*")
    .order("total_score", { ascending: false });

  if (!teamsAfter) {
    return NextResponse.json({ error: "Güncel sıralama alınamadı" }, { status: 500 });
  }

  // Build ranking_changes
  const ranking_changes = teamsAfter.map((t, i) => {
    const old = oldRankMap.get(t.id);
    return {
      team_id: t.id,
      team_name: t.name,
      team_color: t.avatar_color,
      old_rank: old?.rank ?? i + 1,
      new_rank: i + 1,
      old_score: old?.score ?? 0,
      new_score: t.total_score,
      score_change: t.total_score - (old?.score ?? 0),
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
