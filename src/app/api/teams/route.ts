import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("bugfix_admin_token")?.value === "authenticated";
}

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("total_score", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teams: data });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, avatar_color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Takım adı gerekli" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({ name: name.trim(), avatar_color: avatar_color || "#4F46E5" })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Bu takım adı zaten mevcut" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ team: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.total_score !== undefined) updates.total_score = body.total_score;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ team: data });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
