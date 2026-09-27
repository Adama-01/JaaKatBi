'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

const DEMO = {
  id: 'demo',
  nom: 'Robe wax Adja',
  prix: '12500',
  description:
    "Robe en wax Adja 100% coton, coupe droite et doublure en mousseline. Livree avec son foulard assorti, elle passe du marche auxelope soir sans retouche. Entretien facile, tissu resistant a la couleur.",
  vendeur: {
    nom: 'Aminata Diop',
    whatsapp: '221771234567',
    localisation: 'Dakar, Sandaga',
  },
  legendes: { statut: 'Bestseller' },
  hashtags: ['#Jaaykat', '#Dakar', '#WaxStyle'],
};

function lire(id) {
  if (typeof window === 'undefined') return null;
  try {
    const brut = window.sessionStorage.getItem(`jaaykat:pub:${id}`);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

export default function MiniPage({ params }) {
  const { id } = use(params);
  const [pub, setPub] = useState(null);
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    setPub(lire(id) ?? { ...DEMO, id });
    setCharge(false);
  }, [id]);

  if (charge) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-terre/20 border-t-terre" />
      </main>
    );
  }

  const prix = String(pub.prix ?? '').replace(/\s*FCFA/i, '').trim();
  const initiales = (pub.vendeur?.nom || 'J K')
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');

  const message = encodeURIComponent(
    [
      `Bonjour ${pub.vendeur?.nom ?? ''}, je veux commander : ${pub.nom}`,
      prix ? `Prix : ${prix} FCFA` : '',
      pub.description,
    ]
      .filter(Boolean)
      .join('\n\n')
  );

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <span className="font-titre text-xl font-extrabold tracking-tight text-terre sm:text-2xl">
          JAAYKAT
        </span>
        <p className="mt-1 text-xs font-medium uppercase tracking-widest text-fonce/40">
          Mini-page produit
        </p>
      </div>
      <article className="carte mt-8 overflow-hidden">
        <div className="h-32 w-full bg-gradient-to-br from-terre via-sahel to-baobab sm:h-40" />

        <div className="p-5 sm:p-7">
          {pub.legendes?.statut ? (
            <span className="inline-block rounded-full bg-terre/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-terre">
              {pub.legendes.statut}
            </span>
          ) : null}

          <h1 className="mt-3 font-titre text-2xl font-extrabold leading-tight sm:text-3xl">
            {pub.nom}
          </h1>

          {prix ? (
            <p className="mt-2 font-titre text-3xl font-extrabold text-prix sm:text-4xl">
              {prix} <span className="text-lg font-semibold">FCFA</span>
            </p>
          ) : null}

          {pub.description ? (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-fonce/80">
              {pub.description}
            </p>
          ) : null}

          {pub.hashtags?.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {pub.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-lg bg-sahel/15 px-2 py-0.5 text-xs font-semibold text-baobab"
                >
                  {h}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      <section className="carte mt-6 p-5 sm:p-6">
        <h2 className="font-titre text-sm font-bold uppercase tracking-wide text-fonce/50">
          Vendeur
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-titre text-lg font-bold text-white"
            style={{ backgroundImage: 'linear-gradient(135deg, #E07040, #C0392B)' }}
            aria-hidden="true"
          >
            {initiales || 'JK'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-titre text-base font-bold">{pub.vendeur?.nom}</p>
            <p className="truncate text-sm text-fonce/60">
              {pub.vendeur?.whatsapp}
              {pub.vendeur?.localisation ? ` — ${pub.vendeur.localisation}` : ''}
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/${pub.vendeur?.whatsapp ?? ''}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primaire mt-5 w-full py-4 text-base"
        >
          🛒 COMMANDER SUR WHATSAPP
        </a>
      </section>

      <footer className="mt-10 text-center text-xs text-fonce/50">
        <p>Partagé depuis Jaaykat</p>
        <Link href="/" className="mt-2 inline-block font-semibold text-terre hover:underline">
          Créer ma pub gratuitement
        </Link>
      </footer>
    </main>
  );
}
