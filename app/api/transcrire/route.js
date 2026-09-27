// app/api/transcrire/route.js — envoie l'audio au serveur GPU (Brev) et renvoie le texte

export async function POST(request) {
  if (!process.env.TRANSCRIPTION_URL) {
    return Response.json({ erreur: "Transcription non configurée." }, { status: 503 });
  }
  try {
    const form = await request.formData();
    const res = await fetch(`${process.env.TRANSCRIPTION_URL}/transcrire`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(await res.text());
    return Response.json(await res.json());
  } catch (e) {
    console.error("[transcrire]", e.message);
    return Response.json(
      { erreur: "Transcription indisponible. Écrivez la description." },
      { status: 502 }
    );
  }
}