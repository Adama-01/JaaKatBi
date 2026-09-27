'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const CLE = 'jaaykat:resultat';

const VISUELS = [
  { id: 'classique', label: 'Classique' },
  { id: 'statut', label: 'Statut' },
  { id: 'promo', label: 'Promo Fête' },
];

const ONGLETS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'story', label: 'Story' },
  { id: 'wolof', label: 'Wolof' },
];

function separerPrix(prix) {
  if (!prix) return '';
  return String(prix).replace(/\s*FCFA/i, '').trim();
}

function identifiant(nom, prix) {
  const base = String(nom ?? "pub")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base}-${prix ?? ""}-${Date.now().toString(36)}`;
}

export default function ResultatPage() {
  const [donnees, setDonnees] = useState(null);
  const [charge, setCharge] = useState(true);
  const [visuel, setVisuel] = useState('classique');
  const [onglet, setOnglet] = useState('whatsapp');
  const [copie, setCopie] = useState('');
  const [miniId, setMiniId] = useState('');

  useEffect(() => {
    const brut = sessionStorage.getItem(CLE);
    if (brut) {
      try {
        const parsed = JSON.parse(brut);
        setDonnees(parsed);
        const id = identifiant(parsed.produit?.nom, parsed.produit?.prix);
        sessionStorage.setItem(
          `jaaykat:pub:${id}`,
          JSON.stringify({
            id,
            nom: parsed.produit?.nom ?? 'Produit',
            prix: parsed.produit?.prix ?? '',
            description: parsed.description ?? '',
            legendes: parsed.legendes ?? {},
            hashtags: parsed.hashtags ?? [],
            vendeur: {
              nom: parsed.produit?.vendeur || 'Aminata Diop',
              whatsapp: (parsed.produit?.whatsapp || '221771234567').replace(/[^\d]/g, ''),
              localisation: parsed.produit?.localisation || 'Dakar, Sandaga',
            },
          })
        );
        setMiniId(id);
      } catch {
        setDonnees(null);
      }
    }
    setCharge(false);
  }, []);

  const contenu = useMemo(() => {
    if (!donnees) return { titre: '', corps: '', hashtags: [] };
    const { description = '', legendes = {}, hashtags = [] } = donnees;
    const prix = donnees.produit?.prix;

    switch (onglet) {
      case 'facebook':
        return {
          titre: legendes.statut || '',
          corps: [description, legendes.facebook, prix ? `${prix} FCFA` : '']
            .filter(Boolean)
            .join('\n\n'),
          hashtags,
        };
      case 'story':
        return {
          titre: legendes.statut || '',
          corps: [legendes.story, prix ? `${prix} FCFA` : ''].filter(Boolean).join('\n\n'),
          hashtags: hashtags.slice(0, 2),
        };
      case 'wolof':
        return {
          titre: legendes.statut || '',
          corps: [legendes.wolof, description].filter(Boolean).join('\n\n'),
          hashtags: hashtags.slice(0, 2),
        };
      default:
        return {
          titre: legendes.statut || '',
          corps: [legendes.facebook, description, prix ? `Prix : ${prix} FCFA` : '']
            .filter(Boolean)
            .join('\n\n'),
          hashtags,
        };
    }
  }, [donnees, onglet]);

  async function copierTexte() {
    const texte = [contenu.titre, contenu.corps, contenu.hashtags.join(' ')]
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(texte);
      setCopie('Légende copiée !');
    } catch {
      setCopie('Copie impossible sur ce navigateur');
    }
    setTimeout(() => setCopie(''), 2500);
  }

  function partagerWhatsapp() {
    const message = encodeURIComponent(
      [contenu.titre, contenu.corps, contenu.hashtags.join(' ')].filter(Boolean).join('\n\n')
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  if (charge) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-terre/20 border-t-terre" />
      </main>
    );
  }

  if (!donnees) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-titre text-2xl font-bold">Aucune pub à afficher</h1>
        <p className="text-sm text-fonce/60">
          Le résultat n'est plus disponible. Générez une nouvelle publication.
        </p>
        <Link href="/creer" className="btn-primaire">
          🚀 CRÉER MA PUB
        </Link>
      </main>
    );
  }

  const prix = separerPrix(donnees.produit?.prix);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center justify-end gap-4">
        <span className="text-xs font-medium text-fonce/60 sm:text-sm">Votre publication</span>
      </header>

      <h1 className="mt-8 text-center font-titre text-2xl font-extrabold sm:text-3xl">
        ✅ Prêt à partager !
      </h1>

      <section aria-label="Choix du visuel" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {VISUELS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVisuel(v.id)}
              aria-pressed={visuel === v.id}
              className={[
                'rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                visuel === v.id
                  ? 'border-terre bg-terre/10 text-terre'
                  : 'border-fonce/10 bg-white text-fonce/70 hover:bg-gray-50',
              ].join(' ')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      <section className="carte mt-6 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {contenu.titre ? (
              <span className="inline-block rounded-full bg-terre/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-terre">
                {contenu.titre}
              </span>
            ) : null}
            <h2 className="mt-3 font-titre text-xl font-bold leading-snug sm:text-2xl">
              {donnees.produit?.nom || 'Votre produit'}
            </h2>
          </div>
          {prix ? (
            <p className="shrink-0 font-titre text-2xl font-extrabold text-prix sm:text-3xl">
              {prix} <span className="text-base font-semibold">FCFA</span>
            </p>
          ) : null}
        </div>

        <div
          className={[
            'mt-5 flex overflow-hidden rounded-2xl',
            visuel === 'classique'
              ? 'border border-fonce/10'
              : visuel === 'statut'
                ? 'bg-gradient-to-br from-terre via-sahel to-baobab p-6'
                : 'bg-gradient-to-br from-prix via-terre to-sahel p-6',
          ].join(' ')}
        >
          <div
            className={[
              'w-full',
              visuel === 'classique' ? '' : 'rounded-xl bg-white/10 p-4 text-white backdrop-blur-sm',
            ].join(' ')}
          >
            <p
              className={[
                'whitespace-pre-line text-sm leading-relaxed',
                visuel === 'classique' ? 'text-fonce/80' : 'text-white/95',
              ].join(' ')}
            >
              {contenu.corps}
            </p>
            {contenu.hashtags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {contenu.hashtags.map((h) => (
                  <span
                    key={h}
                    className={[
                      'rounded-lg px-2 py-0.5 text-xs font-semibold',
                      visuel === 'classique'
                        ? 'bg-sahel/15 text-baobab'
                        : 'bg-white/25 text-white',
                    ].join(' ')}
                  >
                    {h}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-label="Canal de publication" className="mt-6">
        <div
          role="tablist"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={onglet === o.id}
              onClick={() => setOnglet(o.id)}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                onglet === o.id
                  ? 'bg-fonce text-white'
                  : 'bg-white text-fonce/60 hover:bg-gray-50',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={partagerWhatsapp} className="btn-primaire flex-1">
          🟢 Partager sur WhatsApp
        </button>
        <button type="button" onClick={copierTexte} className="btn-secondaire flex-1">
          📋 Copier la légende
        </button>
        <Link href={miniId ? `/p/${miniId}` : '/'} className="btn-secondaire flex-1">
          🌐 Mini-page
        </Link>
      </section>

      {copie ? (
        <p role="status" className="mt-3 text-center text-sm font-medium text-baobab">
          {copie}
        </p>
      ) : null}

      <div className="mt-8 border-t border-fonce/10 pt-6 text-center">
        <Link href="/creer" className="btn-primaire w-full sm:w-auto sm:px-10">
          ↻ Nouvelle pub
        </Link>
      </div>
    </main>
  );
}
