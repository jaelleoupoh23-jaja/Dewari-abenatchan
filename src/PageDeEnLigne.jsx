import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function genererCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getPseudo() {
  let p = localStorage.getItem('dewari_pseudo')
  if (!p) {
    p = 'J' + Math.random().toString(36).substring(2, 6).toUpperCase()
    localStorage.setItem('dewari_pseudo', p)
  }
  return p
}

export default function PageDeEnLigne({ onRetour }) {
  const [ecran, setEcran] = useState('accueil')
  const [code, setCode] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [partie, setPartie] = useState(null)
  const [monRole, setMonRole] = useState(null)
  const [spectateur, setSpectateur] = useState(false)
  const pseudo = getPseudo()

  useEffect(() => {
    if (!code) return
    const canal = supabase.channel('de-' + code)
   .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'parties_de_en_ligne'
      }, (payload) => {
        if (payload.new && payload.new.code === code) setPartie(payload.new)
      })
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [code])

  async function creer() {
    const newCode = genererCode()
    const { data, error } = await supabase.from('parties_de_en_ligne').insert({
      code: newCode,
      joueur1_pseudo: pseudo,
      etat: 'attente'
    }).select().single()
    if (error) { alert('Erreur création : ' + error.message); return }
    setCode(newCode)
    setPartie(data)
    setMonRole('joueur1')
    setEcran('jeu')
  }

  async function rejoindre() {
    const c = codeInput.trim().toUpperCase()
    const { data, error } = await supabase.from('parties_de_en_ligne').select('*').eq('code', c).single()
    if (error || !data) { alert('Partie introuvable'); return }
    if (data.joueur2_pseudo && data.joueur2_pseudo !== pseudo) {
      setCode(c); setPartie(data); setSpectateur(true); setEcran('jeu'); return
    }
    if (!data.joueur2_pseudo) {
      const { data: updated } = await supabase.from('parties_de_en_ligne')
        .update({ joueur2_pseudo: pseudo, etat: 'en_cours' })
        .eq('code', c).select().single()
      setPartie(updated)
      setMonRole('joueur2')
    } else {
      setMonRole('joueur2')
      setPartie(data)
    }
    setCode(c); setEcran('jeu')
  }

  async function lancerDe() {
    if (spectateur) return
    if (!partie || partie.etat !== 'en_cours') return
    if (partie.tour_actuel !== monRole) return
    const valeur = Math.floor(Math.random() * 6) + 1
    const score1 = monRole === 'joueur1' ? (partie.score_joueur1 || 0) + valeur : (partie.score_joueur1 || 0)
    const score2 = monRole === 'joueur2' ? (partie.score_joueur2 || 0) + valeur : (partie.score_joueur2 || 0)
    const prochainTour = monRole === 'joueur1' ? 'joueur2' : 'joueur1'
    const gagnant = score1 >= 10 ? partie.joueur1_pseudo : score2 >= 10 ? partie.joueur2_pseudo : null
    await supabase.from('parties_de_en_ligne').update({
      score_joueur1: score1,
      score_joueur2: score2,
      dernier_de: valeur,
      tour_actuel: prochainTour,
      etat: gagnant ? 'fini' : 'en_cours',
      gagnant: gagnant
    }).eq('code', code)
  }

  if (ecran === 'accueil') return (
    <div style={{ padding: 20, color: '#fff', minHeight: '100vh', background: '#06130f' }}>
      <button onClick={onRetour} style={{ background: 'none', border: 'none', color: '#FFB800', fontSize: 20, marginBottom: 16 }}>←</button>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>🎲 Dé en ligne</h2>
      <p style={{ textAlign: 'center', color: '#aaa', marginBottom: 8 }}>Ton pseudo : <b style={{ color: '#FFB800' }}>{pseudo}</b></p>
      <button onClick={creer} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#FF4D6D,#FFB800)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 16, cursor: 'pointer' }}>
        🎯 Créer une partie
      </button>
      <div style={{ textAlign: 'center', color: '#aaa', marginBottom: 12 }}>— ou —</div>
      <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="Code de la partie" style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', fontSize: 16, marginBottom: 12, boxSizing: 'border-box' }} />
      <button onClick={rejoindre} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#1a1a2e,#4a4a8a)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
        🚀 Rejoindre
      </button>
    </div>
  )

  if (ecran === 'jeu' && partie) return (
    <div style={{ padding: 20, color: '#fff', minHeight: '100vh', background: '#06130f', textAlign: 'center' }}>
      <button onClick={onRetour} style={{ background: 'none', border: 'none', color: '#FFB800', fontSize: 20, float: 'left' }}>←</button>
      <div style={{ clear: 'both', paddingTop: 8 }}>
        {spectateur && <div style={{ background: '#333', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 12, fontSize: 13 }}>👁️ Mode spectateur</div>}
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>Code : <b style={{ color: '#FFB800' }}>{code}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
          <div style={{ background: partie.tour_actuel === 'joueur1' ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 20px' }}>
            <div style={{ fontWeight: 800 }}>{partie.joueur1_pseudo || 'En attente...'}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FF4D6D' }}>{partie.score_joueur1 || 0}</div>
            {partie.tour_actuel === 'joueur1' && <div style={{ fontSize: 11, color: '#FFB800' }}>⏳ Son tour</div>}
          </div>
          <div style={{ background: partie.tour_actuel === 'joueur2' ? 'rgba(255,184,0,0.3)' : 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 20px' }}>
            <div style={{ fontWeight: 800 }}>{partie.joueur2_pseudo || 'En attente...'}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FFB800' }}>{partie.score_joueur2 || 0}</div>
            {partie.tour_actuel === 'joueur2' && <div style={{ fontSize: 11, color: '#FFB800' }}>⏳ Son tour</div>}
          </div>
        </div>
        {partie.dernier_de && <div style={{ fontSize: 64, marginBottom: 16 }}>🎲 {partie.dernier_de}</div>}
        {partie.etat === 'attente' && <div style={{ color: '#aaa', marginBottom: 20 }}>En attente du 2ème joueur...</div>}
        {partie.etat === 'fini' && <div style={{ fontSize: 20, fontWeight: 800, color: '#FFB800', marginBottom: 20 }}>🏆 {partie.gagnant} a gagné !</div>}
        {partie.etat === 'en_cours' && !spectateur && partie.tour_actuel === monRole && (
          <button onClick={lancerDe} style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#FF4D6D,#FFB800)', border: 'none', borderRadius: 16, color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>
            🎲 Lancer le dé
          </button>
        )}
        {partie.etat === 'en_cours' && !spectateur && partie.tour_actuel !== monRole && (
          <div style={{ color: '#aaa', fontSize: 14 }}>En attente du tour adverse...</div>
        )}
      </div>
    </div>
  )

  return null
}
