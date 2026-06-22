import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
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
const HEX_COULEUR = { rouge: '#FF4D6D', vert: '#23A559', jaune: '#FFB800', bleu: '#3A86FF' }

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
  bleu: { x: 0, y: 9 },
}

const CELLULE = 22

function coordPion(couleur, pion, index) {
  if (pion.etat === 'base') return BASE_COORDS[couleur][index]
  if (pion.etat === 'parcours') return CASES_PARCOURS[pion.position]
  if (pion.etat === 'couloir') return COULOIR_COORDS[couleur][pion.position]
  return [7, 7]
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
            <div style={{ fontWeight: 800, fontSize: 16 }}>Jouer au Ludo</div>
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

const PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
}

function FaceDe({ valeur, enTrain }) {
  const actifs = new Set((PIPS[valeur] || []).map(([r, c]) => `${r}-${c}`))
  return (
    <div style={{ ...st.deCube, animation: enTrain ? 'tourneDe 0.5s linear infinite' : 'none' }}>
      <div style={st.deGrille}>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <div key={`${r}-${c}`} style={st.dePipCase}>
              {actifs.has(`${r}-${c}`) && <div style={st.dePip} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PageDe({ onRetour }) {
  const [phase, setPhase] = useState('config')
  const [nbJoueurs, setNbJoueurs] = useState(2)
  const [noms, setNoms] = useState(['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4'])
  const [scores, setScores] = useState([])
  const [tour, setTour] = useState(0)
  const [valeurAffichee, setValeurAffichee] = useState(1)
  const [dernierLancer, setDernierLancer] = useState(null)
  const [enTrainDeLancer, setEnTrainDeLancer] = useState(false)
  const [vainqueur, setVainqueur] = useState(null)
  const intervalleRef = useRef(null)

  function demarrer() {
    setScores(Array(nbJoueurs).fill(0))
    setTour(0)
    setDernierLancer(null)
    setVainqueur(null)
    setValeurAffichee(1)
    setPhase('jeu')
  }

  function lancerDe() {
    if (enTrainDeLancer || vainqueur !== null) return
    setEnTrainDeLancer(true)
    intervalleRef.current = setInterval(() => {
      setValeurAffichee(Math.floor(Math.random() * 6) + 1)
    }, 80)
    setTimeout(() => {
      clearInterval(intervalleRef.current)
  const valeur = Math.floor(Math.random() * 6) + 1
const points = valeur === 6 ? 1.5 : valeur
      setValeurAffichee(valeur)
      setScores((anciens) => {
        const nouveaux = [...anciens]
        nouveaux[tour] = nouveaux[tour] + points
        if (nouveaux[tour] >= 10) {
          setVainqueur(tour)
          setPhase('fini')
        }
        return nouveaux
      })
      setDernierLancer({ valeur, points, joueur: tour })
      setEnTrainDeLancer(false)
      setTour((t) => (t + 1) % nbJoueurs)
    }, 700)
  }

  useEffect(() => () => clearInterval(intervalleRef.current), [])

  function rejouer() {
    setPhase('config')
  }

  return (
    <div style={st.page}>
      <style>{`
        @keyframes tourneDe {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>

      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <span style={{ fontWeight: 800, marginLeft: 8, color: '#fff', fontSize: 16 }}>🎲 Le Dé</span>
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
              <input
                key={i}
                value={noms[i]}
                onChange={(e) => {
                  const copie = [...noms]
                  copie[i] = e.target.value
                  setNoms(copie)
                }}
                style={st.input}
                placeholder={`Nom du joueur ${i + 1}`}
              />
            ))}
          </div>

          <div style={st.regleDe}>
            🎲 Le Dé, c'est un mini-jeu rapide pour se défier entre amis pendant qu'on attend une partie de Ludo, ou juste pour s'amuser 5 minutes.
            <br /><br />
            Chaque lancer donne ses points normaux (1 à 5), sauf le <b>6</b> qui ne vaut que <b>1.5 point</b> — le hasard peut surprendre jusqu'au bout. Le premier à atteindre <b>10 points</b> gagne.
          </div>

          <button onClick={demarrer} style={{ ...st.boutonPrincipal, marginTop: 18 }}>
            Démarrer la partie
          </button>
        </div>
      )}

      {phase === 'jeu' && (
        <div style={st.section}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: nbJoueurs }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...st.ligneSalon,
                  background: i === tour ? '#2a2050' : '#1d1a35',
                  border: i === tour ? '1px solid #FF4D6D' : 'none',
                }}
              >
                <div style={{ flex: 1, fontWeight: 800 }}>{noms[i]}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFB800' }}>{scores[i]}</div>
              </div>
            ))}
          </div>

          <div style={st.zoneDe}>
            <FaceDe valeur={valeurAffichee} enTrain={enTrainDeLancer} />
            {dernierLancer && !enTrainDeLancer && (
              <div style={{ fontSize: 13, color: '#9a93b5', marginTop: 12 }}>
                {noms[dernierLancer.joueur]} a fait {dernierLancer.valeur} → +{dernierLancer.points} pt{dernierLancer.points > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ fontWeight: 800, marginTop: 10, fontSize: 15 }}>
              Au tour de {noms[tour]}
            </div>
            <button onClick={lancerDe} disabled={enTrainDeLancer} style={{ ...st.boutonPrincipal, marginTop: 14 }}>
              {enTrainDeLancer ? 'Lancement...' : 'Lancer le dé'}
            </button>
          </div>
        </div>
      )}

      {phase === 'fini' && vainqueur !== null && (
        <div style={st.section}>
          <div style={st.zoneDe}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{noms[vainqueur]} gagne !</div>
            <div style={{ fontSize: 14, color: '#9a93b5', marginTop: 4 }}>Score final : {scores[vainqueur]} points</div>
            <button onClick={rejouer} style={{ ...st.boutonPrincipal, marginTop: 18 }}>Rejouer</button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlateauLudo({ partie, coupsDispo, onJouerPion }) {
  const couleurCourante = partie.couleurs[partie.tourActuel]

  return (
    <svg viewBox="0 0 330 330" style={st.ludoSvg}>
      {Object.entries(ZONES_BASE).map(([couleur, z]) => (
        <rect
          key={couleur}
          x={z.x * CELLULE}
          y={z.y * CELLULE}
          width={6 * CELLULE}
          height={6 * CELLULE}
          fill={HEX_COULEUR[couleur]}
          opacity={0.18}
          rx={10}
        />
      ))}

      <rect x={6 * CELLULE} y={6 * CELLULE} width={3 * CELLULE} height={3 * CELLULE} fill="#2a2050" rx={6} />
      <text x={7.5 * CELLULE} y={7.7 * CELLULE} textAnchor="middle" fontSize="16">🏆</text>

      {Object.entries(COULOIR_COORDS).map(([couleur, cases]) =>
        cases.map(([r, c], i) => (
          <rect
            key={`${couleur}-couloir-${i}`}
            x={c * CELLULE}
            y={r * CELLULE}
            width={CELLULE}
            height={CELLULE}
            fill={HEX_COULEUR[couleur]}
            opacity={0.5}
            stroke="#16142a"
            strokeWidth={0.5}
          />
        ))
      )}

      {CASES_PARCOURS.map(([r, c], i) => (
        <rect
          key={`case-${i}`}
          x={c * CELLULE}
          y={r * CELLULE}
          width={CELLULE}
          height={CELLULE}
          fill={estCaseSecurisee(i) ? '#FFE08A' : '#f4f2fb'}
          stroke="#16142a"
          strokeWidth={0.5}
        />
      ))}

      {partie.couleurs.map((couleur) =>
        partie.pions[couleur].map((pion, index) => {
          const [r, c] = coordPion(couleur, pion, index)
          const decalage = pion.etat === 'arrivee' || pion.etat === 'parcours' ? (index % 4) * 3 : 0
          const cx = c * CELLULE + CELLULE / 2 + decalage
          const cy = r * CELLULE + CELLULE / 2 + decalage
          const jouable = couleur === couleurCourante && coupsDispo.some((cp) => cp.index === index)

          return (
            <g
              key={`${couleur}-${index}`}
              onClick={() => jouable && onJouerPion(index)}
              style={{ cursor: jouable ? 'pointer' : 'default' }}
            >
              {jouable && (
                <circle cx={cx} cy={cy} r={CELLULE / 2.1} fill="none" stroke="#fff" strokeWidth={2}>
                  <animate attributeName="r" values={`${CELLULE / 2.6};${CELLULE / 1.9};${CELLULE / 2.6}`} dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={cx} cy={cy} r={CELLULE / 2.8} fill={HEX_COULEUR[couleur]} stroke="#16142a" strokeWidth={1.5} />
            </g>
          )
        })
      )}
    </svg>
  )
}

function PageLudo({ onRetour }) {
  const [phase, setPhase] = useState('config')
  const [nbJoueurs, setNbJoueurs] = useState(2)
  const [noms, setNoms] = useState(['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4'])
  const [partie, setPartie] = useState(null)
  const [coupsDispo, setCoupsDispo] = useState([])
  const [messageTour, setMessageTour] = useState('')

  function demarrer() {
    const couleursActives = COULEURS_LUDO.slice(0, nbJoueurs)
    setPartie(creerPartie(couleursActives))
    setCoupsDispo([])
    setMessageTour('')
    setPhase('jeu')
  }

  function lancer() {
    if (!partie || coupsDispo.length > 0) return
    const resultat = lancerDe(partie)
    setPartie(resultat.partie)

    if (resultat.tourAnnule) {
      setMessageTour(`3 six d'affilée → tour annulé, au suivant !`)
      setCoupsDispo([])
    } else if (resultat.aucunCoup) {
      setMessageTour(`Dé : ${resultat.valeur} — aucun coup possible, au suivant.`)
      setCoupsDispo([])
    } else {
      setMessageTour(`Dé : ${resultat.valeur} — choisis un pion à jouer.`)
      setCoupsDispo(resultat.coups)
    }
  }

  function jouerPion(index) {
    if (!partie || !partie.dernierDe) return
    let nouvellePartie = jouerCoup(partie, index, partie.dernierDe)

    if (nouvellePartie.vainqueur) {
      setPartie(nouvellePartie)
      setCoupsDispo([])
      setPhase('fini')
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
  }

  function rejouerPartie() {
    setPartie(null)
    setPhase('config')
  }

  const couleurCourante = partie?.couleurs[partie.tourActuel]
  const indexCourant = partie ? partie.couleurs.indexOf(couleurCourante) : -1

  return (
    <div style={st.page}>
      <div style={st.enteteChat}>
        <button onClick={onRetour} style={st.retour}>←</button>
        <span style={{ fontWeight: 800, marginLeft: 8, color: '#fff', fontSize: 16 }}>🎲 Ludo</span>
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
        <div style={st.section}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {partie.couleurs.map((couleur, i) => (
              <div
                key={couleur}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 14,
                  background: i === partie.tourActuel ? '#2a2050' : '#1d1a35',
                  border: i === partie.tourActuel ? `1px solid ${HEX_COULEUR[couleur]}` : 'none',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: HEX_COULEUR[couleur] }} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{noms[i]}</span>
              </div>
            ))}
          </div>

          <div style={st.ludoPlateauWrap}>
            <PlateauLudo partie={partie} coupsDispo={coupsDispo} onJouerPion={jouerPion} />
          </div>

          <div style={st.zoneDe}>
            {messageTour && <div style={{ fontSize: 13, color: '#cfc9e6', marginBottom: 10 }}>{messageTour}</div>}
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              Au tour de <span style={{ color: HEX_COULEUR[couleurCourante] }}>{noms[indexCourant]}</span>
            </div>
            <button onClick={lancer} disabled={coupsDispo.length > 0} style={{ ...st.boutonPrincipal, marginTop: 14 }}>
              {coupsDispo.length > 0 ? 'Choisis un pion sur le plateau' : 'Lancer le dé'}
            </button>
          </div>
        </div>
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
                m.contenu
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
  page: { maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: '#16142a', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column', boxSizing: 'border-box', color: '#fff' },
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
  ludoPlateauWrap: { display: 'flex', justifyContent: 'center', background: '#0f0d20', borderRadius: 16, padding: 10 },
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
