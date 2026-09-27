// app/api/generer/route.js — génère description + légendes avec l'IA
// Principal : NVIDIA Build. Secours automatique : Gemini.

import { SYSTEM_PROMPT, buildUserPrompt, OCCASIONS } from "@/lib/prompts";

const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TIMEOUT_MS = 25000;

// ---------- Appels aux IA ----------

async function appelNvidia(userPrompt) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1000,
      chat_template_kwargs: { enable_thinking: false },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function appelGemini(userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ---------- Nettoyage de la réponse ----------

function extraireJSON(texte) {
  const sansBalises = texte.replace(/```json|```/g, "").trim();
  const debut = sansBalises.indexOf("{");
  const fin = sansBalises.lastIndexOf("}");
  if (debut === -1 || fin === -1) throw new Error("Pas de JSON dans la réponse");
  return JSON.parse(sansBalises.slice(debut, fin + 1));
}

function normaliser(r, occasion) {
  const leg = r.legendes || {};
  const templatesValides = ["wax", "sobre", "promo"];
  return {
    description: String(r.description || ""),
    legendes: {
      statut: String(leg.statut || ""),
      facebook: String(leg.facebook || ""),
      story: String(leg.story || ""),
      wolof: String(leg.wolof || ""),
    },
    hashtags:
      Array.isArray(r.hashtags) && r.hashtags.length
        ? r.hashtags.slice(0, 5).map(String)
        : ["#Dakar", "#Senegal", "#JaayKatBi"],
        template:
      occasion && occasion !== "aucune"
        ? "promo"
        : templatesValides.includes(r.template) ? r.template : "wax",
  };
}

// ---------- Route ----------

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const { nom, prix, occasion = "aucune" } = body;
  if (!nom || !String(nom).trim()) {
    return Response.json({ erreur: "Le nom du produit est obligatoire." }, { status: 400 });
  }
  if (!prix || isNaN(Number(prix)) || Number(prix) <= 0) {
    return Response.json({ erreur: "Le prix doit être un nombre positif." }, { status: 400 });
  }
  if (!(occasion in OCCASIONS)) {
    return Response.json({ erreur: "Occasion inconnue." }, { status: 400 });
  }

  const userPrompt = buildUserPrompt(body);

  // 1er essai NVIDIA, puis Gemini si ça échoue
  const fournisseurs = [
    { nom: "nvidia", appel: appelNvidia, dispo: !!process.env.NVIDIA_API_KEY },
    { nom: "gemini", appel: appelGemini, dispo: !!process.env.GEMINI_API_KEY },
  ].filter((f) => f.dispo);

  for (const f of fournisseurs) {
    try {
      const texte = await f.appel(userPrompt);
      const resultat = normaliser(extraireJSON(texte), occasion);
      console.log(`[generer] OK via ${f.nom}`);
      return Response.json(resultat);
    } catch (e) {
      console.error(`[generer] échec ${f.nom}:`, e.message);
    }
  }

  return Response.json(
    { erreur: "La génération a échoué. Réessaie dans quelques secondes." },
    { status: 502 }
  );
}