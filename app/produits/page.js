'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const PREFIXE = 'jaaykat:pub:';

export default function ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    const liste = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const cle = sessionStorage.key(i);
      if (cle && cle.startsWith(PREFIXE)) {
        try {
          liste.push(JSON.parse(sessionStorage.getItem(cle)));
        } catch {
          /* entrée illisible, ignorée */
        }
      }
    }
    liste.sort((a, b) => (b.id ?? '').localeCompare(a.id ?? ''));
    setProduits(liste);
    setCharge(false);
  }, []);

  if (charge) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-terre/20 border-t-terre" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="font-titre text-2xl font-extrabold sm:text-3xl">Mes produits</h1>
        <p className="mt-2 text-sm text-fonce/70">
          Toutes vos publications générées sur cet appareil.
        </p>
      </header>

      {produits.length === 0 ? (
        <div className="carte mt-10 flex flex-col items-center gap-4 p-10 text-center">
          <p className="font-titre text-lg font-bold">Aucun produit pour l'instant</p>
          <p className="text-sm text-fonce/60">
            Générez votre première pub, elle apparaîtra ici automatiquement.
          </p>
          <Link href="/creer" className="btn-primaire mt-1">
            🚀 Créer ma pub
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => {
            const prix = String(p.prix ?? '').replace(/\s*FCFA/i, '').trim();
            return (
              <li key={p.id} className="carte overflow-hidden">
                <Link href={`/p/${p.id}`} className="block">
                  <div className="h-24 w-full bg-gradient-to-br from-terre via-sahel to-baobab" />
                  <div className="p-5">
                    <h2 className="font-titre text-lg font-bold leading-snug">{p.nom}</h2>
                    {prix ? (
                      <p className="mt-1 font-titre text-xl font-extrabold text-prix">
                        {prix} <span className="text-sm font-semibold">FCFA</span>
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-sm text-fonce/60">{p.description}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="btn-secondaire">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
