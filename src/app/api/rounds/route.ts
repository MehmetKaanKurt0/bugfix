import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("bugfix_admin_token")?.value === "authenticated";
}

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rounds: data });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, buggy_code, language } = await req.json();
  if (!title?.trim() || !buggy_code?.trim()) {
    return NextResponse.json({ error: "Başlık ve kod gerekli" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rounds")
    .insert({ title: title.trim(), buggy_code, language: language || "javascript" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ round: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { is_active } = await req.json();
  const supabase = createServerClient();

  if (is_active) {
    await supabase.from("rounds").update({ is_active: false }).neq("id", id);
  }

  const { data, error } = await supabase
    .from("rounds")
    .update({ is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ round: data });
}
