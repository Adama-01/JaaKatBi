'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import genererPubMock from '@/lib/mock';

const OCCASIONS = [
  { valeur: '', label: 'Aucune' },
  { valeur: 'fin-du-mois', label: 'Fin du mois' },
  { valeur: 'black-friday', label: 'Black Friday' },
  { valeur: 'fetes-fin-annee', label: 'Fêtes fin d\'année' },
  { valeur: 'korite-tabaski', label: 'Korité & Tabaski' },
  { valeur: 'korite', label: 'Korité' },
  { valeur: 'tabaski', label: 'Tabaski' },
  { valeur: 'magal', label: 'Magal Touba' },
  { valeur: 'promo', label: 'Promotion' },
];

const ETAPES = [
  'Analyse du produit',
  'Choix du modèle',
  'Rédaction des légendes',
  'Génération des hashtags',
];

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
  const [photo, setPhoto] = useState(null);
  const [ecoute, setEcoute] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const fichierRef = useRef(null);
  const reconnaissanceRef = useRef(null);
  const baseDescription = useRef('');

  useEffect(() => {
    setChamps((c) => (c.occasion === occasionValide ? c : { ...c, occasion: occasionValide }));
  }, [occasionValide]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
      reconnaissanceRef.current?.abort?.();
    };
  }, [photo]);

  function maj(champ, valeur) {
    setChamps((c) => ({ ...c, [champ]: valeur }));
    if (erreur) setErreur('');
  }

  function choisirPhoto(e) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setPhoto((ancien) => {
      if (ancien) URL.revokeObjectURL(ancien.url);
      return { nom: fichier.name, taille: fichier.size, url: URL.createObjectURL(fichier) };
    });
  }

  function dicter() {
    if (ecoute) {
      reconnaissanceRef.current?.stop?.();
      return;
    }

    const Reconnaissance =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!Reconnaissance) {
      setErreur('La dictée vocale n\'est pas disponible sur ce navigateur.');
      return;
    }

    const reco = new Reconnaissance();
    reco.lang = 'fr-FR';
    reco.interimResults = false;
    reco.continuous = false;
    baseDescription.current = champs.description;
    reconnaissanceRef.current = reco;

    reco.onresult = (event) => {
      const dit = event.results[0][0].transcript;
      const precedent = baseDescription.current.trim();
      maj('description', precedent ? `${precedent} ${dit}` : dit);
    };
    reco.onerror = () => {
      setErreur('Dictée interrompue. Réessayez ou écrivez votre description.');
      setEcoute(false);
    };
    reco.onend = () => setEcoute(false);

    reco.start();
    setEcoute(true);
  }

  async function soumettre(e) {
    e?.preventDefault?.();
    if (chargement) return;

    setChargement(true);
    setErreur('');

    try {
      // Remplacer par : const r = await fetch('/api/generer', { method: 'POST', ... })
      const resultat = await genererPubMock({
        nomProduit: champs.nomProduit.trim(),
        prixActuel: champs.prix.trim(),
        description: champs.description.trim() || undefined,
        categorie: OCCASIONS.find((o) => o.valeur === champs.occasion)?.label,
      });

      if (resultat?.erreur) {
        setErreur(resultat.erreur);
        setChargement(false);
        return;
      }

      sessionStorage.setItem(
        'jaaykat:resultat',
        JSON.stringify({
          ...resultat,
          produit: {
            nom: champs.nomProduit.trim(),
            prix: champs.prix.trim(),
            description: champs.description.trim(),
            occasion:
              OCCASIONS.find((o) => o.valeur === champs.occasion)?.label ?? '',
            whatsapp: champs.whatsapp.trim(),
            photo: photo?.url ?? null,
          },
        })
      );
      router.push('/resultat');
    } catch (err) {
      setErreur(err?.message || 'Une erreur est survenue. Reessayez.');
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
          Préparation de vos visuels et légendes. Comptez 6 secondes.
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
                  style={{ backgroundImage: `url(${photo.url})` }}
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
            ref={fichierRef}
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
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity',
                  ecoute ? 'animate-pulse bg-prix' : 'bg-sahel hover:opacity-90',
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
                {ecoute ? 'J\'écoute…' : 'Dictée vocale'}
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
