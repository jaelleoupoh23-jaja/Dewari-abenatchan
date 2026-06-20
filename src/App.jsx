import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

const SLIDES = [
  { emoji: '🎲', titre: 'Le Ludo prend une autre dimension', fond: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)' },
  { emoji: '🏆', titre: 'Décembre. La compétition arrive.', fond: 'linear-gradient(135deg,#FFB800,#FF4D6D)' },
  { emoji: '🔥', titre: '6 salons, ton niveau, ta mise', fond: 'linear-gradient(135deg,#7B2CBF,#3A0CA3)' },
  { emoji: '👑', titre: 'Deviens la légende du quartier', fond: 'linear-gradient(135deg,#3A0CA3,#FF4D6D)' },
]

export default function App() {
  const [ecran, setEcran] = useState('accueil')
  const [session, setSession] = useState(null)
  const [membre, setMembre] = useState(null)
  const [salonActif, setSalonActif] = useState(null)
  const [salons, setSalons] = useState([])
  const [tournoi, setTournoi] = useState(null)
  const [modalAuth, setModalAuth] = useState(null)
  const [inscritTournoi, setInscritTournoi] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    chargerSalons()
    chargerTournoi()
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) chargerMembre()
  }, [session])

  async function chargerMembre() {
    const { data } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    setMembre(data)
  }

  async function chargerSalons() {
    const { data } = await supabase.from('salons').select('*').order('palier', { ascending: true })
    const avecCompte = await Promise.all(
      (data || []).map(async (s) => {
        const { count } = await supabase
          .from('membres')
          .select('*', { count: 'exact', head: true })
          .eq('salon_id', s.id)
        return { ...s, nbMembres: count || 0 }
      })
    )
    setSalons(avecCompte)
  }

  async function chargerTournoi() {
    const { data } = await supabase.from('tournoi').select('*').limit(1).maybeSingle()
    setTournoi(data)
  }

  function ouvrirSalon(salon) {
    if (session && membre) {
      rejoindreSalon(salon)
    } else {
      setModalAuth({ pourSalon: salon })
    }
  }

  async function rejoindreSalon(salon) {
    if (salon.nbMembres >= 20 && membre?.salon_id !== salon.id) {
      alert('Ce salon est complet (20 joueurs maximum).')
      return
    }
    const { error } = await supabase.from('membres').update({ salon_id: salon.id }).eq('id', membre.id)
    if (error) {
      alert(error.message.includes('complet') ? error.message : 'Erreur, réessaie.')
      return
    }
    setMembre({ ...membre, salon_id: salon.id })
    setSalonActif(salon)
    setEcran('chat')
    chargerSalons()
  }

  return (
    <div style={st.page}>
      {ecran === 'accueil' && (
        <Accueil
          salons={salons}
          tournoi={tournoi}
          inscritTournoi={inscritTournoi}
          onChoisirSalon={ouvrirSalon}
          onOuvrirTournoi={() => setModalAuth({ pourTournoi: true })}
        />
      )}

      {ecran === 'chat' && membre && salonActif && (
        <ChatSalon
          salon={salonActif}
          membre={membre}
          onRetour={() => setEcran('accueil')}
        />
      )}

      {modalAuth && (
        <ModalAuth
          contexte={modalAuth}
          onFermer={() => setModalAuth(null)}
          onSuccesSalon={(s) => { setModalAuth(null); rejoindreSalon(s) }}
          onSuccesTournoi={() => { setModalAuth(null); setInscritTournoi(true) }}
          tournoi={tournoi}
        />
      )}
    </div>
  )
}

function Accueil({ salons, tournoi, inscritTournoi, onChoisirSalon, onOuvrirTournoi }) {
  const [index, setIndex] = useState(0)
  const [compte, setCompte] = useState(calculCompte(tournoi?.date_debut))

  useEffect(() => {
    const t1 = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 3500)
    return () => clearInterval(t1)
  }, [])

  useEffect(() => {
    const t2 = setInterval(() => setCompte(calculCompte(tournoi?.date_debut)), 60000)
    return () => clearInterval(t2)
  }, [tournoi])

  const slide = SLIDES[index]

  return (
    <>
      <div style={st.barreNom}>👑 Déwari Abenatchan</div>
      <div style={{ ...st.banniere, background: slide.fond }}>
        <div style={st.bannieretEmoji}>{slide.emoji}</div>
        <div style={st.bannierTitre}>{slide.titre}</div>
        <div style={st.points}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ ...st.point, opacity: i === index ? 1 : 0.35 }} />
          ))}
        </div>
      </div>

      <div style={st.heroTexte}>
        <div style={st.eyebrow}>LUDO COMPÉTITION · DÉCEMBRE</div>
        {compte && (
          <div style={st.compteWrap}>
            {[{ v: compte.j, l: 'jours' }, { v: compte.h, l: 'heures' }, { v: compte.m, l: 'min' }].map((b) => (
              <div key={b.l} style={st.compteBloc}>
                <div style={st.compteChiffre}>{String(b.v).padStart(2, '0')}</div>
                <div style={st.compteLabel}>{b.l}</div>
              </div>
            ))}
          </div>
        )}
        {!inscritTournoi ? (
          <button onClick={onOuvrirTournoi} style={st.boutonPrincipal}>
            🏆 Je m'inscris au tournoi · {tournoi?.prix_inscription?.toLocaleString('fr-FR') || '30 000'} CFA
          </button>
        ) : (
          <div style={st.confirme}>✅ Tu es inscrit au tournoi !</div>
        )}
        {tournoi?.description && (
          <div style={st.details}>
            <p style={{ margin: '4px 0' }}>{tournoi.description}</p>
            {tournoi.premier_prix && <p style={{ margin: '4px 0' }}>🥇 1er prix : {tournoi.premier_prix}</p>}
            {tournoi.deuxieme_prix && <p style={{ margin: '4px 0' }}>🥈 2e prix : {tournoi.deuxieme_prix}</p>}
            {tournoi.troisieme_prix && <p style={{ margin: '4px 0' }}>🥉 3e prix : {tournoi.troisieme_prix}</p>}
          </div>
        )}
      </div>

      <div style={st.section}>
        <div style={st.sectionTitre}>Choisis ton salon</div>
        <div style={st.sectionSousTitre}>6 niveaux de mise, 20 joueurs max par salon</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {salons.map((s) => {
            const complet = s.nbMembres >= 20
            return (
              <div
                key={s.id}
                onClick={() => !complet && onChoisirSalon(s)}
                style={{ ...st.ligneSalon, opacity: complet ? 0.5 : 1, cursor: complet ? 'not-allowed' : 'pointer' }}
              >
                <div style={st.avatar}>{s.palier / 1000}K</div>
                <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{s.nom}</div>
                  <div style={{ fontSize: 13, color: '#9a93b5' }}>Rejoindre ce salon</div>
                </div>
                <span style={{ ...st.badge, backgroundColor: complet ? '#54506b' : '#FF4D6D' }}>
                  {complet ? 'Complet' : `${s.nbMembres}/20`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function calculCompte(dateDebut) {
  if (!dateDebut) return null
  const diff = new Date(dateDebut) - new Date()
  if (diff <= 0) return { j: 0, h: 0, m: 0 }
  return {
    j: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
  }
}

function ModalAuth({ contexte, onFermer, onSuccesSalon, onSuccesTournoi, tournoi }) {
  const [mode, setMode] = useState('inscription')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [numero, setNumero] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const pourTournoi = !!contexte.pourTournoi
  const salonCible = contexte.pourSalon

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    setOccupe(true)

    if (mode === 'connexion') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
      if (error) { setErreur('Email ou mot de passe incorrect.'); setOccupe(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (pourTournoi) {
        const { data: m } = await supabase.from('membres').select('*').eq('user_id', user.id).maybeSingle()
        if (m) await supabase.from('inscriptions_tournoi').insert({ membre_id: m.id, nom: m.pseudo, numero: numero || m.contact })
        setOccupe(false)
        onSuccesTournoi()
      } else {
        setOccupe(false)
        onSuccesSalon(salonCible)
      }
      return
    }

    const { data, error: signErr } = await supabase.auth.signUp({ email, password: motDePasse })
    if (signErr) { setErreur(signErr.message); setOccupe(false); return }
    const userId = data.user?.id
    if (!userId) { setErreur('Erreur de création de compte.'); setOccupe(false); return }

    const { data: nouveauMembre, error: insErr } = await supabase
      .from('membres')
      .insert({ user_id: userId, pseudo, contact: numero })
      .select()
      .single()

    if (insErr) {
      if (insErr.message.includes('pseudo_unique') || insErr.code === '23505') {
        setErreur('Ce pseudo est déjà pris, choisis-en un autre.')
      } else {
        setErreur(insErr.message)
      }
      setOccupe(false)
      return
    }

    if (pourTournoi) {
      await supabase.from('inscriptions_tournoi').insert({ membre_id: nouveauMembre.id, nom: pseudo, numero })
      setOccupe(false)
      onSuccesTournoi()
    } else {
      setOccupe(false)
      onSuccesSalon(salonCible)
    }
  }

  return (
    <div style={st.overlay} onClick={onFermer}>
      <div style={st.modal} onClick={(e) => e.stopPropagation()}>
        <div style={st.modalTitre}>
          {pourTournoi ? `S'inscrire au tournoi · ${tournoi?.prix_inscription?.toLocaleString('fr-FR') || '30 000'} CFA` : `Rejoindre ${salonCible?.nom}`}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setMode('inscription')} style={{ ...st.ongletAuth, ...(mode === 'inscription' ? st.ongletActif : {}) }}>Créer un compte</button>
          <button onClick={() => setMode('connexion')} style={{ ...st.ongletAuth, ...(mode === 'connexion' ? st.ongletActif : {}) }}>Se connecter</button>
        </div>

        <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'inscription' && (
            <input placeholder="Pseudo (visible des autres)" value={pseudo} onChange={(e) => setPseudo(e.target.value)} required style={st.input} />
          )}
          <input placeholder="Numéro" value={numero} onChange={(e) => setNumero(e.target.value)} required={mode === 'inscription' || pourTournoi} style={st.input} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={st.input} />
          <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required minLength={6} style={st.input} />

          {erreur && <div style={st.erreur}>{erreur}</div>}

          <button type="submit" disabled={occupe} style={st.boutonPrincipal}>
            {occupe ? 'Patiente...' : mode === 'inscription' ? 'Valider' : 'Se connecter'}
          </button>
        </form>
        <button onClick={onFermer} style={st.lienFermer}>Annuler</button>
      </div>
    </div>
  )
}

function ChatSalon({ salon, membre, onRetour }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [nbMembres, setNbMembres] = useState(salon.nbMembres || 0)
  const finRef = useRef(null)

  useEffect(() => {
    chargerMessages()
    chargerNbMembres()
    const canal = supabase
      .channel(`salon-${salon.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `salon_id=eq.${salon.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [salon.id])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function chargerNbMembres() {
    const { count } = await supabase
      .from('membres')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon.id)
    setNbMembres(count || 0)
  }

  async function chargerMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, membres(pseudo)')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  async function envoyer(e) {
    e.preventDefault()
    if (!texte.trim()) return
    await supabase.from('messages').insert({ contenu: texte, membre_id: membre.id, salon_id: salon.id })
    setTexte('')
  }

  return (
    <div style={st.page}>
      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <div style={st.avatarGroupe}>{salon.palier / 1000}K</div>
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>{salon.nom}</div>
          <div style={{ fontSize: 12, color: '#9a93b5' }}>{nbMembres} membre{nbMembres > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={st.zoneMessages}>
        {messages.map((m) => {
          const moi = m.membre_id === membre.id
          return (
            <div key={m.id} style={{ ...st.bulle, alignSelf: moi ? 'flex-end' : 'flex-start', background: moi ? 'linear-gradient(135deg,#FF4D6D,#7B2CBF)' : '#23203a', color: '#fff' }}>
              {!moi && <div style={{ fontSize: 11, fontWeight: 800, color: '#FFB800' }}>{m.membres?.pseudo || '...'}</div>}
              {m.contenu}
            </div>
          )
        })}
        <div ref={finRef} />
      </div>
      <form onSubmit={envoyer} style={st.zoneSaisie}>
        <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Écrire un message..." style={st.inputChat} />
        <button type="submit" style={st.boutonEnvoyer}>➤</button>
      </form>
    </div>
  )
}

const st = {
  page: { maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: '#16142a', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column', boxSizing: 'border-box', color: '#fff' },
  barreNom: { textAlign: 'center', padding: '14px 0 0', fontWeight: 800, fontSize: 16, letterSpacing: 0.5, color: '#fff' },
  avatarGroupe: { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FFB800,#FF4D6D)', color: '#1d1a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 },
  banniere: { height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20, textAlign: 'center', transition: 'background 0.6s ease' },
  bannieretEmoji: { fontSize: 48, marginBottom: 8 },
  bannierTitre: { fontSize: 20, fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  points: { display: 'flex', gap: 6, position: 'absolute', bottom: 14 },
  point: { width: 6, height: 6, borderRadius: '50%', background: '#fff' },
  heroTexte: { padding: '20px 18px 8px', textAlign: 'center' },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#FFB800' },
  compteWrap: { display: 'flex', justifyContent: 'center', gap: 14, margin: '14px 0 18px' },
  compteBloc: { background: '#221f3b', borderRadius: 12, padding: '8px 14px', minWidth: 56 },
  compteChiffre: { fontSize: 22, fontWeight: 800, color: '#fff' },
  compteLabel: { fontSize: 10, color: '#9a93b5', textTransform: 'uppercase' },
  boutonPrincipal: { width: '100%', padding: 15, background: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)', color: '#fff', border: 'none', borderRadius: 30, fontWeight: 800, fontSize: 15 },
  confirme: { fontWeight: 800, color: '#4ADE80' },
  details: { background: '#221f3b', borderRadius: 12, padding: 14, marginTop: 16, fontSize: 13, textAlign: 'left' },
  section: { padding: '26px 18px 24px' },
  sectionTitre: { fontSize: 20, fontWeight: 800 },
  sectionSousTitre: { fontSize: 13, color: '#9a93b5', marginTop: 2 },
  ligneSalon: { display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#1d1a35', borderRadius: 14 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#FFB800,#FF4D6D)', color: '#1d1a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: 13 },
  badge: { fontSize: 11, color: '#fff', borderRadius: 12, padding: '2px 8px', fontWeight: 800 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 16 },
  modal: { background: '#1d1a35', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, maxHeight: '90vh', overflowY: 'auto' },
  modalTitre: { fontSize: 16, fontWeight: 800, marginBottom: 14, textAlign: 'center' },
  ongletAuth: { flex: 1, padding: 10, background: '#16142a', color: '#9a93b5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13 },
  ongletActif: { background: '#FF4D6D', color: '#fff' },
  input: { padding: 12, borderRadius: 10, border: '1px solid #3a3658', background: '#16142a', color: '#fff', fontSize: 15 },
  erreur: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  lienFermer: { background: 'none', border: 'none', color: '#9a93b5', marginTop: 12, width: '100%', fontSize: 13 },
  enteteChat: { display: 'flex', alignItems: 'center', padding: '16px 16px 10px', borderBottom: '1px solid #2a2745' },
  retour: { background: 'none', border: 'none', fontSize: 20, color: '#fff', cursor: 'pointer' },
  zoneMessages: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 300, padding: '14px 16px' },
  bulle: { maxWidth: '75%', padding: '8px 12px', borderRadius: 14, fontSize: 14 },
  zoneSaisie: { display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderTop: '1px solid #2a2745' },
  inputChat: { flex: 1, padding: 10, borderRadius: 20, border: '1px solid #3a3658', background: '#221f3b', color: '#fff' },
  boutonEnvoyer: { background: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16 },
}
