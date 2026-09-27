// lib/api.js — fonctions pour que le frontend appelle le backend
// À utiliser dans les composants "use client" (Créer, Résultat).

async function appeler(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.erreur || "Une erreur est survenue. Réessayez.");
    err.statut = res.status;
    throw err;
  }
  return data;
}

// 1. Générer description + légendes
// infos = { nom, prix, whatsapp, description, occasion }
export function genererPub(infos) {
  return appeler("/api/generer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(infos),
  });
}

// 2. Enregistrer le produit (+ photo en data URL) → renvoie { id, photo_url }
export function enregistrerProduit(produit) {
  return appeler("/api/produits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(produit),
  });
}

// 3. Transcrire un message vocal (Blob audio) → renvoie { texte }
export function transcrireAudio(blobAudio) {
  const form = new FormData();
  form.append("audio", blobAudio, "vocal.webm");
  return appeler("/api/transcrire", { method: "POST", body: form });
}

// 4. Réduire une image (File, Blob ou data URL) à 1080 px max → data URL
export function reduireImage(source, max = 1080, type = "image/png") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(type, 0.85));
    };
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = typeof source === "string" ? source : URL.createObjectURL(source);
  });
}

// 5. Lien WhatsApp pour partager un texte (+ lien de la page produit)
export function lienWhatsApp(texte, idProduit) {
  const page = idProduit ? `\n${window.location.origin}/p/${idProduit}` : "";
  return `https://wa.me/?text=${encodeURIComponent(texte + page)}`;
}

// 6. Lien "Commander sur WhatsApp" pour la page produit
// numero = "770000000" (Sénégal) → wa.me/221770000000
export function lienCommande(numero, nomProduit) {
  const propre = String(numero || "").replace(/\D/g, "");
  const complet = propre.startsWith("221") ? propre : `221${propre}`;
  const message = `Bonjour, je veux commander : ${nomProduit}`;
  return `https://wa.me/${complet}?text=${encodeURIComponent(message)}`;
}