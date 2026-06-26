import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import ChatJeu from './ChatJeu'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { creerPartie, coupsValides, jouerCoup, lancerDe, passerAuJoueurSuivant, estCaseSecurisee } from './MoteurLudo'

const SLIDES = [
  { emoji: '🎲', titre: 'Le Ludo prend une autre dimension', fond: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)' },
  { emoji: '🏆', titre: 'Décembre. La compétition arrive.', fond: 'linear-gradient(135deg,#FFB800,#FF4D6D)' },
  { emoji: '🔥', titre: '6 salons, ton niveau, ta mise', fond: 'linear-gradient(135deg,#7B2CBF,#3A0CA3)' },
  { emoji: '👑', titre: 'Deviens la légende du quartier', fond: 'linear-gradient(135deg,#3A0CA3,#FF4D6D)' },
]

const ONGLETS = [
  { id: 'accueil', label: '🏠 Accueil' },
  { id: 'tournoi', label: '🏆 Tournoi' },
  { id: 'salons', label: '🎲 Salons' },
  { id: 'compte', label: '👤 Mon compte' },
]

const NUMERO_WAVE = '07-08-68-02-36'

const COULEURS_LUDO = ['rouge', 'vert', 'jaune', 'bleu']
const HEX_COULEUR = {
  rouge: '#E63946',
  vert: '#1B9E4B',
  jaune: '#F6B800',
  bleu: '#1E88E5'
}

const NOMS_AFRICAINS = [
  'Awa', 'Koffi', 'Yao', 'Aminata', 'Fatou', 'Moussa', 'Aïcha', 'Ibrahim',
  'Kwame', 'Ama', 'Kojo', 'Akosua', 'Nana', 'Abena', 'Kwaku', 'Efua',

  'Chinua', 'Ngozi', 'Chiamaka', 'Emeka', 'Amara', 'Zainab', 'Temitope', 'Oluwaseun',
  'Adeola', 'Folake', 'Tunde', 'Bamidele', 'Yetunde', 'Adebayo',

  'Thabo', 'Nomsa', 'Lerato', 'Sipho', 'Naledi', 'Bongani', 'Zanele', 'Mandla',
  'Katlego', 'Tshepo', 'Refilwe', 'Kagiso', 'Tumelo',

  'Alem', 'Selam', 'Dawit', 'Mekdes', 'Tesfaye', 'Hana', 'Abebe', 'Liya',
  'Berhanu', 'Kidist', 'Natnael', 'Rahel',

  'Omar', 'Yasmine', 'Samir', 'Leila', 'Karim', 'Nour', 'Rania', 'Malika',
  'Amine', 'Sana', 'Walid', 'Salma',

  'Cheikh', 'Sokhna', 'Mamadou', 'Bineta', 'Ousmane', 'Adama', 'Khady', 'Boubacar',
  'Aissatou', 'Ibrahima', 'Mame', 'Coumba',

  'Amani', 'Juma', 'Nia', 'Baraka', 'Zuri', 'Imani', 'Kito', 'Nala',
  'Jelani', 'Makena', 'Ayanna', 'Kamau',

  'Aziz', 'Hassan', 'Mariam', 'Youssef', 'Soraya', 'Farid', 'Nadia', 'Dalia',

  'Tariro', 'Nyasha', 'Tatenda', 'Rutendo',
  'Mpho', 'Boitumelo', 'Neo', 'Kelebogile',
  'Tinashe', 'Rudo', 'Anesu', 'Vimbai'
]

function nomAfricainAuto() {
  const nom = NOMS_AFRICAINS[
    Math.floor(Math.random() * NOMS_AFRICAINS.length)
  ]

  return `${nom}${Math.floor(100 + Math.random() * 900)}`
}

const CASES_PARCOURS = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
  [6,0],
]

const COULOIR_COORDS = {
  rouge: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  vert: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  jaune: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  bleu: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
}

const BASE_COORDS = {
  rouge: [[1,1],[1,4],[4,1],[4,4]],
  vert: [[1,10],[1,13],[4,10],[4,13]],
  jaune: [[10,10],[10,13],[13,10],[13,13]],
  bleu: [[10,1],[10,4],[13,1],[13,4]],
}

const ZONES_BASE = {
  rouge: { x: 0, y: 0 },
  vert: { x: 9, y: 0 },
  jaune: { x: 9, y: 9 },
  bleu: { x: 0, y: 9 }
}

const COULEURS_DUEL = {
  rouge: { x: 0, y: 0 },
  jaune: { x: 9, y: 0 }
}

const CELLULE = 22

const DEPART_COULEUR = {
  rouge: 0,
  vert: 13,
  jaune: 26,
  bleu: 39,
}

function coordPion(couleur, pion, index) {
  if (pion.etat === 'base') {
    return BASE_COORDS[couleur]?.[index] || [7, 7]
  }

  if (pion.etat === 'parcours') {
    const depart = DEPART_COULEUR[couleur] || 0
    const positionReelle = (depart + pion.position) % CASES_PARCOURS.length
    return CASES_PARCOURS[positionReelle] || [7, 7]
  }

 if (pion.etat === 'couloir') {
  const pos = Math.max(0, pion.position ?? 0)
  return COULOIR_COORDS[couleur]?.[pos] || COULOIR_COORDS[couleur]?.[0] || [7, 7]
}
 if (pion.etat === 'arrivee') {
  return COULOIR_COORDS[couleur]?.[5] || COULOIR_COORDS[couleur]?.[0] || [7, 7]
}

  return BASE_COORDS[couleur]?.[index] || [7, 7]
}
export default function App() {
  const [ecran, setEcran] = useState('accueil')
  const [session, setSession] = useState(null)
  const [membre, setMembre] = useState(null)
  const [salonActif, setSalonActif] = useState(null)
  const [salons, setSalons] = useState([])
  const [tournoi, setTournoi] = useState(null)
  const [modalAuth, setModalAuth] = useState(null)
  const [inscritTournoi, setInscritTournoi] = useState(false)
const [chatJeuOuvert, setChatJeuOuvert] = useState(false)
  const [nouveauxMessages, setNouveauxMessages] = useState(0)
  const refTournoi = useRef(null)
  const refSalons = useRef(null)
  const refCompte = useRef(null)
  const refAccueil = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    chargerSalons()
    chargerTournoi()
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) chargerMembre()
    else setMembre(null)
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

  function allerA(id) {
    if (id === 'tournoi') {
      setEcran('tournoi')
      return
    }
    if (ecran !== 'accueil') setEcran('accueil')
    const refs = { accueil: refAccueil, salons: refSalons, compte: refCompte }
    setTimeout(() => refs[id]?.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function deconnexion() {
    await supabase.auth.signOut()
    setMembre(null)
    setEcran('accueil')
  }

  return (
    <div style={st.page}>
      {ecran === 'accueil' && (
        <>
          <div style={st.barreNom}>👑 Dewari-abenatchai</div>
          <NavOnglets onAller={allerA} />
          <div ref={refAccueil} />
          <Accueil
            salons={salons}
            tournoi={tournoi}
            inscritTournoi={inscritTournoi}
            onChoisirSalon={ouvrirSalon}
            onOuvrirTournoi={() => setModalAuth({ pourTournoi: true })}
            onOuvrirDe={() => setEcran('de')}
            onOuvrirLudo={() => setEcran('ludo')}
            refTournoi={refTournoi}
            refSalons={refSalons}
          />
          <div ref={refCompte}>
            <Compte
              session={session}
              membre={membre}
              salons={salons}
              onConnexion={() => setModalAuth({ pourSalon: null })}
              onDeconnexion={deconnexion}
              onRetourSalon={(s) => { setSalonActif(s); setEcran('chat') }}
            />
          </div>
        </>
      )}

      {ecran === 'tournoi' && (
        <PageTournoi
          tournoi={tournoi}
          inscritTournoi={inscritTournoi}
          onOuvrirInscription={() => setModalAuth({ pourTournoi: true })}
          onRetour={() => setEcran('accueil')}
        />
      )}

      {ecran === 'de' && (
        <PageDe onRetour={() => setEcran('accueil')} />
      )}

      {ecran === 'ludo' && (
        <PageLudo onRetour={() => setEcran('accueil')} />
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
          onSuccesSalon={(s) => { setModalAuth(null); if (s) rejoindreSalon(s) }}
          onSuccesTournoi={() => { setModalAuth(null); setInscritTournoi(true) }}
          tournoi={tournoi}
        />
      )}
    </div>
  )
}

function NavOnglets({ onAller }) {
  return (
    <div style={st.navWrap}>
      {ONGLETS.map((o) => (
        <button key={o.id} onClick={() => onAller(o.id)} style={st.navBouton}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Compte({ session, membre, salons, onConnexion, onDeconnexion, onRetourSalon }) {
  if (!session || !membre) {
    return (
      <div style={st.section}>
        <div style={st.sectionTitre}>Mon compte</div>
        <div style={st.sectionSousTitre}>Connecte-toi pour voir ton profil</div>
        <button onClick={onConnexion} style={{ ...st.boutonPrincipal, marginTop: 14 }}>Se connecter / Créer un compte</button>
      </div>
    )
  }

  const salonActuel = salons.find((s) => s.id === membre.salon_id)

  return (
    <div style={st.section}>
      <div style={st.sectionTitre}>Mon compte</div>
      <div style={st.carteCompte}>
        <div style={st.avatarGroupe}>{(membre.pseudo || '?').slice(0, 2).toUpperCase()}</div>
        <div style={{ marginLeft: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{membre.pseudo}</div>
          <div style={{ fontSize: 13, color: '#9a93b5' }}>{salonActuel ? `Dans ${salonActuel.nom}` : 'Pas encore dans un salon'}</div>
        </div>
      </div>
      {salonActuel && (
        <button onClick={() => onRetourSalon(salonActuel)} style={{ ...st.boutonPrincipal, marginTop: 14 }}>
          Retourner dans {salonActuel.nom}
        </button>
      )}
      <button onClick={onDeconnexion} style={{ ...st.lienFermer, marginTop: 14, border: '1px solid #3a3658', borderRadius: 10, padding: 10 }}>
        Se déconnecter
      </button>
    </div>
  )
}

function Accueil({ salons, tournoi, inscritTournoi, onChoisirSalon, onOuvrirTournoi, onOuvrirDe, onOuvrirLudo, refTournoi, refSalons }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 3500)
    return () => clearInterval(t1)
  }, [])

  const slide = SLIDES[index]

  return (
    <>
      <div style={{ ...st.banniere, background: slide.fond }}>
        <div style={st.bannieretEmoji}>{slide.emoji}</div>
        <div style={st.bannierTitre}>{slide.titre}</div>
        <div style={st.points}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ ...st.point, opacity: i === index ? 1 : 0.35 }} />
          ))}
        </div>
      </div>

      <div ref={refTournoi} />

      <div style={st.section}>
        <div onClick={onOuvrirDe} style={st.carteDe}>
          <div style={st.carteDeEmoji}>🎲</div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Jouer au Dé</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>2 ou 4 joueurs · premier à 10 gagne</div>
          </div>
          <div style={{ fontSize: 20 }}>→</div>
        </div>

        <div onClick={onOuvrirLudo} style={st.carteLudo}>
          <div style={st.carteDeEmoji}>♟️</div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Jouer au Dewari</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>2 ou 4 joueurs · règles classiques</div>
          </div>
          <div style={{ fontSize: 20 }}>→</div>
        </div>
      </div>

      <div ref={refSalons} style={st.section}>
        <div style={st.sectionTitre}>Choisis ton salon</div>
        <div style={st.sectionSousTitre}>20 joueurs max par salon</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {salons.map((s) => {
            const complet = s.nbMembres >= 20
            return (
              <div
                key={s.id}
                onClick={() => !complet && onChoisirSalon(s)}
                style={{ ...st.ligneSalon, opacity: complet ? 0.5 : 1, cursor: complet ? 'not-allowed' : 'pointer' }}
              >
                <div style={st.avatar}>{s.palier / 1000}</div>
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

const PIPS_POSITIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
}

function De3D({ valeur, tourne, onClick, inclinaison = 0 }) {
  const pips = PIPS_POSITIONS[valeur] || []
  const repos = inclinaison === 0
    ? 'rotate(-8deg) rotateY(-18deg) rotateX(6deg)'
    : 'rotate(6deg) rotateY(14deg) rotateX(-4deg)'

  return (
    <div
      onClick={onClick}
      style={{
        width: 130,
        height: 130,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transform: tourne ? 'none' : repos,
        animation: tourne ? 'de3dSpin 0.95s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
        filter: tourne ? 'drop-shadow(0 0 18px rgba(255,75,109,0.85))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))',
        transition: 'transform 0.5s ease, filter 0.3s ease',
      }}
    >
      {/* Face avant */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 24,
        background: 'linear-gradient(145deg, #fffff5 0%, #f8f2e6 35%, #ede4d0 100%)',
        boxShadow: [
          'inset 0 2px 6px rgba(255,255,255,0.95)',
          'inset -3px -3px 8px rgba(0,0,0,0.12)',
          '0 4px 0 #c8bfaf',
          '0 8px 0 #b0a898',
          '0 12px 0 #9a9080',
          '0 16px 24px rgba(0,0,0,0.4)',
        ].join(', '),
        zIndex: 3,
        overflow: 'hidden',
      }}>
        {/* Reflet principal */}
        <div style={{
          position: 'absolute',
          top: 6, left: 8,
          width: '60%', height: '32%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '50%',
          transform: 'rotate(-20deg)',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
        {/* Reflet secondaire bas */}
        <div style={{
          position: 'absolute',
          bottom: 8, right: 10,
          width: '25%', height: '12%',
          background: 'rgba(255,255,255,0.35)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
        {/* Rim light bords */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)',
          pointerEvents: 'none',
          zIndex: 6,
        }} />
        {/* Points */}
        {pips.map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 17, height: 17,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 25%, #ff9aaa 0%, #e60026 50%, #8b0010 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,180,180,0.35), 0 0 4px rgba(220,0,30,0.4)',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 4,
          }} />
        ))}
      </div>

      {/* Face dessus */}
      <div style={{
        position: 'absolute',
        top: -12, left: 8, right: 8,
        height: 16,
        background: 'linear-gradient(180deg, #ffffff 0%, #e8e0d0 100%)',
        borderRadius: '10px 10px 0 0',
        transform: 'rotateX(50deg)',
        transformOrigin: 'bottom center',
        zIndex: 2,
        boxShadow: '0 -2px 6px rgba(255,255,255,0.5)',
      }} />

      {/* Face côté droit */}
      <div style={{
        position: 'absolute',
        top: 8, right: -12,
        bottom: 8,
        width: 16,
        background: 'linear-gradient(270deg, #9a9080 0%, #c8c0b0 100%)',
        borderRadius: '0 10px 10px 0',
        transform: 'rotateY(50deg)',
        transformOrigin: 'left center',
        zIndex: 2,
      }} />

      {/* Ombre sol */}
      <div style={{
        position: 'absolute',
        bottom: -22, left: '5%',
        width: '90%', height: 14,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.28)',
        filter: 'blur(8px)',
        zIndex: 1,
      }} />
    </div>
  )
}

function PageDe({ onRetour }) {
  const [val1, setVal1] = useState(6)
  const [val2, setVal2] = useState(6)
  const [tourne, setTourne] = useState(false)
  const [total, setTotal] = useState(null)
  const [hint, setHint] = useState(true)

  function lancer() {
    if (tourne) return
    setTourne(true)
    setTotal(null)
    setHint(false)
    setTimeout(() => {
      const v1 = Math.floor(Math.random() * 6) + 1
      const v2 = Math.floor(Math.random() * 6) + 1
      setVal1(v1)
      setVal2(v2)
      setTotal(v1 + v2)
      setTourne(false)
    }, 900)
  }

  return (
    <div style={st.page}>
      <style>{`
     @keyframes de3dSpin {
  0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg)   scale(1);    }
  15%  { transform: rotateX(220deg) rotateY(130deg) rotateZ(70deg)  scale(1.14); }
  35%  { transform: rotateX(400deg) rotateY(250deg) rotateZ(140deg) scale(1.20); }
  55%  { transform: rotateX(560deg) rotateY(330deg) rotateZ(190deg) scale(1.16); }
  72%  { transform: rotateX(670deg) rotateY(370deg) rotateZ(230deg) scale(1.09); }
  85%  { transform: rotateX(705deg) rotateY(352deg) rotateZ(348deg) scale(1.04); }
  93%  { transform: rotateX(718deg) rotateY(357deg) rotateZ(358deg) scale(1.01); }
  97%  { transform: rotateX(722deg) rotateY(361deg) rotateZ(362deg) scale(0.99); }
  100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(360deg) scale(1);    }
}
        @keyframes totalAppear {
          0%   { opacity: 0; transform: scale(0.4) translateY(16px); }
          60%  { opacity: 1; transform: scale(1.12) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes hintPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.04); }
        }
      `}</style>

      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <span style={{ fontWeight: 800, marginLeft: 8, color: '#fff', fontSize: 16 }}>🎲 Les Dés</span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 18px',
        background: 'radial-gradient(ellipse at 50% 40%, #1a1040 0%, #16142a 100%)',
      }}>
        <div style={{
          display: 'flex',
          gap: 36,
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 700,
          marginBottom: 44,
        }}>
     <De3D valeur={val1} tourne={tourne} onClick={lancer} inclinaison={0} />
<De3D valeur={val2} tourne={tourne} onClick={lancer} inclinaison={1} />
        </div>

        {total !== null && !tourne && (
          <div style={{ animation: 'totalAppear 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#9a93b5', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Total
            </div>
            <div style={{
              fontSize: 72,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #FF4D6D 0%, #FFB800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
              {total}
            </div>
            {total === 12 && <div style={{ fontSize: 24, marginTop: 10 }}>🔥 Double 6 !</div>}
            {total === 2  && <div style={{ fontSize: 24, marginTop: 10 }}>😬 Snake eyes...</div>}
            {val1 === val2 && total !== 12 && total !== 2 && (
              <div style={{ fontSize: 18, marginTop: 10, color: '#FFB800' }}>✨ Double !</div>
            )}
          </div>
        )}

        {hint && !tourne && (
          <div style={{ animation: 'hintPulse 2s ease-in-out infinite', color: '#9a93b5', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
            Touche les dés pour lancer
          </div>
        )}

        {tourne && (
          <div style={{ color: '#9a93b5', fontSize: 13, marginTop: 24, letterSpacing: 4 }}>
            · · ·
          </div>
        )}
      </div>
    </div>
  )
}

function PlateauLudo({ partie, coupsDispo, onJouerPion, dernierDe, couleurCourante, deBouge, onLancer }) {

  const couleursAffichees =
    partie?.couleurs?.length === 2
      ? ['rouge', 'jaune']
      : Object.keys(ZONES_BASE)

const totem = {
  rouge: {
    name: "Royaume Lion",
    icon: "🦁"
  },
  vert: {
    name: "Jungle Panthère",
    icon: "🐆"
  },
  jaune: {
    name: "Ciel Aigle",
    icon: "🦅"
  },
  bleu: {
    name: "Tribu Éléphant",
    icon: "🐘"
  }
}

  const zoneLabel = {
    rouge: 'ROYAUME LION',
    vert: 'JUNGLE PANTHÈRE',
    jaune: 'CIEL AIGLE',
    bleu: 'TERRE ÉLÉPHANT',
  }

 return (
  <>
   <style>{`
  @keyframes dePlatSpin {
    0%   { transform: rotate(0deg) scale(1); }
    25%  { transform: rotate(-15deg) scale(1.15); }
    50%  { transform: rotate(12deg) scale(1.1); }
    75%  { transform: rotate(-8deg) scale(1.05); }
    100% { transform: rotate(0deg) scale(1); }
  }
`}</style>
 <svg viewBox="0 0 330 330" style={st.ludoSvg}>
      <defs>
        <pattern id="motifJungle" width="42" height="42" patternUnits="userSpaceOnUse">
          <rect width="42" height="42" fill="#06381f" />
          <path d="M0 22 Q16 4 42 16" stroke="#0b6538" strokeWidth="5" fill="none" opacity="0.45" />
          <path d="M4 38 Q20 20 38 34" stroke="#0f8a4b" strokeWidth="3" fill="none" opacity="0.35" />
          <circle cx="8" cy="9" r="3" fill="#2ecc71" opacity="0.35" />
          <circle cx="33" cy="27" r="4" fill="#27ae60" opacity="0.25" />
        </pattern>

        <linearGradient id="boisCase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8e7b0" />
          <stop offset="45%" stopColor="#d9b66f" />
          <stop offset="100%" stopColor="#9b6a28" />
        </linearGradient>

        <filter id="ombreFort" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.65" />
        </filter>

        <filter id="lumiereOr" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFD700" floodOpacity="0.85" />
        </filter>
      </defs>

      <rect x="0" y="0" width="330" height="330" rx="30" fill="url(#motifJungle)" />
      <rect x="8" y="8" width="314" height="314" rx="30" fill="rgba(0,0,0,0.22)" stroke="#FFD700" strokeWidth="4" filter="url(#lumiereOr)" />

      <text x="20" y="30" fontSize="22">🌿</text>
      <text x="286" y="31" fontSize="22">🌴</text>
      <text x="18" y="309" fontSize="22">🍃</text>
      <text x="286" y="310" fontSize="22">🌿</text>

{couleursAffichees.map((couleur) => {
  const z = ZONES_BASE[couleur]

  return (
    <g key={couleur} filter="url(#ombreFort)">
          <rect
            x={z.x * CELLULE + 2}
            y={z.y * CELLULE + 2}
            width={6 * CELLULE - 4}
            height={6 * CELLULE - 4}
            rx="20"
            fill={HEX_COULEUR[couleur]}
            opacity="0.78"
            stroke="#FFD700"
            strokeWidth="2.5"
          />

          <rect
            x={z.x * CELLULE + 15}
            y={z.y * CELLULE + 15}
            width={6 * CELLULE - 30}
            height={6 * CELLULE - 30}
            rx="14"
            fill="rgba(255,255,255,0.18)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
          />

          <text
            x={z.x * CELLULE + 3 * CELLULE}
            y={z.y * CELLULE + 3 * CELLULE + 5}
            textAnchor="middle"
            fontSize="24"
            opacity="0.32"
          >
            🌴
          </text>

          <text
            x={z.x * CELLULE + 3 * CELLULE}
            y={z.y * CELLULE + 6 * CELLULE - 8}
            textAnchor="middle"
            fontSize="5.5"
            fontWeight="900"
            fill="#fff"
            opacity="0.8"
          >
            {zoneLabel[couleur]}
          </text>
       </g>
    
)}

      {CASES_PARCOURS.map(([r, c], i) => (
        <rect
          key={`case-${i}`}
          x={c * CELLULE}
          y={r * CELLULE}
          width={CELLULE}
          height={CELLULE}
          rx="2"
          fill={estCaseSecurisee(i) ? '#FFD86B' : 'url(#boisCase)'}
          stroke="#3a240d"
          strokeWidth="0.8"
        />
     ))}

      {Object.entries(COULOIR_COORDS).map(([couleur, cases]) =>
        cases.map(([r, c], i) => (
          <rect
            key={`${couleur}-couloir-${i}`}
            x={c * CELLULE}
            y={r * CELLULE}
            width={CELLULE}
            height={CELLULE}
            rx="2"
            fill={HEX_COULEUR[couleur]}
            opacity="0.9"
            stroke="#2b1608"
            strokeWidth="0.8"
          />
        ))
      )}

      <rect
        x={6 * CELLULE}
        y={6 * CELLULE}
        width={3 * CELLULE}
        height={3 * CELLULE}
        rx="9"
        fill="#0b2b16"
        stroke="#FFD700"
        strokeWidth="2"
        filter="url(#lumiereOr)"
      />
      <foreignObject   x={6.15 * CELLULE}   y={6.15 * CELLULE}   width={2.7 * CELLULE}   height={2.7 * CELLULE} >   <button     onClick={coupsDispo.length === 0 ? onLancer : undefined}     disabled={coupsDispo.length > 0 || deBouge}     style={{       width: '100%',       height: '100%',       borderRadius: 14,       border: `3px solid ${HEX_COULEUR[couleurCourante]}`,       background: '#fff',       fontSize: 30,       cursor: coupsDispo.length === 0 ? 'pointer' : 'default',       boxShadow: `0 0 18px ${HEX_COULEUR[couleurCourante]}`,       animation: deBouge ? 'dewariDeTourne .65s ease-in-out' : 'none'     }}   >     <span style={{
  display:'block',
  color:'#111',
  fontWeight:900,
  fontSize:34,
  lineHeight:'1'
}}>
        <span style={{
  display: 'block',
  color: '#111',
  fontWeight: 900,
  fontSize: 34,
  lineHeight: '1',
  animation: deBouge ? 'dePlatSpin 0.65s ease-in-out' : 'none',
}}>
  {deBouge ? faceDe(Math.ceil(Math.random() * 6)) : (dernierDe ? faceDe(dernierDe) : '🎲')}
</span>  </button> </foreignObject>

      {partie.couleurs.map((couleur) =>
        partie.pions[couleur].map((pion, index) => {
          const [r, c] = coordPion(couleur, pion, index)
        const offsets = [
  [0, 0],
  [-4, -4],
  [4, -4],
  [-4, 4],
  [4, 4],
]

const memeCase = partie.pions[couleur].filter((p, i) => {
  const [rr, cc] = coordPion(couleur, p, i)
  return rr === r && cc === c && p.etat !== 'base'
})

const rangPile = memeCase.findIndex((p) => p === pion)
const [dx, dy] = pion.etat === 'base' ? [0, 0] : offsets[rangPile] || [0, 0]

const cx = c * CELLULE + CELLULE / 2 + dx
const cy = r * CELLULE + CELLULE / 2 + dy
          const jouable = couleur === couleurCourante && coupsDispo.some((cp) => cp.index === index)

          return (
            <g
              key={`${couleur}-${index}`}
              onClick={() => jouable && onJouerPion(index)}
              style={{ cursor: jouable ? 'pointer' : 'default' }}
              filter="url(#ombreFort)"
            >
              {jouable && (
                <circle cx={cx} cy={cy} r={CELLULE / 1.45} fill="none" stroke="#FFD700" strokeWidth="2.5">
                  <animate attributeName="r" values={`${CELLULE / 2};${CELLULE / 1.35};${CELLULE / 2}`} dur="1s" repeatCount="indefinite" />
                </circle>
              )}

              <ellipse cx={cx} cy={cy + 9} rx="10" ry="4" fill="rgba(0,0,0,0.45)" />

             <circle
  cx={cx}
  cy={cy}
  r="7"
                fill="#fff8cf"
                stroke="#FFD700"
                strokeWidth="1.4"
              />

              <circle
                cx={cx}
                cy={cy}
                r="7"
                fill={HEX_COULEUR[couleur]}
                opacity="0.25"
              />
<text
  x={cx}
  y={cy + 5}
  textAnchor="middle"
fontSize="13"
>
  ♟
</text>
<title>{totem[couleur].name}</title>

            </g>
          )
        })
      )}
    </svg>
     </>
  )
} 

function InterfaceLudoPro({
  partie,
  noms,
  indexCourant,
  couleurCourante,
  coupsDispo,
  deBouge,
  lancerAvecAnimation,
  jouerPion,
  onOuvrirChat
}) {
  const joueurs = partie.couleurs.map((couleur, i) => ({
    couleur,
    nom: noms[i],
    actif: i === indexCourant,
    pieces: [15600, 22840, 8350, 12420][i] || 5000,
    trophees: [520, 780, 320, 410][i] || 100,
    drapeau: ['🇸🇳', '🇨🇮', '🇬🇭', '🇳🇬'][i] || '🌍',
    avatar: ['👨🏿‍🦱', '👩🏾‍🦱', '👨🏾', '👩🏿'][i] || '🙂'
  }))

  return (
    <div style={{
      width:'100%',
      maxWidth:520,
      margin:'0 auto',
      minHeight:'100vh',
      background:'radial-gradient(circle at top,#123b2a,#06130f 65%,#030806)',
      color:'#fff',
      padding:8,
      boxSizing:'border-box',
      position:'relative',
      overflow:'hidden'
    }}>
      <div style={{
        display:'grid',
        gridTemplateColumns:'1fr 1fr',
        gap:8,
        marginBottom:6
      }}>
        {joueurs.slice(0, 2).map((j) => <CarteJoueurPro key={j.couleur} joueur={j} />)}
      </div>

      <div style={{
        position:'relative',
        width:'100%',
        aspectRatio:'1 / 1',
        margin:'0 auto'
      }}>
        <PlateauLudo
          partie={partie}
          coupsDispo={coupsDispo}
          onJouerPion={jouerPion}
          dernierDe={partie.dernierDe}
          couleurCourante={couleurCourante}
          deBouge={deBouge}
          onLancer={lancerAvecAnimation}
        />
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'1fr 1fr',
        gap:8,
        marginTop:6
      }}>
        {joueurs.slice(2, 4).map((j) => <CarteJoueurPro key={j.couleur} joueur={j} />)}
      </div>

    <BarreChatCadeaux
  onOuvrirChat={onOuvrirChat}
/>
    </div>
  )
}

function CarteJoueurPro({ joueur }) {
  return (
    <div style={{
      display:'flex',
      alignItems:'center',
    gap:5,
     background:'transparent',
border:'none',
borderRadius:0,
padding:0,
boxShadow:'none'
    }}>
      <div style={{
       width:32,
        height:32,
        borderRadius:'50%',
        display:'grid',
        placeItems:'center',
     fontSize:20,
        background:'#f7d99b',
        border:'2px solid #ffd700'
      }}>
        {joueur.avatar}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:900, fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {joueur.drapeau} {joueur.nom}
        </div>
        <div style={{ fontSize:10 }}>🪙 {joueur.pieces.toLocaleString('fr-FR')}</div>
        <div style={{ fontSize:9}}>🏆 {joueur.trophees}</div>
        <div style={{ display:'flex', gap:3, marginTop:4 }}>
          {[0,1,2,3].map((n) => (
            <span key={n} style={{
           width:12, 
              height:12,

              borderRadius:'50%',
              border:'1px solid #ffd700',
              opacity:.75
            }} />
          ))}
        </div>
      </div>

      <button style={{
       width:30,
height:30,
        borderRadius:'50%',
        border:'2px solid #ffd700',
        background:'#431014',
       fontSize:16
      }}>
        🎁
      </button>
    </div>
  )
}

function BarreChatCadeaux({ onOuvrirChat, nouveauxMessages = 0 }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [reaction, setReaction] = useState(null)
  const [emojiOuvert, setEmojiOuvert] = useState(false)
async function chargerMessages() {
  const { data, error } = await supabase
    .from('messages_partie')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  if (data) {
    setMessages(
      data.map(m => ({
        texte: m.contenu,
        type: m.type,
        pseudo: m.pseudo
      }))
    )
  }
}

useEffect(() => {
  chargerMessages()

  const channel = supabase
    .channel('chat-partie')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_partie'
      },
      (payload) => {
        const msg = payload.new

        setMessages(prev => [
          ...prev,
          {
            texte: msg.contenu,
            type: msg.type,
            pseudo: msg.pseudo
          }
        ])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
  const emojis = ['😂','😎','🔥','🙋🏿‍♂️','👑','🕺🏿','🥁','🍌','🥤','❤️','👏🏿','🤣']

  const envoyerMessage = async () => {
  if (!message.trim()) return

  const nouveauMessage = {
    partie_id: 'partie-test',
    auteur_id: 'joueur-test',
    pseudo: 'Moi',
    role: 'joueur',
    type: 'message',
    contenu: message
  }

  const { error } = await supabase
    .from('messages_partie')
    .insert([nouveauMessage])

  if (error) {
    alert(JSON.stringify(error))
    console.error(error)
    return
}
  setMessages([...messages, { texte: message, type: 'message' }])
setMessage('')
}
  

  const envoyerReaction = (emoji) => {
    setReaction(emoji)
    setMessages([...messages, { texte: emoji, type: 'emoji' }])
    setEmojiOuvert(false)

    setTimeout(() => {
      setReaction(null)
    }, 1200)
  }

  return (
    <div style={{
  marginTop:4,
  position:'relative',
  zIndex:999999,
  pointerEvents:'auto'
}}>

      {reaction && (
        <div style={{
          position:'fixed',
          left:'50%',
          top:'50%',
          transform:'translate(-50%,-50%)',
          fontSize:120,
          zIndex:999999999,
          pointerEvents:'none'
        }}>
          {reaction}
        </div>
      )}

     <div style={{
  display:'flex',
  alignItems:'center',
  gap:8,
  background:'#081628',
  border:'1px solid rgba(255,255,255,.12)',
  borderRadius:22,
  padding:8,
  position:'relative',
  zIndex:999999,
  pointerEvents:'auto'
}}>
      <button
  type="button"
  onClick={onOuvrirChat}
  style={{
    fontSize:22,
    background:'transparent',
    border:0,
    cursor:'pointer'
  }}
>
  💬
{nouveauxMessages > 0 && (
  <span style={st.badgeNotif}>{nouveauxMessages}</span>
)}        
</button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') envoyerMessage()
          }}
          placeholder="Tape ton message..."
          style={{
            flex:1,
            background:'transparent',
            border:0,
            color:'#fff',
            outline:'none'
          }}
        />

        <button
          type="button"
          onClick={() => setEmojiOuvert(!emojiOuvert)}
          style={{ fontSize:24, background:'transparent', border:0, cursor:'pointer' }}
        >
          😊
        </button>

        <button
          type="button"
          onClick={envoyerMessage}
          style={{ fontSize:22, background:'transparent', border:0, cursor:'pointer' }}
        >
          ➤
        </button>
      </div>

      {emojiOuvert && (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(6, 1fr)',
          gap:6,
          marginTop:8,
          background:'#071827',
          border:'1px solid rgba(255,215,0,.35)',
          borderRadius:14,
          padding:8,
          zIndex:99999
        }}>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => envoyerReaction(emoji)}
              style={{
                height:40,
                borderRadius:10,
                border:'1px solid rgba(255,255,255,.15)',
                background:'#102442',
                fontSize:22,
                cursor:'pointer'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
function PetitDeLudo({ valeur, anime }) {
  const points = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  }

  const v = valeur || 1

  return (
    <div style={{
      width: 58,
      height: 58,
      margin: '0 auto 12px',
      borderRadius: 14,
      background: 'linear-gradient(145deg,#ffffff,#e8e3d5)',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gridTemplateRows: 'repeat(3,1fr)',
      padding: 8,
      gap: 3,
      boxShadow: '0 10px 22px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.9)',
      transform: anime ? 'rotateX(360deg) rotateY(360deg) scale(1.15)' : 'rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.7s ease',
    }}>
      {[1,2,3,4,5,6,7,8,9].map((pos) => (
        <span
          key={pos}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: points[v].includes(pos) ? '#e11d48' : 'transparent',
            alignSelf: 'center',
            justifySelf: 'center',
            boxShadow: points[v].includes(pos) ? '0 1px 4px rgba(0,0,0,0.35)' : 'none',
          }}
        />
      ))}
    </div>
  )
}
function PageLudo({ onRetour }) {
const [phase, setPhase] = useState('config');
const [nbJoueurs, setNbJoueurs] = useState(2);
  const [pionBouge, setPionBouge] = useState(false);
  const [deAnime, setDeAnime] = useState(false)
function sonPas() {
  try {
    const audio = new Audio('/pas.mp3')
    audio.volume = 0.35
    audio.play().catch(() => {})
  } catch (e) {}
}
  const [noms, setNoms] = useState([
  nomAfricainAuto(),
  nomAfricainAuto(),
  nomAfricainAuto(),
  nomAfricainAuto()
]); 
  const [partie, setPartie] = useState(null)
  const [coupsDispo, setCoupsDispo] = useState([])
  const [messageTour, setMessageTour] = useState('')
const [deBouge, setDeBouge] = useState(false)
const [chatJeuOuvert, setChatJeuOuvert] = useState(false)
function sonPas() {
  try {
    const audio = new Audio('/pas.mp3')
    audio.volume = 0.35
    audio.play().catch(() => {})
  } catch (e) {}
}
const faceDe = (n) => {
  const faces = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  }

  return faces[n] || '🎲'
}

function lancerAvecAnimation() {
  if (coupsDispo.length > 0 || deBouge) return

  setDeBouge(true)

  setTimeout(() => {
    lancer()
    setDeBouge(false)
  }, 650)
}
  function demarrer() {
   const couleursActives = nbJoueurs === 2
  ? ['rouge', 'jaune']
  : COULEURS_LUDO.slice(0, nbJoueurs)
    setPartie(creerPartie(couleursActives))
    setCoupsDispo([])
    setMessageTour('')
    setPhase('jeu')
  }

 async function lancer() {
   setDeAnime(true)
setTimeout(() => setDeAnime(false), 700)
   
  if (!partie || coupsDispo.length > 0 || deBouge) return

  setDeBouge(true)
  setMessageTour('Le dé tourne...')

  await new Promise((resolve) => setTimeout(resolve, 900))

  const resultat = lancerDe(partie)
  setDeBouge(false)
  setPartie(resultat.partie)

  if (resultat.tourAnnule) {
    setMessageTour('3 six d’affilée → tour annulé, au suivant :-')
    setCoupsDispo([])
  } else if (resultat.aucunCoup) {
    setMessageTour(`Dé : ${resultat.valeur} — aucun coup possible, au suivant :-`)
    setCoupsDispo([])
  } else {
    setMessageTour(`Dé : ${resultat.valeur} — choisis un pion à jouer.`)
    setCoupsDispo(resultat.coups)
  }
}

async function jouerPion(index) {
  if (!partie || !partie.dernierDe || pionBouge) return

  setPionBouge(true)

  const valeur = partie.dernierDe
  const couleur = partie.couleurs[partie.tourActuel]
  const pionDepart = partie.pions[couleur][index]
  let nouvellePartie = jouerCoup(partie, index, valeur)

  let partieAnimee = JSON.parse(JSON.stringify(partie))

  for (let pas = 1; pas <= valeur; pas++) {
    let pionAnime = { ...pionDepart }

    if (pionDepart.etat === 'base') {
      pionAnime = { etat: 'parcours', position: 0 }
    } else if (pionDepart.etat === 'parcours') {
      const pos = pionDepart.position + pas
      if (pos < 51) pionAnime = { etat: 'parcours', position: pos }
      else pionAnime = { etat: 'couloir', position: 0 }
    } else if (pionDepart.etat === 'couloir') {
      const pos = pionDepart.position + pas
      if (pos < 5) pionAnime = { etat: 'couloir', position: pos }
      else pionAnime = { etat: 'arrivee', position: 5 }
    }

    partieAnimee = {
      ...partieAnimee,
      pions: {
        ...partieAnimee.pions,
        [couleur]: partieAnimee.pions[couleur].map((p, i) =>
          i === index ? pionAnime : p
        )
      }
    }

    setPartie(partieAnimee)
    sonPas()
    await new Promise((resolve) => setTimeout(resolve, 260))
  }

  if (nouvellePartie.vainqueur) {
    setPartie(nouvellePartie)
    setCoupsDispo([])
    setPhase('fini')
    setPionBouge(false)
    return
  }

  if (!nouvellePartie.doitRejouer) {
    nouvellePartie = passerAuJoueurSuivant(nouvellePartie)
    setMessageTour('')
  } else {
    setMessageTour('Tu rejoues !')
  }

  setPartie(nouvellePartie)
  setCoupsDispo([])
  setPionBouge(false)
}

 

  const couleurCourante = partie?.couleurs[partie.tourActuel]
  const indexCourant = partie ? partie.couleurs.indexOf(couleurCourante) : -1

  return (
    <div style={st.page}>
      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <span style={{ fontWeight: 800, marginLeft: 8, color: '#fff', fontSize: 16 }}>🎲 Déwari</span>
      </div>

      {phase === 'config' && (
        <div style={st.section}>
          <div style={st.sectionTitre}>Combien de joueurs ?</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[2, 4].map((n) => (
              <button
                key={n}
                onClick={() => setNbJoueurs(n)}
                style={{ ...st.ongletAuth, flex: 1, ...(nbJoueurs === n ? st.ongletActif : {}) }}
              >
                {n} joueurs
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {Array.from({ length: nbJoueurs }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: HEX_COULEUR[COULEURS_LUDO[i]], flexShrink: 0 }} />
                <input
                  value={noms[i]}
                  onChange={(e) => {
                    const copie = [...noms]
                    copie[i] = e.target.value
                    setNoms(copie)
                  }}
                  style={{ ...st.input, flex: 1 }}
                  placeholder={`Nom du joueur ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div style={st.regleDe}>
            Règles classiques : sortie de pion uniquement sur un 6, un 6 redonne un tour, 3 six d'affilée annule le tour, capture en tombant pile sur un adversaire (sauf cases dorées sécurisées), dépassement autorisé pour entrer dans la zone d'arrivée.
          </div>

          <button onClick={demarrer} style={{ ...st.boutonPrincipal, marginTop: 18 }}>
            Démarrer la partie
          </button>
        </div>
      )}

{phase === 'jeu' && partie && (
  <>
    <InterfaceLudoPro
      partie={partie}
      noms={noms}
      indexCourant={indexCourant}
      couleurCourante={couleurCourante}
      coupsDispo={coupsDispo}
      deBouge={deBouge}
      lancerAvecAnimation={lancerAvecAnimation}
      jouerPion={jouerPion}
      onOuvrirChat={() => setChatJeuOuvert(true)}
    />

    <ChatJeu
      partieId={partie?.id || 'partie-test'}
      pseudo={noms[indexCourant] || 'Joueur'}
      ouvert={chatJeuOuvert}
      fermer={() => setChatJeuOuvert(false)}
      onNouveauMessage={() => setNouveauxMessages((n) => n + 1)}
    />
  </>
)}

      {phase === 'fini' && partie?.vainqueur && (
      
  <div style={st.section}>
          <div style={st.zoneDe}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>
              {noms[partie.couleurs.indexOf(partie.vainqueur)]} gagne !
            </div>
            <button onClick={rejouerPartie} style={{ ...st.boutonPrincipal, marginTop: 18 }}>Rejouer</button>
          </div>
        </div>
      )}
    </div>
  )
}  function PageTournoi({ tournoi, inscritTournoi, onOuvrirInscription, onRetour }) {
  const [compte, setCompte] = useState(calculCompte(tournoi?.date_debut))

  useEffect(() => {
    const t = setInterval(() => setCompte(calculCompte(tournoi?.date_debut)), 60000)
    return () => clearInterval(t)
  }, [tournoi])

  return (
    <div style={st.page}>
      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <span style={{ fontWeight: 800, marginLeft: 8, color: '#fff', fontSize: 16 }}>🏆 Tournoi</span>
      </div>

      <div style={{ ...st.heroTexte, paddingTop: 24 }}>
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
          <button onClick={onOuvrirInscription} style={st.boutonPrincipal}>
            🏆 Je m'inscris · {tournoi?.prix_inscription?.toLocaleString('fr-FR') || '30 000'} CFA
          </button>
        ) : (
          <div style={st.confirme}>✅ Tu es inscrit au tournoi !</div>
        )}
        {(tournoi?.description || tournoi?.premier_prix || tournoi?.deuxieme_prix || tournoi?.troisieme_prix) && (
          <div style={st.details}>
            {tournoi?.description && !tournoi.description.includes('À COMPLÉTER') && <p style={{ margin: '4px 0' }}>{tournoi.description}</p>}
            {tournoi?.premier_prix && !tournoi.premier_prix.includes('À COMPLÉTER') && <p style={{ margin: '4px 0' }}>🥇 1er prix : {tournoi.premier_prix}</p>}
            {tournoi?.deuxieme_prix && !tournoi.deuxieme_prix.includes('À COMPLÉTER') && <p style={{ margin: '4px 0' }}>🥈 2e prix : {tournoi.deuxieme_prix}</p>}
            {tournoi?.troisieme_prix && !tournoi.troisieme_prix.includes('À COMPLÉTER') && <p style={{ margin: '4px 0' }}>🥉 3e prix : {tournoi.troisieme_prix}</p>}
          </div>
        )}
      </div>
    </div>
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
          {pourTournoi ? `S'inscrire au tournoi` : salonCible ? `Rejoindre ${salonCible?.nom}` : 'Connexion'}
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
  const [enTrainEcrire, setEnTrainEcrire] = useState([])
  const [envoiPhoto, setEnvoiPhoto] = useState(false)
  const [enAppel, setEnAppel] = useState(false)
  const [micCoupe, setMicCoupe] = useState(false)
  const [participantsAppel, setParticipantsAppel] = useState([])
  const finRef = useRef(null)
  const canalRef = useRef(null)
  const inputFichierRef = useRef(null)
  const clientAgoraRef = useRef(null)
  const pisteAudioRef = useRef(null)

  useEffect(() => {
    chargerMessages()
    chargerNbMembres()
    const canal = supabase
      .channel(`salon-${salon.id}`, { config: { presence: { key: membre.id } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `salon_id=eq.${salon.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new])
      })
      .on('broadcast', { event: 'frappe' }, ({ payload }) => {
        if (payload.membre_id === membre.id) return
        setEnTrainEcrire((liste) => {
          if (liste.find((p) => p.id === payload.membre_id)) return liste
          return [...liste, { id: payload.membre_id, pseudo: payload.pseudo }]
        })
        clearTimeout(window[`frappe_${payload.membre_id}`])
        window[`frappe_${payload.membre_id}`] = setTimeout(() => {
          setEnTrainEcrire((liste) => liste.filter((p) => p.id !== payload.membre_id))
        }, 2000)
      })
      .subscribe()
    canalRef.current = canal
    return () => supabase.removeChannel(canal)
  }, [salon.id])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, enTrainEcrire])

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

  function signalerFrappe() {
    canalRef.current?.send({
      type: 'broadcast',
      event: 'frappe',
      payload: { membre_id: membre.id, pseudo: membre.pseudo },
    })
  }

  function gererSaisie(e) {
    setTexte(e.target.value)
    signalerFrappe()
  }

  async function envoyer(e) {
    e.preventDefault()
    if (!texte.trim()) return
    await supabase.from('messages').insert({ contenu: texte, membre_id: membre.id, salon_id: salon.id })
    setTexte('')
  }

  async function choisirPhoto(e) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setEnvoiPhoto(true)
    const nomFichier = `${salon.id}/${Date.now()}_${fichier.name}`
    const { error: uploadErr } = await supabase.storage.from('photos-chat').upload(nomFichier, fichier)
    if (uploadErr) { alert("Erreur lors de l'envoi de la photo."); setEnvoiPhoto(false); return }
    const { data: urlData } = supabase.storage.from('photos-chat').getPublicUrl(nomFichier)
    await supabase.from('messages').insert({ contenu: '', image_url: urlData.publicUrl, membre_id: membre.id, salon_id: salon.id })
    setEnvoiPhoto(false)
    e.target.value = ''
  }

  async function rejoindreAppel() {
    try {
      const reponse = await fetch(`/api/agora-token?channel=${salon.id}&uid=0`)
      const { token, appId } = await reponse.json()
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientAgoraRef.current = client
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'audio') user.audioTrack.play()
        setParticipantsAppel((p) => [...new Set([...p, user.uid])])
      })
      client.on('user-left', (user) => {
        setParticipantsAppel((p) => p.filter((id) => id !== user.uid))
      })
      await client.join(appId, salon.id, token, null)
      const pisteAudio = await AgoraRTC.createMicrophoneAudioTrack()
      pisteAudioRef.current = pisteAudio
      await client.publish([pisteAudio])
      setEnAppel(true)
      setParticipantsAppel([membre.id])
    } catch (err) {
      alert("Impossible de rejoindre l'appel. Vérifie que ton micro est autorisé.")
    }
  }

  async function quitterAppel() {
    pisteAudioRef.current?.close()
    await clientAgoraRef.current?.leave()
    clientAgoraRef.current = null
    setEnAppel(false)
    setMicCoupe(false)
    setParticipantsAppel([])
  }

  function couperMicro() {
    if (!pisteAudioRef.current) return
    const nouvelEtat = !micCoupe
    pisteAudioRef.current.setEnabled(!nouvelEtat)
    setMicCoupe(nouvelEtat)
  }

  useEffect(() => {
    return () => {
      pisteAudioRef.current?.close()
      clientAgoraRef.current?.leave()
    }
  }, [])

  return (
    <div style={st.page}>
      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <div style={st.avatarGroupe}>{salon.palier / 1000}</div>
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>{salon.nom}</div>
          <div style={{ fontSize: 12, color: '#9a93b5' }}>
            {enTrainEcrire.length > 0
              ? `${enTrainEcrire.map((p) => p.pseudo).join(', ')} en train d'écrire...`
              : `${nbMembres} membre${nbMembres > 1 ? 's' : ''}`}
          </div>
        </div>
        {!enAppel ? (
          <button onClick={rejoindreAppel} style={st.boutonAppel} title="Appel audio">📞</button>
        ) : (
          <div style={st.badgeAppelActif}>🔊 {participantsAppel.length}</div>
        )}
      </div>

      <div style={st.bandeauWave}>
        💳 Mises à régler via <b>Wave : {NUMERO_WAVE}</b> — règlement manuel entre joueurs
      </div>

      {enAppel && (
        <div style={st.barreAppel}>
          <span style={{ fontSize: 13 }}>📞 Appel en cours · {participantsAppel.length} participant{participantsAppel.length > 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={couperMicro} style={st.boutonMicro}>{micCoupe ? '🔇' : '🎙️'}</button>
            <button onClick={quitterAppel} style={st.boutonRaccrocher}>📵</button>
          </div>
        </div>
      )}
      <div style={st.zoneMessages}>
        {messages.map((m) => {
          const moi = m.membre_id === membre.id
          return (
            <div key={m.id} style={{ ...st.bulle, alignSelf: moi ? 'flex-end' : 'flex-start', background: moi ? 'linear-gradient(135deg,#FF4D6D,#7B2CBF)' : '#23203a', color: '#fff' }}>
              {!moi && <div style={{ fontSize: 11, fontWeight: 800, color: '#FFB800' }}>{m.membres?.pseudo || '...'}</div>}
           {m.image_url ? (
  <img src={m.image_url} alt="photo" style={st.imageMsg} />
) : (
  <span>{m.texte || m.contenu}</span>
)}
            </div>
          )
        })}
        {enTrainEcrire.length > 0 && (
          <div style={{ ...st.bulle, alignSelf: 'flex-start', background: '#23203a', fontStyle: 'italic', color: '#9a93b5' }}>
            {enTrainEcrire.map((p) => p.pseudo).join(', ')} en train d'écrire...
          </div>
        )}
        <div ref={finRef} />
      </div>
      <form onSubmit={envoyer} style={st.zoneSaisie}>
        <input type="file" accept="image/*" ref={inputFichierRef} onChange={choisirPhoto} style={{ display: 'none' }} />
        <button type="button" onClick={() => inputFichierRef.current?.click()} disabled={envoiPhoto} style={st.boutonPhoto} title="Envoyer une photo">
          {envoiPhoto ? '⏳' : '📷'}
        </button>
        <input value={texte} onChange={gererSaisie} placeholder="Écrire un message..." style={st.inputChat} />
        <button type="submit" style={st.boutonEnvoyer}>➤</button>
      </form>
    </div>
  )
}

const st = {
 page: {
  maxWidth: 430,
  margin: '0 auto',
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, rgba(34,139,34,0.45), transparent 35%), linear-gradient(135deg, #06140b 0%, #102b16 45%, #020705 100%)',
  fontFamily: "'Poppins', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
  padding: '14px 10px',
},
   barreNom: { textAlign: 'center', padding: '14px 0 0', fontWeight: 800, fontSize: 16, letterSpacing: 0.5, color: '#fff' },
  navWrap: { display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px 4px', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' },
  navBouton: { flexShrink: 0, padding: '8px 14px', borderRadius: 20, background: '#221f3b', color: '#cfc9e6', border: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', scrollSnapAlign: 'start' },
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
  carteCompte: { display: 'flex', alignItems: 'center', background: '#1d1a35', borderRadius: 14, padding: 14, marginTop: 14 },
  carteDe: { display: 'flex', alignItems: 'center', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg,#3A0CA3,#7B2CBF)', cursor: 'pointer' },
  carteLudo: { display: 'flex', alignItems: 'center', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg,#23A559,#3A86FF)', cursor: 'pointer', marginTop: 10 },
 ludoPlateauWrap: {
  background: `
    radial-gradient(circle at center, rgba(34,139,34,0.25), transparent 45%),
    linear-gradient(145deg,#2d1b0f,#1a120b,#0e1f12)
  `,
  padding: 18,
  borderRadius: 32,
  border: '4px solid #D4AF37',
  boxShadow:
    '0 0 40px rgba(0,0,0,0.7), inset 0 0 30px rgba(212,175,55,0.15)',
  position: 'relative',
  overflow: 'hidden',
},
jungleDecoration: {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  opacity: 0.15,
  backgroundImage:
    'url("https://www.transparenttextures.com/patterns/leaves.png")',
},
  ludoSvg: { width: '100%', maxWidth: 340, height: 'auto' },
  carteDeEmoji: { fontSize: 32 },
  zoneDe: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: '#1d1a35', borderRadius: 16, padding: '24px 18px', marginTop: 18 },
  deCube: { width: 88, height: 88, borderRadius: 18, background: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)', boxShadow: '0 6px 18px rgba(123,44,191,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 },
  deGrille: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', width: '100%', height: '100%' },
  dePipCase: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dePip: { width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
  regleDe: { fontSize: 13, color: '#cfc9e6', background: '#1d1a35', borderRadius: 12, padding: 12, marginTop: 18, lineHeight: 1.5 },
  bandeauWave: { background: '#1f3a2e', color: '#7CFFB2', fontSize: 12.5, padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid #2a2745' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 16 },
  modal: { background: '#1d1a35', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, maxHeight: '90vh', overflowY: 'auto' },
  modalTitre: { fontSize: 16, fontWeight: 800, marginBottom: 14, textAlign: 'center' },
  ongletAuth: { flex: 1, padding: 10, background: '#16142a', color: '#9a93b5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13 },
  ongletActif: { background: '#FF4D6D', color: '#fff' },
  input: { padding: 12, borderRadius: 10, border: '1px solid #3a3658', background: '#16142a', color: '#fff', fontSize: 15 },
  erreur: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  lienFermer: { background: 'none', border: 'none', color: '#9a93b5', marginTop: 12, width: '100%', fontSize: 13 },
  enteteChat: { display: 'flex', alignItems: 'center', padding: '16px 16px 10px', borderBottom: '1px solid #2a2745' },
  boutonAppel: { marginLeft: 'auto', background: '#23A559', border: 'none', borderRadius: '50%', width: 38, height: 38, fontSize: 16, color: '#fff' },
  badgeAppelActif: { marginLeft: 'auto', background: '#23A559', borderRadius: 14, padding: '4px 10px', fontSize: 12, fontWeight: 700 },
  barreAppel: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#15311f', borderBottom: '1px solid #2a2745' },
  boutonMicro: { background: '#23203a', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 14 },
  boutonRaccrocher: { background: '#FF4D6D', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 14 },
  retour: { background: 'none', border: 'none', fontSize: 20, color: '#fff', cursor: 'pointer' },
  zoneMessages: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 300, padding: '14px 16px' },
  bulle: { maxWidth: '75%', padding: '8px 12px', borderRadius: 14, fontSize: 14 },
  imageMsg: { maxWidth: '100%', borderRadius: 10, display: 'block' },
  zoneSaisie: { display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderTop: '1px solid #2a2745' },
  boutonPhoto: { background: 'none', border: 'none', fontSize: 20, flexShrink: 0 },
  inputChat: { flex: 1, padding: 10, borderRadius: 20, border: '1px solid #3a3658', background: '#221f3b', color: '#fff' },
  boutonEnvoyer: { background: 'linear-gradient(135deg,#FF4D6D,#7B2CBF)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, flexShrink: 0 },
}
