'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/creer', label: 'Créer' },
  { href: '/produits', label: 'Mes produits' },
];

export default function Navbar() {
  const [ouvert, setOuvert] = useState(false);
  const chemin = usePathname();

  useEffect(() => {
    setOuvert(false);
  }, [chemin]);

  function actif(href) {
    return href === '/' ? chemin === '/' : chemin.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-fonce/5 bg-creme/90 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="menu-principal"
            aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="-ml-2 rounded-xl p-2 text-fonce transition-colors hover:bg-fonce/5 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          <Link
            href="/"
            className="font-titre text-lg font-extrabold tracking-tight text-terre sm:text-xl"
          >
            JAAYKAT
          </Link>
        </div>

        <ul className="hidden items-center gap-1 md:flex">
          {LIENS.map((lien) => (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={actif(lien.href) ? 'page' : undefined}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                  actif(lien.href)
                    ? 'bg-terre/10 text-terre'
                    : 'text-fonce/60 hover:bg-fonce/5 hover:text-fonce',
                ].join(' ')}
              >
                {lien.label}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <Link href="/creer" className="btn-primaire px-5 py-2 text-sm">
              Créer ma pub
            </Link>
          </li>
        </ul>
      </nav>

      {ouvert ? (
        <div
          id="menu-principal"
          className="border-t border-fonce/5 bg-creme px-4 pb-4 pt-2 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LIENS.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  aria-current={actif(lien.href) ? 'page' : undefined}
                  className={[
                    'block rounded-xl px-4 py-3 text-base font-semibold transition-colors',
                    actif(lien.href)
                      ? 'bg-terre/10 text-terre'
                      : 'text-fonce/75 hover:bg-fonce/5',
                  ].join(' ')}
                >
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/creer" className="btn-primaire mt-3 w-full">
            🚀 Créer ma pub
          </Link>
        </div>
      ) : null}
    </header>
  );
}
