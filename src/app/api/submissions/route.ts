import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const roundId = req.nextUrl.searchParams.get("round_id");

  const supabase = createServerClient();
  let query = supabase.from("submissions").select("*");
  if (roundId) query = query.eq("round_id", roundId);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data });
}
