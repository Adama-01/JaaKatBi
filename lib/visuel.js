// lib/visuel.js — compose le visuel "pub pro" à partir de la photo brute.
// Tout se fait en canvas, côté navigateur : aucune image externe.

export const TAILLES = {
  feed: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

function charger(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo illisible."));
    img.src = dataUrl;
  });
}

function arrondir(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function prixFormate(prix) {
  if (!prix) return '';
  const chiffres = String(prix).replace(/\D/g, '');
  if (!chiffres) return '';
  return `${Number(chiffres).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;
}

// Coupe l'image pour qu'elle remplisse exactement w x h (mode cover).
function dessinerCouvrant(ctx, img, x, y, w, h) {
  const ratio = Math.max(w / img.width, h / img.height);
  const largeur = img.width * ratio;
  const hauteur = img.height * ratio;
  ctx.drawImage(img, x + (w - largeur) / 2, y + (h - hauteur) / 2, largeur, hauteur);
}

function degrade(ctx, x0, y0, x1, y1, couleurs) {
  const d = ctx.createLinearGradient(x0, y0, x1, y1);
  couleurs.forEach((c, i) => d.addColorStop(i / (couleurs.length - 1), c));
  return d;
}

function fondDeRepli(ctx, w, h) {
  ctx.fillStyle = degrade(ctx, 0, 0, w, h, ['#D95C20', '#1E3A8A', '#2E8B57']);
  ctx.fillRect(0, 0, w, h);
}

function pastille(ctx, texte, x, y) {
  ctx.font = '600 32px Inter, sans-serif';
  const largeur = ctx.measureText(texte.toUpperCase()).width + 56;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  arrondir(ctx, x, y, largeur, 60, 30);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(texte.toUpperCase(), x + 28, y + 40);
  return largeur;
}

function bandeauBas(ctx, w, h, hauteur, info) {
  const haut = h - hauteur;
  ctx.fillStyle = degrade(ctx, 0, haut, 0, hauteur, [
    'rgba(0,0,0,0)',
    'rgba(45,45,45,0.88)',
  ]);
  ctx.fillRect(0, haut, w, hauteur);

  const x = 70;
  let y = haut + 90;

  if (info.badge) {
    pastille(ctx, info.badge, x, y - 60);
    y += 60;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 62px Montserrat, sans-serif';
  ctx.fillText(info.nom, x, y + 40);

  if (info.prix) {
    ctx.fillStyle = '#F2B807';
    ctx.font = '800 52px Montserrat, sans-serif';
    ctx.fillText(info.prix, x, y + 120);
  }
}

// ---------------- Modèles ----------------

function visuelClassique(ctx, w, h, img, info) {
  const hauteurBandeau = 440;
  const hauteurPhoto = h - hauteurBandeau;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, hauteurPhoto);
    ctx.clip();
    dessinerCouvrant(ctx, img, 0, 0, w, hauteurPhoto);
    ctx.restore();
  } else {
    ctx.fillStyle = degrade(ctx, 0, 0, w, hauteurPhoto, ['#D95C20', '#F2B807']);
    ctx.fillRect(0, 0, w, hauteurPhoto);
  }

  const x = 70;
  const y = hauteurPhoto + 130;
  ctx.fillStyle = '#2D2D2D';
  ctx.font = '800 64px Montserrat, sans-serif';
  ctx.fillText(info.nom, x, y);

  if (info.prix) {
    ctx.fillStyle = '#C0392B';
    ctx.font = '800 58px Montserrat, sans-serif';
    ctx.fillText(info.prix, x, y + 100);
  }

  ctx.fillStyle = 'rgba(45,45,45,0.45)';
  ctx.font = '500 28px Inter, sans-serif';
  ctx.fillText('JAAYKAT', x, h - 48);
}

function visuelStatut(ctx, w, h, img, info) {
  fondDeRepli(ctx, w, h);

  if (img) {
    ctx.save();
    ctx.globalAlpha = 0.96;
    dessinerCouvrant(ctx, img, 0, 0, w, h);
    ctx.restore();
  }

  bandeauBas(ctx, w, h, Math.round(h * 0.42), info);
}

function visuelPromo(ctx, w, h, img, info) {
  fondDeRepli(ctx, w, h);

  const marge = 76;
  const hautCarte = 96;
  const hauteurCarte = h - 400;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF';
  arrondir(ctx, marge, hautCarte, w - marge * 2, hauteurCarte, 44);
  ctx.fill();
  ctx.restore();

  if (img) {
    ctx.save();
    arrondir(ctx, marge, hautCarte, w - marge * 2, hauteurCarte, 44);
    ctx.clip();
    dessinerCouvrant(ctx, img, marge, hautCarte, w - marge * 2, hauteurCarte - 240);
    ctx.restore();
  }

  const x = marge + 48;
  let y = hautCarte + hauteurCarte - 180;

  if (info.badge) {
    ctx.fillStyle = '#C0392B';
    ctx.font = '700 30px Inter, sans-serif';
    ctx.fillText(info.badge.toUpperCase(), x, y - 70);
  }

  ctx.fillStyle = '#2D2D2D';
  ctx.font = '800 54px Montserrat, sans-serif';
  ctx.fillText(info.nom, x, y);

  if (info.prix) {
    ctx.fillStyle = '#C0392B';
    ctx.font = '800 50px Montserrat, sans-serif';
    ctx.fillText(info.prix, x, y + 80);
  }
}

const MODELES = {
  classique: visuelClassique,
  statut: visuelStatut,
  promo: visuelPromo,
};

export const VISUELS = [
  { id: 'classique', label: 'Classique' },
  { id: 'statut', label: 'Statut' },
  { id: 'promo', label: 'Promo Fête' },
];

/**
 * Compose le visuel et renvoie un data URL JPEG.
 * @param {object} options
 * @param {string|null} options.photo   data URL de la photo brute
 * @param {string} options.nom
 * @param {string} options.prix
 * @param {string} options.badge
 * @param {'classique'|'statut'|'promo'} options.visuel
 * @param {'feed'|'story'} options.format
 */
export async function composerPub(options = {}) {
  const {
    photo = null,
    nom = '',
    prix = '',
    badge = '',
    visuel = 'classique',
    format = 'feed',
  } = options;

  const { w, h } = TAILLES[format] || TAILLES.feed;

  const info = {
    nom: nom || 'Votre produit',
    prix: prixFormate(prix),
    badge,
  };

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  let img = null;
  if (photo) {
    try {
      img = await charger(photo);
    } catch {
      img = null;
    }
  }

  (MODELES[visuel] || visuelClassique)(ctx, w, h, img, info);

  return canvas.toDataURL('image/jpeg', 0.9);
}
