const PRODUITS = [
  {
    nom: 'Robe wax Adja',
    prix: '12500',
    categorie: 'Prêt-à-porter femme',
    description:
      'Robe en wax Adja 100% coton, coupe droite et doublure en mousseline. Livrée avec son foulard assorti, elle passe du marché auxelope soir sans retouche.',
    facebook: 'Livree en 24h partout a Dakar. Commandez maintenant.',
    story: 'Ta robe de samedi est prete. En stock, 12 500 F.',
    wolof: 'Robe bi lay bu bees, tey dem sa bopp bi. Defar bu bees ci DiamniDiamage.',
  },
  {
    nom: 'Chemise lin Sakal',
    prix: '8900',
    categorie: 'Chemises',
    description:
      'Chemise en lin lave, coupe cintree et manches longues roulables. Parfaite pour la chaleur de Dakar, elle tient aussi bien au bureau quen week-end.',
    facebook: 'Coupe impeccable, matiere qui respire. Choisi par plus de 2000 Dakarois.',
    story: 'En lin 100%, classe garantie. 8 900 F, livraison Dakar.',
    wolof: 'Chemise bi ngan lin, doy mu def ci katlan. Clean look bi raf fi.',
  },
  {
    nom: 'Foulard Bassar',
    prix: '4500',
    categorie: 'Accessoires',
    description:
      'Foulard en wax Bassar de 90x90 cm, bordure liee main. Il se porte en turban, en ceinture ou sur le sac, et donne une touche waax a toute la tenue.',
    facebook: 'Le detail qui change toute la tenue. 4 500 F seulement.',
    story: 'Un accessoire, dix tenues differentes. Disponible maintenant.',
    wolof: 'Tay bu Bassar, doy na nga lepp waas. Toubare bi lay teŋ.',
  },
  {
    nom: 'Ensemble HOMME baobab',
    prix: '18900',
    categorie: 'Prêt-à-porter homme',
    description:
      'Ensemble deux pieces en motif baobab : chemise et pantalon, finitions cousues main. Tenue complete pour les grandes occasions comme pour la bureau.',
    facebook: 'Tenue complete, rien a assortir. 18 900 F, livraison offerte sur Dakar.',
    story: 'Le baobab dans toute sa splendeur. Chemise plus pantalon.',
    wolof: 'Sot bi baobab, doy nga bopp. Bu bopp bi lay teŋ ci DiamniDiamage.',
  },
  {
    nom: 'Sac cuir Keur Massar',
    prix: '15900',
    categorie: 'Maroquinerie',
    description:
      'Sac en cuir pleine fleur, bandouliere reglable et poche zippree interieure. Fabrique par un atelier de La Calle, a Dakar.',
    facebook: 'Artisanat dakarois. Il se patine et gagne en caractere avec le temps.',
    story: 'Fabrique a Dakar. Un cuir qui vieillit mieux que vous.',
    wolof: 'Sac bi ci Keur Massar, tey nga nga defe. Mbir bi dund ci La Calle.',
  },
  {
    nom: 'Sandales Birim',
    prix: '7200',
    categorie: 'Chaussures',
    description:
      'Sandales tressees a la main, semelle en caoutchouc naturel. Elles vont a la plage de Yoff comme au marche de Sandaga.',
    facebook: 'Legeres et confortables, 100% fait main. 7 200 F la paire.',
    story: 'Chaussures dete. Votre paire, prete a sortir de la boite.',
    wolof: 'Sandales bi tey teg, taa faw. Digg bu dund bu beccëg.',
  },
  {
    nom: 'Infusion menthe sauvage',
    prix: '3900',
    categorie: 'Bien-etre',
    description:
      'Infusion de menthe sauvage du Sine, 20 sachets par paquet. A boire le soir pour digerer apres un vrai maftah.',
    facebook: 'Le repos du soir, version senegalaise. 3 900 F le paquet.',
    story: 'Apres le maftah, un the a la menthe. Recharge de 20 sachets.',
    wolof: 'Infusion bi law bu mente, tey nga lekk. Mbir birim dey fi ker.',
  },
  {
    nom: 'Beurre de karité brut',
    prix: '5600',
    categorie: 'Beauté',
    description:
      'Beurre de karité non raffine de 250 g, recolte au Ker. Nourrit la peau et les cheveux, sans parfum ni additif.',
    facebook: 'Un seul ingredient. Comme nos grands-mères, comme toujours.',
    story: 'Karité pur, 250 g. Rien dautre dans le pot.',
    wolof: 'Karité bi bopp, doy nga faham. Teg nga mbir tam.',
  },
];

const HASHTAGS_COMMUNS = [
  '#Jaaykat',
  '#Dakar',
  '#ModeAfricaine',
  '#WaxStyle',
  '#ArtisanatLocal',
  '#SewSenegal',
];

const STATUTS = [
  'Bestseller',
  'Nouveau en stock',
  'Promo du moment',
  'Livraison 24h a Dakar',
  'Stock limite',
];

const MODELES = ['wax', 'wax', 'wax', 'minimal', 'couleur'];

function choisir(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

function piocher(liste, nombre) {
  return [...liste].sort(() => Math.random() - 0.5).slice(0, nombre);
}

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashtag(nom) {
  const base = String(nom)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
  return '#' + (base || 'Jaaykat');
}

export default async function genererPubMock(donnees = {}) {
  try {
    const { nomProduit, prixActuel, categorie } = donnees ?? {};

    if ('nomProduit' in donnees && !String(nomProduit ?? '').trim()) {
      throw new Error('Le nom du produit est obligatoire pour generer la publication.');
    }

    await attendre(6000);

    const source = nomProduit
      ? { ...choisir(PRODUITS), nom: String(nomProduit).trim() }
      : choisir(PRODUITS);

    const prix = prixActuel ? `${prixActuel} FCFA` : `${source.prix} FCFA`;
    const categorieFinale = categorie || source.categorie;

    const description = [
      source.description,
      `${categorieFinale}.`,
      `Disponible a ${prix}.`,
      'Livraison a Dakar et partout au Senegal.',
    ].join(' ');

    const hashtags = piocher(HASHTAGS_COMMUNS, 3);
    if (!hashtags.includes(hashtag(source.nom))) hashtags.push(hashtag(source.nom));

    return {
      description,
      legendes: {
        statut: choisir(STATUTS),
        facebook: source.facebook,
        story: source.story,
        wolof: source.wolof,
      },
      hashtags,
      template: choisir(MODELES),
    };
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'Generation impossible. Reessayez.' };
  }
}
