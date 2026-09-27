import Link from 'next/link';

const FETES = [
  {
    cle: 'fin-du-mois',
    nom: 'Fin du mois',
    accroche: 'Les salaires tombent',
    texte:
      "Les clients depensaient en fin de mois. Publiez avant le 27 pour etre dans leurs researches du moment.",
    couleurs: ['#D95C20', '#F2B807'],
  },
  {
    cle: 'black-friday',
    nom: 'Black Friday',
    accroche: 'Tout doit partir',
    texte:
      "Prix barre, stock limite, urgence. Des visuels qui donnent envie de acheter tout de suite.",
    couleurs: ['#1E3A8A', '#2D2D2D'],
  },
  {
    cle: 'fetes-fin-annee',
    nom: 'Fêtes fin d\'année',
    accroche: 'Cadeaux et festions',
    texte:
      "Tenues de fete, cadeaux, coffrets. Le moment ou tout le monde cherche quoi offrir.",
    couleurs: ['#C0392B', '#D4A574'],
  },
  {
    cle: 'korite-tabaski',
    nom: 'Korité & Tabaski',
    accroche: 'Le pic de l\'année',
    texte:
      "Nouvel habit, pagne wax, maftah et keccak. Les deux plus grandes ventes de l'annee, une pub par jour.",
    couleurs: ['#2E8B57', '#D95C20'],
  },
];

const ETAPES = [
  {
    titre: 'Decrivez votre produit',
    texte: "Nom, prix, une photo. Trois champs suffisent, pas besoin de savoir ecrire une pub.",
  },
  {
    titre: 'Jaaykat genere la pub',
    texte: 'Visuels, legendes en francais et en wolof, hashtags : tout est produit automatiquement.',
  },
  {
    titre: 'Partagez sur WhatsApp',
    texte: 'Un clic vers WhatsApp, Facebook ou Instagram. Votre cliente voit, elle achete.',
  },
];

function Cadre({ variante }) {
  const avant = variante === 'avant';
  return (
    <div
      className={[
        'relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl',
        avant
          ? 'border border-fonce/10 bg-gray-100'
          : 'bg-gradient-to-br from-terre via-sahel to-baobab',
      ].join(' ')}
    >
      {avant ? (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="m3 16 5-4 4 3 3-2 6 4" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wider">Photo brute</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 text-center text-white">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-white/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
              Offre du jour
            </span>
            <span className="rounded-full bg-fonce/30 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
              -30%
            </span>
          </div>
          <span className="font-titre text-xl font-bold leading-tight sm:text-2xl">
            Votre produit
          </span>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-fonce">
            12 500 FCFA
          </span>
        </div>
      )}
    </div>
  );
}

export default function Accueil() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-titre text-xl font-extrabold tracking-tight text-terre sm:text-2xl"
        >
          JAAYKAT
        </Link>
        <Link href="/produits" className="btn-secondaire px-4 py-2 text-sm">
          Mes produits
        </Link>
      </header>

      <section className="mt-10 text-center sm:mt-16">
        <h1 className="mx-auto max-w-3xl font-titre text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
          Transforme n'importe quelle photo en <span className="text-terre">pub pro</span> en 30
          secondes
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-fonce/70 sm:text-base">
          Publiez sur WhatsApp, Facebook et Instagram avec des visuels vendeurs et des legendes
          en francais et en wolof. Fini les heures passees devant Canva.
        </p>

        <div className="mt-8 grid grid-cols-1 items-center gap-5 text-left sm:mt-12 sm:gap-8 lg:grid-cols-2">
          <figure className="carte p-4 sm:p-5">
            <Cadre variante="avant" />
            <figcaption className="mt-4 text-center text-sm font-medium text-fonce/60">
              Votre photo, telle quelle
            </figcaption>
          </figure>
          <figure className="carte p-4 sm:p-5">
            <Cadre variante="apres" />
            <figcaption className="mt-4 text-center text-sm font-medium text-fonce/60">
              Une pub prete a publier
            </figcaption>
          </figure>
        </div>

        <div className="mt-10">
          <Link href="/creer" className="btn-primaire px-8 py-4 text-base sm:text-lg">
            Créer ma pub
          </Link>
        </div>
      </section>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-center font-titre text-2xl font-bold sm:text-3xl">
          Jaaykat pour chaque occasion
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-fonce/60">
          Choisissez une occasion, le visuel et les legendes s&apos;adaptent automatiquement.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2">
          {FETES.map((fete) => (
            <Link
              key={fete.cle}
              href={`/creer?occasion=${fete.cle}`}
              className="carte group overflow-hidden transition-transform duration-200 hover:-translate-y-1"
            >
              <div
                className="h-20 w-full"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${fete.couleurs[0]}, ${fete.couleurs[1]})`,
                }}
              />
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-titre text-lg font-bold">{fete.nom}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-terre">
                    {fete.accroche}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fonce/70">{fete.texte}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-terre group-hover:underline">
                  Generer cette pub →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-center font-titre text-2xl font-bold sm:text-3xl">
          Comment ca marche
        </h2>

        <ol className="mt-8 space-y-4 sm:mt-10 sm:space-y-5">
          {ETAPES.map((etape, i) => (
            <li key={etape.titre} className="carte flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-titre text-base font-extrabold text-white sm:h-12 sm:w-12 sm:text-lg"
                style={{ backgroundImage: 'linear-gradient(135deg, #D95C20, #C0392B)' }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-titre text-base font-bold sm:text-lg">{etape.titre}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fonce/70">{etape.texte}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Link href="/creer" className="btn-primaire px-8 py-4 text-base">
            🚀 Créer ma pub
          </Link>
        </div>
      </section>

      <footer className="mt-16 border-t border-fonce/10 pt-6 text-center text-xs text-fonce/50 sm:mt-20">
        JAAYKAT — Vends plus simplement
      </footer>
    </main>
  );
}
