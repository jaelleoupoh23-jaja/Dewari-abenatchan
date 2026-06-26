import { supabase } from './supabaseClient'

// Génère un code salon à 6 caractères
export function genererCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Récupère ou crée un pseudo stable dans localStorage
export function getPseudo() {
  const cle = 'dewari_pseudo'
  let pseudo = localStorage.getItem(cle)
  if (!pseudo) {
    const pays = ['SN', 'CI', 'GH', 'NG', 'CM', 'ML', 'BF', 'TG']
    const noms = ['Kidi', 'Awa', 'Koffi', 'Nala', 'Zuri', 'Amara', 'Juma', 'Nia', 'Bara', 'Imani']
    const p = pays[Math.floor(Math.random() * pays.length)]
    const n = noms[Math.floor(Math.random() * noms.length)]
    const num = Math.floor(100 + Math.random() * 900)
    pseudo = `${p} ${n}${num}`
    localStorage.setItem(cle, pseudo)
  }
  return pseudo
}

// Crée une nouvelle partie en ligne
export async function creerSalon(nbJoueurs) {
  const code = genererCode()
  const pseudo = getPseudo()
  const couleur = nbJoueurs === 2 ? 'rouge' : 'rouge'

  const { data, error } = await supabase
    .from('parties_en_ligne')
    .insert({
      id: code,
      code,
      createur_pseudo: pseudo,
      nb_joueurs: nbJoueurs,
      etat: 'attente',
      etat_partie: null,
    })
    .select()
    .single()

  if (error) return { erreur: error.message }

  await supabase.from('joueurs_partie').insert({
    partie_id: code,
    pseudo,
    couleur,
  })

  return { code, pseudo, couleur, partie: data }
}
// Rejoint une partie existante avec un code
export async function rejoindreAvecCode(code) {
  const pseudo = getPseudo()

  const { data: partie, error } = await supabase
    .from('parties_en_ligne')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !partie) return { erreur: 'Salon introuvable.' }
  if (partie.etat === 'en_cours') return { erreur: 'Partie déjà commencée.' }

  const { data: joueurs } = await supabase
    .from('joueurs_partie')
    .select('*')
    .eq('partie_id', partie.id)

  const couleursDispos = ['rouge', 'vert', 'jaune', 'bleu']
  const couleursPrises = (joueurs || []).map(j => j.couleur)
  const couleur = couleursDispos.find(c => !couleursPrises.includes(c))

  if (!couleur) return { erreur: 'Salon complet.' }

  // Vérifie que le pseudo n'est pas déjà dans ce salon
  const dejaDedans = (joueurs || []).find(j => j.pseudo === pseudo)
  if (!dejaDedans) {
    await supabase.from('joueurs_partie').insert({
      partie_id: partie.id,
      pseudo,
      couleur,
    })
  }

  return { code: partie.id, pseudo, couleur, partie }
}

// Sauvegarde l'état du plateau dans Supabase
export async function sauvegarderEtat(partieId, etatPartie) {
  await supabase
    .from('parties_en_ligne')
    .update({ etat_partie: etatPartie })
    .eq('id', partieId)
}

// Écoute les changements d'état en temps réel
export function ecouterPartie(partieId, callback) {  
  return supabase
    .channel(`partie-${partieId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parties_en_ligne',
        filter: `id=eq.${partieId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
// Démarre la partie : sauvegarde l'état initial et passe etat à 'en_cours'
export async function demarrerPartieEnLigne(partieId, etatInitial) {
  const { error } = await supabase
    .from('parties_en_ligne')
    .update({
      etat: 'en_cours',
      etat_partie: etatInitial,
    })
    .eq('id', partieId)
  return error ? { erreur: error.message } : { ok: true }
}
