// moteurLudo.js
// Moteur de jeu pur pour le Ludo — aucune dépendance à React ou à l'affichage.
// Règles : sortie sur 6 uniquement, 6 redonne un tour, 3 six d'affilée annule le tour,
// captures hors case sécurisée (en tombant exactement sur la case adverse),
// dépassement autorisé pour entrer en zone d'arrivée (pas besoin du compte exact),
// 4 pions/joueur.

export const COULEURS = ['rouge', 'vert', 'jaune', 'bleu']

// Longueur du parcours commun (cases du tour du plateau)
const LONGUEUR_PARCOURS = 52
// Longueur du couloir final (privé à chaque couleur) avant la case d'arrivée
const LONGUEUR_COULOIR = 6

// Position de départ (sur le parcours commun de 52 cases) pour chaque couleur
const DEPART = { rouge: 0, vert: 13, jaune: 26, bleu: 39 }

// Cases sécurisées sur le parcours commun (indices 0-51), classiques Ludo King
const CASES_SECURISEES = new Set([0, 8, 13, 21, 26, 34, 39, 47])

export function creerPartie(couleursActives) {
  // couleursActives: tableau de 2 à 4 couleurs parmi COULEURS, dans l'ordre de jeu
  const pions = {}
  couleursActives.forEach((c) => {
    pions[c] = [0, 1, 2, 3].map(() => ({ etat: 'base', position: -1 }))
    // etat: 'base' | 'parcours' | 'couloir' | 'arrivee'
    // position: -1 si en base, 0-51 si sur le parcours commun (absolu),
    //           0-5 si dans le couloir final, 6 si arrivé
  })

  return {
    couleurs: couleursActives,
    pions,
    tourActuel: 0, // index dans couleursActives
    sixDAffilee: 0,
    dernierDe: null,
    doitRejouer: false,
    vainqueur: null,
    log: [],
  }
}

function couleurCourante(partie) {
  return partie.couleurs[partie.tourActuel]
}

// Calcule les coups valides pour le joueur courant avec la valeur de dé donnée
// Dépassement autorisé : un pion peut toujours avancer, il s'arrête à l'arrivée s'il dépasse.
export function coupsValides(partie, valeurDe) {
  const couleur = couleurCourante(partie)
  const pions = partie.pions[couleur]
  const coups = []

  pions.forEach((pion, index) => {
    if (pion.etat === 'base') {
      if (valeurDe === 6) coups.push({ index, type: 'sortie' })
      return
    }
    if (pion.etat === 'arrivee') return

    if (pion.etat === 'parcours') {
      const distanceParcourue = distanceDepuisDepart(couleur, pion.position)
      const nouvelleDistance = distanceParcourue + valeurDe

      if (nouvelleDistance < LONGUEUR_PARCOURS) {
        coups.push({ index, type: 'avance' })
      } else {
        // Dépassement autorisé : on plafonne à l'arrivée, peu importe le dépassement
        coups.push({ index, type: 'arrivee' })
      }
      return
    }

    if (pion.etat === 'couloir') {
      // Dépassement autorisé dans le couloir aussi : plafonné à l'arrivée
      coups.push({ index, type: 'arrivee' })
    }
  })

  return coups
}

function distanceDepuisDepart(couleur, positionAbsolue) {
  const depart = DEPART[couleur]
  return (positionAbsolue - depart + LONGUEUR_PARCOURS) % LONGUEUR_PARCOURS
}

function positionAbsolueDepuisDistance(couleur, distance) {
  const depart = DEPART[couleur]
  return (depart + distance) % LONGUEUR_PARCOURS
}

// Joue un coup (suppose qu'il a été validé via coupsValides) et retourne le nouvel état
export function jouerCoup(partie, indexPion, valeurDe) {
  const couleur = couleurCourante(partie)
  const pion = partie.pions[couleur][indexPion]
  const nouvellePartie = structuredClone(partie)
  const nouveauPion = nouvellePartie.pions[couleur][indexPion]
  let captureEffectuee = false

  if (pion.etat === 'base') {
    nouveauPion.etat = 'parcours'
    nouveauPion.position = DEPART[couleur]
    captureEffectuee = tenterCapture(nouvellePartie, couleur, nouveauPion.position)
  } else if (pion.etat === 'parcours') {
    const distanceParcourue = distanceDepuisDepart(couleur, pion.position)
    const nouvelleDistance = distanceParcourue + valeurDe

    if (nouvelleDistance < LONGUEUR_PARCOURS) {
      nouveauPion.position = positionAbsolueDepuisDistance(couleur, nouvelleDistance)
      captureEffectuee = tenterCapture(nouvellePartie, couleur, nouveauPion.position)
    } else {
      // Dépassement autorisé : qu'il tombe pile ou dépasse, il arrive
      nouveauPion.etat = 'arrivee'
      nouveauPion.position = LONGUEUR_COULOIR
    }
  } else if (pion.etat === 'couloir') {
    // Dépassement autorisé : qu'il tombe pile ou dépasse, il arrive
    nouveauPion.etat = 'arrivee'
    nouveauPion.position = LONGUEUR_COULOIR
  }

  // Vérifier victoire (les 4 pions arrivés)
  const tousArrives = nouvellePartie.pions[couleur].every((p) => p.etat === 'arrivee')
  if (tousArrives) {
    nouvellePartie.vainqueur = couleur
  }

  // Gestion du tour supplémentaire (6 ou capture)
  const rejoue = valeurDe === 6 || captureEffectuee
  nouvellePartie.doitRejouer = rejoue && !nouvellePartie.vainqueur

  nouvellePartie.log.push({ couleur, indexPion, valeurDe, captureEffectuee })

  return nouvellePartie
}

// Capture : si un pion adverse est EXACTEMENT sur la case d'arrivée du déplacement
// (hors case sécurisée), il retourne en base. Sauter par-dessus ne capture pas —
// il faut tomber pile sur sa case.
function tenterCapture(partie, couleurJoueur, positionAbsolue) {
  if (CASES_SECURISEES.has(positionAbsolue)) return false

  let captureEffectuee = false
  partie.couleurs.forEach((autreCouleur) => {
    if (autreCouleur === couleurJoueur) return
    partie.pions[autreCouleur].forEach((p) => {
      if (p.etat === 'parcours' && p.position === positionAbsolue) {
        p.etat = 'base'
        p.position = -1
        captureEffectuee = true
      }
    })
  })
  return captureEffectuee
}

// Lance le dé et gère la règle des 3 six d'affilée (tour annulé)
export function lancerDe(partie) {
  const valeur = Math.floor(Math.random() * 6) + 1
  const nouvellePartie = structuredClone(partie)
  nouvellePartie.dernierDe = valeur

  if (valeur === 6) {
    nouvellePartie.sixDAffilee += 1
    if (nouvellePartie.sixDAffilee === 3) {
      // 3 six d'affilée : tour annulé immédiatement
      nouvellePartie.sixDAffilee = 0
      nouvellePartie.doitRejouer = false
      return { partie: passerAuJoueurSuivant(nouvellePartie), valeur, tourAnnule: true }
    }
  } else {
    nouvellePartie.sixDAffilee = 0
  }

  const coups = coupsValides(nouvellePartie, valeur)
  if (coups.length === 0) {
    // Aucun coup possible (tous les pions en base et pas de 6) : passe au joueur suivant
    return { partie: passerAuJoueurSuivant(nouvellePartie), valeur, aucunCoup: true }
  }

  return { partie: nouvellePartie, valeur, coups }
}

export function passerAuJoueurSuivant(partie) {
  const nouvellePartie = structuredClone(partie)
  nouvellePartie.tourActuel = (partie.tourActuel + 1) % partie.couleurs.length
  nouvellePartie.doitRejouer = false
  nouvellePartie.sixDAffilee = 0
  nouvellePartie.dernierDe = null
  return nouvellePartie
}

export function estCaseSecurisee(positionAbsolue) {
  return CASES_SECURISEES.has(positionAbsolue)
}

export { DEPART, CASES_SECURISEES, LONGUEUR_PARCOURS, LONGUEUR_COULOIR }
