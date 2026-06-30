import { useEffect, useState } from 'react'

const DATE_TOURNOI = '2026-12-01T00:00:00Z'

function calculerCompteARebours() {
  const maintenant = new Date().getTime()
  const cible = new Date(DATE_TOURNOI).getTime()
  const distance = Math.max(cible - maintenant, 0)

  return {
    jours: Math.floor(distance / (1000 * 60 * 60 * 24)),
    heures: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    secondes: Math.floor((distance / 1000) % 60)
  }
}

export default function PageAccueil({ onCommencer, onOuvrirTournoi }) {
  const [temps, setTemps] = useState(calculerCompteARebours())

  useEffect(() => {
    const timer = setInterval(() => {
      setTemps(calculerCompteARebours())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logo}>⚔️🎲🚀</div>

        <div style={styles.badge}>L'expérience ivoirienne en ligne</div>

        <h1 style={styles.titre}>
          DEWARI<br />
          <span style={styles.sousTitre}>abenatchai</span>
        </h1>

        <div style={styles.accroche}>
          <div>⚔️ Choisis ton quartier</div>
          <div>👀 Observe les parties en direct</div>
          <div>💬 Chat anonyme</div>
          <div style={styles.signature}>🔥 Plus qu'un jeu... une expérience ivoirienne.</div>
        </div>

        <section style={styles.carteTournoi}>
          <div style={styles.sectionBadge}>🏆Grand Tournoi National</div>


          <div style={styles.recompenses}>
            <div>🥇 1er : <strong>1 000 000 FCFA</strong></div>
            <div>🥈 2e : <strong>500 000 FCFA</strong></div>
            <div>🥉 3e : <strong>250 000 FCFA</strong></div>
          </div>


          <p style={styles.inscriptionTexte}>
           🕒 Les inscriptions seront bientôt ouvertes.
En attendant, prépare-toi pour le Grand Tournoi National !
          </p>

        <button
  style={styles.boutonTournoi}
  onClick={onOuvrirTournoi}
>
  🏆 Voir les tournois
</button>
        </section>

        <section style={styles.sectionSimple}>
          <h2 style={styles.sectionTitre}>⚔️ Tournois des quartiers</h2>

          <p style={styles.texte}>
            Chaque quartier aura son propre championnat national et international.
          </p>

          <p style={styles.texteFort}>
            👑 Les meilleurs joueurs des quartiers s'affronteront pour décrocher le titre de Roi de Déwari.
          </p>

          <div style={styles.lienQuartiers}>
            ➡️ Découvrir les quartiers
          </div>
        </section>

        <section style={styles.sectionSimple}>
          <h2 style={styles.sectionTitre}>👑 Les Rois du Jeu</h2>

          <div style={styles.rois}>
            <div>🥇 Top 1</div>
            <div>🥈 Top 2</div>
            <div>🥉 Top 3</div>
          </div>
        </section>

        <button onClick={onCommencer} style={styles.bouton}>
          ⚔️ Choisis ton quartier
        </button>

        <p style={styles.note}>
          En continuant, tu acceptes les règles, la sécurité et les conditions de la plateforme.
        </p>

        <div style={styles.footer}>CGU · Confidentialité · Règlement</div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #3b0a66, #10051f 55%, #05020c)',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    padding: 18,
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  container: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 34,
    padding: '28px 18px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
    boxShadow: '0 25px 80px rgba(0,0,0,0.48)',
    border: '1px solid rgba(255,255,255,0.12)',
    margin: 'auto 0'
  },
  logo: {
    fontSize: 56,
    marginBottom: 14
  },
  badge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(255,184,0,0.16)',
    color: '#FFD166',
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 18
  },
  titre: {
    fontSize: 40,
    lineHeight: 1.08,
    margin: '0 0 16px',
    fontWeight: 950
  },
  sousTitre: {
    fontSize: 32,
    fontWeight: 850,
    textTransform: 'lowercase'
  },
  accroche: {
    display: 'grid',
    gap: 7,
    marginBottom: 18,
    fontWeight: 850,
    fontSize: 16,
    lineHeight: 1.35
  },
  signature: {
    color: '#FFD166',
    fontWeight: 950,
    marginTop: 3
  },
  carteTournoi: {
    borderRadius: 24,
    padding: '18px 14px',
    background: 'linear-gradient(180deg, rgba(255,77,109,0.18), rgba(255,184,0,0.08))',
    border: '1px solid rgba(255,209,102,0.24)',
    marginBottom: 14
  },
  sectionBadge: {
    color: '#FFD166',
    fontSize: 18,
    fontWeight: 950,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  dateTournoi: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 12,
    fontWeight: 750
  },
  recompenses: {
    display: 'grid',
    gap: 7,
    fontSize: 15,
    marginBottom: 14
  },
  compteTitre: {
    fontSize: 13,
    color: '#FFD166',
    fontWeight: 900,
    marginBottom: 8
  },
  compteRebours: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 7,
    marginBottom: 12
  },
  caseTemps: {
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    padding: '8px 4px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  inscriptionTexte: {
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 850,
    color: '#FFD166',
    margin: '12px auto 10px'
  },
  boutonTournoi: {
    border: 'none',
    borderRadius: 18,
    padding: '13px 18px',
    width: '100%',
    maxWidth: 300,
    fontWeight: 950,
    fontSize: 14,
    color: 'white',
    background: 'linear-gradient(135deg,#FF4D6D,#FFB800)',
    boxShadow: '0 10px 24px rgba(255,77,109,0.30)',
    cursor: 'pointer'
  },
  sectionSimple: {
    borderRadius: 22,
    padding: '15px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 14
  },
  sectionTitre: {
    margin: '0 0 8px',
    fontSize: 17,
    fontWeight: 950,
    color: '#FFD166'
  },
  texte: {
    margin: '0 0 8px',
    fontSize: 14,
    lineHeight: 1.45,
    opacity: 0.88,
    fontWeight: 650
  },
  texteFort: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    fontWeight: 900
  },
  lienQuartiers: {
    marginTop: 12,
    color: '#FFD166',
    fontWeight: 950,
    fontSize: 14
  },
  rois: {
    display: 'grid',
    gap: 7,
    fontSize: 15,
    fontWeight: 850
  },
  bouton: {
    border: 'none',
    borderRadius: 22,
    padding: '17px 28px',
    width: '100%',
    maxWidth: 330,
    fontWeight: 950,
    fontSize: 17,
    color: 'white',
    background: 'linear-gradient(135deg,#FF4D6D,#FFB800)',
    boxShadow: '0 14px 30px rgba(255,77,109,0.35)',
    cursor: 'pointer',
    marginTop: 2
  },
  note: {
    fontSize: 12,
    opacity: 0.62,
    lineHeight: 1.4,
    margin: '18px auto 12px',
    maxWidth: 320
  },
  footer: {
    fontSize: 12,
    opacity: 0.75,
    fontWeight: 800
  }
}
