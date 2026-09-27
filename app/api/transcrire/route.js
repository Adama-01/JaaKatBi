// app/api/transcrire/route.js — transcrit un vocal (whisper) et renvoie le texte.
//
// Trois fournisseurs, dans cet ordre :
//   1. TRANSCRIPTION_URL  — serveur GPU (NVIDIA Brev) utilisé par Amina
//   2. GROQ_API_KEY       — Groq, whisper-large-v3 : rapide, wolof correct
//   3. OPENAI_API_KEY     — OpenAI, gpt-4o-mini-transcribe
//
// Le wolof est la langue demandée par défaut (Whisper la code "wol").

export const runtime = "nodejs";

const TAILLE_MAX = 25 * 1024 * 1024; // 25 Mo, limite des API Whisper
const TIMEOUT_MS = 60000;

function langueDemandee() {
  return process.env.TRANSCRIPTION_LANGUAGE || "wol";
}

async function versGPU(form, url) {
  const res = await fetch(`${url}/transcrire`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GPU ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return String(data.texte ?? data.text ?? "");
}

async function versGroq(audio, nomFichier) {
  const form = new FormData();
  form.append("file", audio, nomFichier);
  form.append("model", process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3");
  form.append("language", langueDemandee());
  form.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return String(data.text ?? "");
}

async function versOpenAI(audio, nomFichier) {
  const form = new FormData();
  form.append("file", audio, nomFichier);
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  form.append("language", langueDemandee());

  // Surcharge possible : proxy OpenAI-compatible (ex: un serveur Whisper local).
  const base = (
    process.env.OPENAI_TRANSCRIBE_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  const res = await fetch(`${base}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return String(data.text ?? "");
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ erreur: "Aucun audio reçu." }, { status: 400 });
  }

  const fichier = form.get("audio");
  if (!fichier || typeof fichier === "string") {
    return Response.json({ erreur: "Aucun audio reçu." }, { status: 400 });
  }
  if (fichier.size === 0) {
    return Response.json({ erreur: "Audio vide." }, { status: 400 });
  }
  if (fichier.size > TAILLE_MAX) {
    return Response.json(
      { erreur: "Vocal trop long (25 Mo maximum). Réenregistrez plus court." },
      { status: 413 }
    );
  }

  const nomFichier = fichier.name || "vocal.webm";
  const audio = new Blob([await fichier.arrayBuffer()], {
    type: fichier.type || "audio/webm",
  });

  const fournisseurs = [];
  if (process.env.TRANSCRIPTION_URL) {
    fournisseurs.push({
      nom: "gpu",
      appel: () => {
        // Le GPU attend le multipart tel quel : on reconstruit un FormData.
        const g = new FormData();
        g.append("audio", audio, nomFichier);
        return versGPU(g, process.env.TRANSCRIPTION_URL);
      },
    });
  }
  if (process.env.GROQ_API_KEY) {
    fournisseurs.push({ nom: "groq", appel: () => versGroq(audio, nomFichier) });
  }
  if (process.env.OPENAI_API_KEY) {
    fournisseurs.push({ nom: "openai", appel: () => versOpenAI(audio, nomFichier) });
  }

  if (fournisseurs.length === 0) {
    return Response.json(
      {
        erreur:
          "Transcription non configurée. Renseignez GROQ_API_KEY (recommandé) ou OPENAI_API_KEY dans .env.local.",
      },
      { status: 503 }
    );
  }

  for (const f of fournisseurs) {
    try {
      const texte = (await f.appel()).trim();
      if (!texte) continue;
      console.log(`[transcrire] OK via ${f.nom} (${texte.length} caracteres)`);
      return Response.json({ texte });
    } catch (e) {
      console.error(`[transcrire] echec ${f.nom}:`, e.message);
    }
  }

  return Response.json(
    { erreur: "Transcription indisponible. Réessayez ou écrivez la description." },
    { status: 502 }
  );
}
