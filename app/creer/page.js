'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import genererPubMock from '@/lib/mock';
import { genererPub, reduireImage, transcrireAudio } from '@/lib/api';

// Les valeurs doivent correspondre à OCCASIONS de lib/prompts.js (côté API).
const OCCASIONS = [
  { valeur: 'aucune', label: 'Aucune' },
  { valeur: 'fin_du_mois', label: 'Fin du mois' },
  { valeur: 'black_friday', label: 'Black Friday' },
  { valeur: 'fin_annee', label: "Fêtes fin d'année" },
  { valeur: 'korite', label: 'Korité' },
  { valeur: 'tabaski', label: 'Tabaski' },
];

// Valeurs attendues par le backend (/api/generer)
const OCCASION_BACKEND = {
  '': 'aucune',
  'fin-du-mois': 'fin_du_mois',
  'black-friday': 'black_friday',
  'fetes-fin-annee': 'fin_annee',
  'korite-tabaski': 'tabaski',
  korite: 'korite',
  tabaski: 'tabaski',
  magal: 'aucune',
  promo: 'aucune',
};

const ETAPES = [
  'Analyse du produit',
  'Choix du modèle',
  'Rédaction des légendes',
  'Génération des hashtags',
];

// Repli sur la reconnaissance vocale du navigateur quand le GPU ne répond pas.
// L'audio n'est jamais envoyé : seul le texte transcrit est conservé.
function dicterLocalement(morceaux, typeAudio, appliquer) {
  const Reconnaissance =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  if (!Reconnaissance || !morceaux.length) return false;

  try {
    const fichier = new File(morceaux, 'vocal.webm', { type: typeAudio || 'audio/webm' });
    const reco = new Reconnaissance();
    reco.lang = 'fr-FR';
    reco.interimResults = false;
    reco.continuous = false;
    reco.onresult = (event) => {
      const dit = String(event.results[0][0].transcript).trim();
      if (!dit) return;
      appliquer((avant) => (avant ? `${avant} ${dit}` : dit));
    };
    reco.start();
    return true;
  } catch {
    return false;
  }
}

export default function CreerPage() {
  return (
    <Suspense fallback={null}>
      <FormulaireCreation />
    </Suspense>
  );
}

function FormulaireCreation() {
  const router = useRouter();
  const params = useSearchParams();
  const occasionUrl = params.get('occasion') ?? '';
  const occasionValide = OCCASIONS.some((o) => o.valeur === occasionUrl) ? occasionUrl : '';

  const [champs, setChamps] = useState({
    nomProduit: '',
    prix: '',
    whatsapp: '',
    description: '',
    occasion: occasionValide,
  });
  // photo = { nom, taille, url } — url est une data URL (base64) qui survit au changement de page
  const [photo, setPhoto] = useState(null);
  const [ecoute, setEcoute] = useState(false);
  const [transcription, setTranscription] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const fichierRef = useRef(null);
  const enregistreurRef = useRef(null);

  useEffect(() => {
    setChamps((c) => (c.occasion === occasionValide ? c : { ...c, occasion: occasionValide }));
  }, [occasionValide]);

  useEffect(() => {
    return () => {
      if (enregistreurRef.current?.state === 'recording') enregistreurRef.current.stop();
    };
  }, []);

  function maj(champ, valeur) {
    setChamps((c) => ({ ...c, [champ]: valeur }));
    if (erreur) setErreur('');
  }

  async function choisirPhoto(e) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    try {
      // Data URL : survit à la navigation, contrairement à un object URL.
      // Réduite à 800 px, assez légère pour sessionStorage et Supabase.
      const dataUrl = await reduireImage(fichier, 800, 'image/jpeg');
      setPhoto({ nom: fichier.name, taille: Math.round((dataUrl.length * 3) / 4), url: dataUrl });
    } catch {
      setErreur('Impossible de lire cette photo. Essayez une autre image.');
    }
  }

  // Dictée vocale en wolof : le micro enregistre, puis l'audio part vers
  // /api/transcrire (serveur GPU NVIDIA Brev + modèle Whisper wolof)
  async function dicter() {
    if (transcription) return;
    if (ecoute) {
      enregistreurRef.current?.stop();
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErreur('Le micro n\'est pas disponible sur ce navigateur.');
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(flux);
      const morceaux = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) morceaux.push(e.data);
      };
      rec.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        setEcoute(false);
        setTranscription(true);
        try {
          const audio = new Blob(morceaux, { type: rec.mimeType || 'audio/webm' });
          const { texte } = await transcrireAudio(audio);
          const dit = String(texte || '').trim();
          if (dit) {
            setChamps((c) => {
              const avant = c.description.trim();
              return { ...c, description: avant ? `${avant} ${dit}` : dit };
            });
          }
        } catch (err) {
          // Le GPU peut être indisponible (non configuré ou éteint). On tente
          // alors la dictée du navigateur pour ne pas bloquer la saisie.
          const panneServeur = err?.statut === undefined || Number(err?.statut) >= 500;
          const repli = panneServeur
            ? dicterLocalement(morceaux, rec.mimeType, (construire) =>
                setChamps((c) => ({ ...c, description: construire(c.description.trim()) }))
              )
            : false;
          if (!repli) {
            setErreur(err?.message || 'Transcription impossible. Écrivez la description.');
          }
        } finally {
          setTranscription(false);
        }
      };
      enregistreurRef.current = rec;
      rec.start();
      setEcoute(true);
      setErreur('');
      // Arrêt automatique après 30 secondes
      setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, 30000);
    } catch {
      setErreur('Micro refusé. Autorisez le micro ou écrivez la description.');
    }
  }

  async function soumettre(e) {
    e?.preventDefault?.();
    if (chargement) return;

    const nom = champs.nomProduit.trim();
    const prixNombre = Number(champs.prix.replace(/\D/g, ''));
    if (!nom) {
      setErreur('Indiquez le nom du produit.');
      return;
    }
    if (!prixNombre) {
      setErreur('Indiquez un prix en FCFA.');
      return;
    }

    setChargement(true);
    setErreur('');

    let resultat;
    try {
      resultat = await genererPub({
        nom,
        prix: prixNombre,
        whatsapp: champs.whatsapp.trim(),
        description: champs.description.trim(),
        occasion: OCCASION_BACKEND[champs.occasion] ?? 'aucune',
      });
    } catch (err) {
      // Panne IA (clé absente, GPU indisponible, réseau) : on dégrade sur le
      // mock plutôt que d'afficher une erreur. Un 4xx, lui, est une vraie
      // erreur de saisie et doit être remonté.
      const panne = err?.statut === undefined || Number(err?.statut) >= 500;
      if (!panne) {
        setErreur(err?.message || 'Une erreur est survenue. Réessayez.');
        setChargement(false);
        return;
      }
      resultat = await genererPubMock({
        nomProduit: nom,
        prixActuel: String(prixNombre),
        description: champs.description.trim() || undefined,
        categorie: OCCASIONS.find((o) => o.valeur === champs.occasion)?.label,
      });
    }

    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      setChargement(false);
      return;
    }

    try {
      const aSauver = {
        ...resultat,
        produit: {
          nom,
          prix: prixNombre.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' '),
          description: champs.description.trim(),
          occasion: OCCASIONS.find((o) => o.valeur === champs.occasion)?.label ?? '',
          whatsapp: champs.whatsapp.trim(),
          photo: photo?.url ?? null,
        },
      };

      try {
        sessionStorage.setItem('jaaykat:resultat', JSON.stringify(aSauver));
      } catch {
        // Si la photo est trop lourde pour le stockage, on garde au moins les textes
        aSauver.produit.photo = null;
        sessionStorage.setItem('jaaykat:resultat', JSON.stringify(aSauver));
      }
      router.push('/resultat');
    } catch {
      setErreur('Une erreur est survenue. Réessayez.');
      setChargement(false);
    }
  }

  if (chargement) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div
          className="h-16 w-16 animate-spin rounded-full border-4 border-terre/20 border-t-terre"
          aria-hidden="true"
        />
        <h1 className="mt-8 font-titre text-2xl font-bold sm:text-3xl">
          Génération en cours…
        </h1>
        <p className="mt-2 text-sm text-fonce/60">
          Préparation de vos visuels et légendes. Comptez quelques secondes.
        </p>
        <ol className="mt-8 w-full space-y-2 text-left text-sm">
          {ETAPES.map((etape, i) => (
            <li
              key={etape}
              className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-2.5"
              style={{ animation: `etape ${i * 0.6}s ease-in-out infinite alternate` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terre/10 text-[11px] font-bold text-terre">
                {i + 1}
              </span>
              <span className="text-fonce/70">{etape}</span>
            </li>
          ))}
        </ol>
        <style jsx>{`
          @keyframes etape {
            from {
              opacity: 0.4;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-fonce/60 transition-colors hover:text-terre"
      >
        <span aria-hidden="true">←</span> Retour
      </Link>

      <h1 className="mt-4 font-titre text-2xl font-extrabold leading-tight sm:text-3xl">
        Nouveau produit
      </h1>

      <form onSubmit={soumettre} className="mt-6 space-y-5" noValidate>
        <section className="carte p-5 sm:p-6">
          <label
            htmlFor="photo"
            className="block cursor-pointer rounded-2xl border-2 border-dashed border-terre bg-terre/[0.03] p-6 text-center transition-colors hover:bg-terre/[0.07] sm:p-10"
          >
            <span className="sr-only">Ajouter une photo du produit</span>
            {photo ? (
              <>
                <span
                  className="mx-auto block h-40 w-full rounded-xl bg-cover bg-center sm:h-56"
                  style={{ backgroundImage: `url(${photo.dataUrl})` }}
                  aria-hidden="true"
                />
                <span className="mt-4 block truncate text-sm font-semibold text-terre">
                  {photo.nom}
                </span>
                <span className="mt-0.5 block text-xs text-fonce/50">
                  {(photo.taille / 1024).toFixed(0)} Ko — cliquez pour changer
                </span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto h-11 w-11 text-terre"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="m3 16 5-4 4 3 3-2 6 4" />
                </svg>
                <span className="mt-3 block font-titre text-base font-bold text-terre">
                  Ajouter une photo du produit
                </span>
                <span className="mt-1 block text-sm text-fonce/60">
                  JPG ou PNG, une photo nette suffit
                </span>
              </>
            )}
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={choisirPhoto}
          />
        </section>

        <section className="carte space-y-5 p-5 sm:p-6">
          <div>
            <label htmlFor="nomProduit" className="mb-1.5 block text-sm font-semibold">
              Nom
            </label>
            <input
              id="nomProduit"
              name="nomProduit"
              type="text"
              className="champ"
              placeholder="Robe wax Adja taille M"
              value={champs.nomProduit}
              onChange={(e) => maj('nomProduit', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="prix" className="mb-1.5 block text-sm font-semibold">
                Prix
              </label>
              <div className="relative">
                <input
                  id="prix"
                  name="prix"
                  type="text"
                  inputMode="numeric"
                  className="champ pr-16"
                  placeholder="12500"
                  value={champs.prix}
                  onChange={(e) => maj('prix', e.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-fonce/40">
                  FCFA
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                className="champ"
                placeholder="77 123 45 67"
                value={champs.whatsapp}
                onChange={(e) => maj('whatsapp', e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="description" className="block text-sm font-semibold">
                Description
              </label>
              <button
                type="button"
                onClick={dicter}
                aria-pressed={ecoute}
                disabled={transcription}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity',
                  ecoute ? 'animate-pulse bg-prix' : 'bg-sahel hover:opacity-90',
                  transcription ? 'cursor-wait opacity-70' : '',
                ].join(' ')}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                  <path d="M18 11a1 1 0 1 1 2 0 8 8 0 0 1-7 7.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A8 8 0 0 1 4 11a1 1 0 1 1 2 0 6 6 0 0 0 12 0Z" />
                </svg>
                {ecoute
                  ? 'Stop — transcrire'
                  : transcription
                    ? 'Transcription…'
                    : 'Dicter en wolof'}
              </button>
            </div>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="champ resize-y"
              placeholder="Matière, couleurs, taille, point fort…"
              value={champs.description}
              onChange={(e) => maj('description', e.target.value)}
            />
          </div>
        </section>

        <fieldset className="carte p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold">Occasion</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => {
              const actif = champs.occasion === o.valeur;
              return (
                <button
                  key={o.valeur}
                  type="button"
                  onClick={() => maj('occasion', o.valeur)}
                  aria-pressed={actif}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    actif
                      ? 'bg-terre text-white'
                      : 'bg-fonce/[0.05] text-fonce/70 hover:bg-terre/10 hover:text-terre',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {erreur ? (
          <div
            role="alert"
            className="rounded-xl border border-prix/30 bg-prix/10 px-4 py-3 text-sm text-prix"
          >
            <p className="font-semibold">Génération impossible</p>
            <p className="mt-1">{erreur}</p>
            <button
              type="button"
              onClick={soumettre}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-prix px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              ↻ Réessayer
            </button>
          </div>
        ) : null}

        <button type="submit" className="btn-primaire w-full py-4 text-base sm:text-lg">
          Générer ma pub
        </button>
      </form>
    </main>
  );
}