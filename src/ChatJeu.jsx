import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

export default function ChatJeu({ partieId, pseudo = 'Joueur', ouvert, fermer }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const finRef = useRef(null)

  const emojis = ['😊', '😂', '🔥', '👏', '😎', '😭', '😡', '😅', '❤️']
  const presets = ['Salut 👋', 'Bien joué 🔥', 'À toi !', 'Chanceux 😅', 'Je vais gagner 😎', 'Merci 😊']

  async function chargerMessages() {
    const { data } = await supabase
      .from('messages_partie')
      .select('*')
      .eq('partie_id', partieId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  async function envoyer(e) {
    e?.preventDefault?.()
    if (!message.trim()) return

    const nouveauMessage = {
      partie_id: partieId,
  auteur_id: pseudo,
  pseudo,
  type: 'message',
  contenu: message.trim()
}
  
const { error } = await supabase
  .from('messages_partie')
  .insert([nouveauMessage])

if (error) {
alert(error.message)
console.log(error)
  return
}

setMessages((prev) => [
  ...prev,
  {
    ...nouveauMessage,
    id: Date.now()
  }
]) 
}   
async function envoyerPreset(txt) {
  if (!txt) return

  const nouveauMessage = {
  partie_id: partieId,
  auteur_id: pseudo,
  pseudo,
  type: 'message',
  contenu: txt
}

const { error } = await supabase
  .from('messages_partie')
  .insert([nouveauMessage])

if (error) {
 alert(error.message)
console.log(error)
  return
}

setMessages((prev) => [
  ...prev,
  {
    ...nouveauMessage,
    id: Date.now()
  }
])
  }
  useEffect(() => {
   if (!ouvert || !partieId) return

    chargerMessages()

    const channel = supabase
      .channel('chat-jeu-' + partieId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages_partie',
          filter: `partie_id=eq.${partieId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ouvert, partieId])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!ouvert) return null

  return (
    <div style={s.overlay}>
      <div style={s.box}>
        <div style={s.header}>
          <b>💬 Chat</b>
          <button onClick={fermer} style={s.close}>✖</button>
        </div>

        <div style={s.content}>
          <div style={s.messages}>
            {messages.map((m, i) => (
              <div key={m.id || i} style={s.bulle}>
                <b>{m.pseudo || 'Joueur'} : </b>
                <span>{m.contenu}</span>
              </div>
            ))}
            <div ref={finRef} />
          </div>

          <div style={s.presets}>
            {presets.map((txt) => (
              <button
                key={txt}
                type="button"
                style={s.presetBtn}
              onClick={() => envoyerPreset(txt)}
              >
                {txt}
              </button>
            ))}
          </div>
        </div>

        <div style={s.emojis}>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              style={s.emojiBtn}
              onClick={() => setMessage((m) => m + emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={envoyer} style={s.form}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrire un message..."
            style={s.input}
          />
          <button type="submit" style={s.send}>Envoyer</button>
        </form>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.55)',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  box: {
    width: '92%',
    maxWidth: 430,
    background: '#081527',
    border: '2px solid #f4c430',
    borderRadius: 18,
    padding: 12,
    color: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  close: {
    background: '#e51b23',
    color: '#fff',
    border: 0,
    borderRadius: 10,
    padding: '5px 9px'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px',
    gap: 8
  },
  messages: {
    height: 230,
    overflowY: 'auto',
    background: '#0d1f38',
    borderRadius: 12,
    padding: 8
  },
  bulle: {
    background: '#153763',
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
    fontSize: 13
  },
  presets: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  presetBtn: {
    background: '#0646a8',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: 8,
    fontWeight: 700
  },
  emojis: {
    display: 'flex',
    gap: 6,
    marginTop: 10,
    overflowX: 'auto'
  },
  emojiBtn: {
    fontSize: 22,
    background: '#102844',
    border: 0,
    borderRadius: 8,
    padding: 6
  },
  form: {
    display: 'flex',
    gap: 8,
    marginTop: 10
  },
  input: {
    flex: 1,
    borderRadius: 10,
    border: 0,
    padding: 12,
    fontSize: 14
  },
  send: {
    background: '#22a447',
    color: '#fff',
    border: 0,
    borderRadius: 10,
    padding: '0 14px',
    fontWeight: 800
  }
}
