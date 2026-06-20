import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const LOGO_URL = '/Image%20ChatGPT%2020%20juin%202026%2C%2016_26_29.png'

const AVATAR_COLORS = ['#534AB7', '#EF9F27', '#1D9E75', '#D85A30', '#D4537E', '#185FA5']
function colorFor(name) {
  if (!name) return AVATAR_COLORS[0]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function initials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="container">Chargement…</div>

  if (!session && !showAuth) {
    return (
      <div className="container">
        <div className="landing">
          <img src={LOGO_URL} alt="Déwari Abenatchan" style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 8 }} />
          <h1>Déwari Abenatchan</h1>
          <p className="tagline">Le rendez-vous des rois et reines du Ludo</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#6b6385', marginBottom: 16 }}>
            Rejoins le groupe, partage tes codes de salle et défie tes adversaires.
          </p>
          <button onClick={() => setShowAuth(true)} style={{ width: '100%' }}>
            Entrer dans le royaume
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="app-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={LOGO_URL} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        Déwari Abenatchan
      </h1>
      {session ? <GroupScreen session={session} /> : <AuthScreen />}
    </div>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error: signErr } = await supabase.auth.signUp({ email, password })
    if (signErr) {
      setError(signErr.message)
      setBusy(false)
      return
    }
    const userId = data.user?.id
    if (userId) {
      const { error: insertErr } = await supabase.from('membres').insert({
        user_id: userId,
        pseudo,
        contact
      })
      if (insertErr) {
        setError('Compte créé mais erreur fiche membre : ' + insertErr.message)
      }
    }
    setBusy(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
    if (loginErr) setError(loginErr.message)
    setBusy(false)
  }

  return (
    <div className="card">
      <div className="tabs">
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
          S'inscrire
        </button>
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
          Se connecter
        </button>
      </div>

      <form onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="Ton pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Téléphone (visible uniquement par l'admin)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy} style={{ width: '100%' }}>
          {mode === 'signup' ? "Créer mon compte" : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

function GroupScreen({ session }) {
  const [tab, setTab] = useState('chat')

  return (
    <div>
      <div className="tabs">
        <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
          Discussion
        </button>
        <button className={tab === 'codes' ? 'active' : ''} onClick={() => setTab('codes')}>
          Codes Ludo King
        </button>
      </div>
      {tab === 'chat' ? <Chat session={session} /> : <Codes session={session} />}
      <button className="signout-btn" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </button>
    </div>
  )
}

function Chat({ session }) {
  const [membre, setMembre] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadMembre()
    loadMessages()
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadMessages()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadMembre() {
    const { data } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    setMembre(data)
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, membres(pseudo)')
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!membre || (!text && !file)) return
    setBusy(true)
    let imageUrl = null
    if (file) {
      const fileName = `${session.user.id}-${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('images').upload(fileName, file)
      if (!upErr) {
        const { data: pub } = supabase.storage.from('images').getPublicUrl(fileName)
        imageUrl = pub.publicUrl
      }
    }
    await supabase.from('messages').insert({
      membre_id: membre.id,
      contenu: text || null,
      image_url: imageUrl
    })
    setText('')
    setFile(null)
    setBusy(false)
    loadMessages()
  }

  return (
    <div>
      <div className="chat-box">
        {messages.map((m) => {
          const isMine = membre && m.membre_id === membre.id
          const pseudo = m.membres?.pseudo || 'Membre'
          return (
            <div className={'msg-row ' + (isMine ? 'mine' : 'theirs')} key={m.id}>
              {!isMine && (
                <div className="avatar" style={{ background: colorFor(pseudo) }}>
                  {initials(pseudo)}
                </div>
              )}
              <div className="bubble">
                {!isMine && <div className="pseudo">{pseudo}</div>}
                {m.contenu && <div>{m.contenu}</div>}
                {m.image_url && <img src={m.image_url} alt="" />}
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={sendMessage} className="chat-input-row">
        <input
          type="text"
          placeholder="Écrire un message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="icon-btn">
          📷
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
        </label>
        <button type="submit" disabled={busy}>➤</button>
      </form>
      {file && <p style={{ fontSize: 12, color: '#6b6385' }}>Image sélectionnée : {file.name}</p>}
    </div>
  )
}

function Codes({ session }) {
  const [membre, setMembre] = useState(null)
  const [codes, setCodes] = useState([])
  const [code, setCode] = useState('')
  const [nbJoueurs, setNbJoueurs] = useState(4)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadMembre()
    loadCodes()
  }, [])

  async function loadMembre() {
    const { data } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    setMembre(data)
  }

  async function loadCodes() {
    const { data } = await supabase
      .from('codes_salle')
      .select('*, membres(pseudo)')
      .order('created_at', { ascending: false })
      .limit(50)
    setCodes(data || [])
  }

  async function postCode(e) {
    e.preventDefault()
    if (!membre || !code) return
    setBusy(true)
    await supabase.from('codes_salle').insert({
      membre_id: membre.id,
      code,
      nb_joueurs: nbJoueurs
    })
    setCode('')
    setBusy(false)
    loadCodes()
  }

  return (
    <div>
      <form onSubmit={postCode} className="card">
        <input
          type="text"
          placeholder="Code de la salle Ludo King"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <select value={nbJoueurs} onChange={(e) => setNbJoueurs(Number(e.target.value))}>
          {[2, 3, 4, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n} joueurs
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy} style={{ width: '100%' }}>
          Partager le code
        </button>
      </form>

      {codes.map((c) => {
        const pseudo = c.membres?.pseudo || 'Membre'
        return (
          <div className="card code-item" key={c.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ background: colorFor(pseudo) }}>
                {initials(pseudo)}
              </div>
              <div>
                <strong>{c.code}</strong>
                <div style={{ fontSize: 12, color: '#6b6385' }}>
                  {pseudo} · {c.nb_joueurs} joueurs
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
