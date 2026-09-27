// lib/supabase.js — connexion Supabase (côté serveur uniquement)
// Ne jamais importer ce fichier dans un composant "use client" :
// il utilise la clé service_role, qui doit rester secrète.

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Envoie une image (data URL base64) dans le bucket "photos" et renvoie son URL publique
export async function uploaderPhoto(dataUrl) {
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!match) throw new Error("Format de photo invalide (PNG, JPEG ou WEBP en base64).");

  const contentType = match[1];
  const extension = match[2] === "jpeg" ? "jpg" : match[2];
  const buffer = Buffer.from(match[3], "base64");

  if (buffer.length > 3 * 1024 * 1024) {
    throw new Error("Photo trop lourde (3 Mo maximum). Réduis-la avant l'envoi.");
  }

  const chemin = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("photos")
    .upload(chemin, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Upload photo : ${error.message}`);

  const { data } = supabase.storage.from("photos").getPublicUrl(chemin);
  return data.publicUrl;
}

// Lit un produit par son id (pour la page /p/[id])
export async function getProduit(id) {
  const { data, error } = await supabase
    .from("produits")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}