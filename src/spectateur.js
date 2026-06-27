import { supabase } from './supabaseClient'

export function genererCodeSpectateur(codePartie) {
  return 'SPE-' + codePartie
}

export async function ecouterPartieSpectateur(partieId, callback) {
  const canal = supabase
    .channel('spectateur-' + partieId)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'parties_en_ligne',
      filter: `code=eq.${partieId}`
    }, (payload) => {
      callback(payload.new)
    })
    .subscribe()
  return canal
}

export async function envoyerMessageSpectateur(partieId, pseudo, message) {
  await supabase.from('spectateurs_chat').insert({
    partie_id: partieId,
    pseudo,
    message,
    type: 'message'
  })
}

export async function envoyerCadeauSpectateur(partieId, pseudo, cadeau) {
  await supabase.from('spectateurs_chat').insert({
    partie_id: partieId,
    pseudo,
    cadeau,
    type: 'cadeau'
  })
}

export async function ecouterChatSpectateur(partieId, callback) {
  const canal = supabase
    .channel('chat-spe-' + partieId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'spectateurs_chat',
      filter: `partie_id=eq.${partieId}`
    }, (payload) => {
      callback(payload.new)
    })
    .subscribe()
  return canal
}
