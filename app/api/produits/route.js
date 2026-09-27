// app/api/produits/route.js — enregistre un produit (+ photo) dans Supabase

import { getSupabase, uploaderPhoto } from "@/lib/supabase";
import { OCCASIONS } from "@/lib/prompts";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const {
    nom,
    prix,
    whatsapp = "",
    description = "",
    occasion = "aucune",
    legendes = {},
    hashtags = [],
    template = "wax",
    photo, // data URL base64 de la photo détourée (facultatif)
  } = body;

  if (!nom || !String(nom).trim()) {
    return Response.json({ erreur: "Le nom du produit est obligatoire." }, { status: 400 });
  }
  if (!prix || isNaN(Number(prix)) || Number(prix) <= 0) {
    return Response.json({ erreur: "Le prix doit être un nombre positif." }, { status: 400 });
  }
  if (!(occasion in OCCASIONS)) {
    return Response.json({ erreur: "Occasion inconnue." }, { status: 400 });
  }

  try {
    const photo_url = photo ? await uploaderPhoto(photo) : null;

    const { data, error } = await getSupabase()
      .from("produits")
      .insert({
        nom: String(nom).trim(),
        prix: Math.round(Number(prix)),
        whatsapp: String(whatsapp).replace(/\s+/g, ""),
        description: String(description),
        occasion,
        legendes,
        hashtags: Array.isArray(hashtags) ? hashtags.map(String) : [],
        template: ["wax", "sobre", "promo"].includes(template) ? template : "wax",
        photo_url,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return Response.json({ id: data.id, photo_url });
  } catch (e) {
    console.error("[produits]", e.message);
    return Response.json(
      { erreur: e.message.startsWith("Photo") || e.message.startsWith("Format")
          ? e.message
          : "Impossible d'enregistrer le produit. Réessaie." },
      { status: 500 }
    );
  }
}