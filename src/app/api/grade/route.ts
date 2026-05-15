import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { createServerClient } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("bugfix_admin_token")?.value === "authenticated";
}

const SYSTEM_PROMPT = `Sen BUGFIX yarışmasının acımasız kod hakemisin. Bilgisayar Topluluğu'nun etkinliğinde
takımlar hatalı kodları düzeltmeye çalışıyor. Sen onları değerlendiriyorsun.

Sana iki kod verilecek:
1. ORİJİNAL HATALI KOD (hataları içeren versiyon)
2. KATILIMCININ DÜZELTMESİ (takımın gönderdiği düzeltilmiş kod)

Görevin:
1. Orijinal koddaki TÜM hataları tespit et
2. Katılımcının hangi hataları düzelttiğini analiz et
3. Kaçırdığı hataları belirle
4. Yeni hatalar eklemiş mi kontrol et
5. 100 üzerinden SERT ve GERÇEKÇİ bir puan ver

PUANLAMA KRİTERLERİ:
- Hataları doğru tespit etme: 30 puan
- Düzeltmelerin doğruluğu: 40 puan
- Kod kalitesi, clean code, best practice: 20 puan
- Ekstra iyileştirmeler (performans, okunabilirlik): 10 puan

KURALLAR:
- Yağ çekme yok. Kötüyse kötü de. Acıma yok.
- 90+ puan: sadece mükemmel düzeltmeler (çok nadir ver)
- 70-89: iyi düzeltme ama eksikler var
- 50-69: ortalama, bazı hataları kaçırmış
- 30-49: zayıf, ciddi hatalar kaçırılmış veya yeni hatalar eklenmiş
- 0-29: felaket, kodu daha da bozmuş
- Feedback'in teknik ve net olsun ama aynı zamanda eğlenceli.
- Espri yap, takıma moral ver veya hafifçe troll'le.
- Türkçe yanıt ver.

YANITINI SADECE JSON OLARAK VER, başka hiçbir şey yazma:
{
  "score": 75,
  "summary": "Kısa bir özet (1-2 cümle)",
  "detailed_feedback": "Detaylı teknik analiz (birkaç paragraf)...",
  "bugs_found": ["orijinal koddaki hata 1", "hata 2"],
  "bugs_fixed": ["katılımcının düzelttiği hata 1"],
  "bugs_missed": ["kaçırılan hata 1"],
  "new_bugs": ["katılımcının eklediği yeni hata (varsa)"],
  "roast": "Takıma özel kısa ve eğlenceli bir yorum"
}`;

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { buggy_code, submitted_code, language, team_id, round_id } = await req.json();

  if (!buggy_code || !submitted_code || !team_id || !round_id) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("team_id", team_id)
    .eq("round_id", round_id)
    .eq("status", "approved")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Bu takım bu turda zaten puanlandı" }, { status: 409 });
  }

  const userPrompt = `PROGRAMLAMA DİLİ: ${language || "javascript"}

=== ORİJİNAL HATALI KOD ===
${buggy_code}

=== KATILIMCININ DÜZELTMESİ ===
${submitted_code}`;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let result = null;
  let rawContent = "";
  const MAX_RETRIES = 3;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      rawContent = completion.choices[0]?.message?.content || "";

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  if (!result && !rawContent) {
    return NextResponse.json(
      { error: "AI yanıt vermedi. Lütfen tekrar deneyin.", raw: rawContent, details: String(lastErr) },
      { status: 502 }
    );
  }

  if (!result) {
    return NextResponse.json(
      { error: "AI yanıtı JSON olarak ayrıştırılamadı", raw: rawContent },
      { status: 422 }
    );
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .upsert(
      {
        team_id,
        round_id,
        submitted_code,
        ai_score: result.score,
        ai_feedback: result,
        status: "pending",
      },
      { onConflict: "team_id,round_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result, submission });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submission_id, status, final_score } = await req.json();
  if (!submission_id || !status) {
    return NextResponse.json({ error: "submission_id ve status gerekli" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: submission, error: fetchErr } = await supabase
    .from("submissions")
    .select("*, teams(total_score)")
    .eq("id", submission_id)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.json({ error: "Submission bulunamadı" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("submissions")
    .update({ status, final_score: final_score ?? submission.ai_score })
    .eq("id", submission_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (status === "approved") {
    const scoreToAdd = final_score ?? submission.ai_score;
    const currentTotal = (submission.teams as { total_score: number })?.total_score ?? 0;

    const { error: teamErr } = await supabase
      .from("teams")
      .update({ total_score: currentTotal + scoreToAdd })
      .eq("id", submission.team_id);

    if (teamErr) {
      return NextResponse.json({ error: teamErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, status, final_score: final_score ?? submission.ai_score });
}
