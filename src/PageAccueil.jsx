import { useEffect, useState } from "react"

const DATE_TOURNOI = "2026-12-01T00:00:00Z"

function calculerCompteARebours() {
  const maintenant = new Date().getTime()
  const cible = new Date(DATE_TOURNOI).getTime()
  const distance = Math.max(cible - maintenant, 0)

  return {
    jours: Math.floor(distance / (1000 * 60 * 60 * 24)),
    heures: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    secondes: Math.floor((distance / 1000) % 60),
  }
}

export default function PageAccueil({ onCommencer, onJeux, onTournoi }) {
  const [temps, setTemps] = useState(calculerCompteARebours())

  useEffect(() => {
    const timer = setInterval(() => {
      setTemps(calculerCompteARebours())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.emojis}>⚔️ 🎲 🚀</div>

        <div style={styles.badge}>L'expérience ivoirienne en ligne</div>

        <h1 style={styles.titre}>
          LUDO
          <br />
          <span style={styles.sousTitre}>abenatchai</span>
        </h1>

        <div style={styles.accroche}>
          <div>⚔️ Choisis ton quartier</div>
          <div>👀 Observe les parties en direct</div>
          <div>💬 Chat anonyme</div>
          <div style={styles.signature}>🔥 Plus qu'un jeu... une expérience ivoirienne.</div>
        </div>

        <section style={styles.carteTournoi}>
          <div style={styles.sectionBadge}>🏆 Grand Tournoi National</div>

          <div style={styles.recompenses}>
            <div>🥇 1er : <strong>1 000 000 FCFA</strong></div>
            <div>🥈 2e : <strong>500 000 FCFA</strong></div>
            <div>🥉 3e : <strong>250 000 FCFA</strong></div>
          </div>

          <p style={styles.inscriptionTexte}>
            🕒 Les inscriptions seront bientôt ouvertes.
            <br />
            En attendant, prépare-toi pour le Tournoi de Décembre !
          </p>

          <button style={styles.boutonTournoi} onClick={onTournoi}>
            🏆 Voir les tournois
          </button>
        </section>

       <section style={styles.sectionSimple}>
  <h2 style={styles.sectionTitre}>🎮 Accueil — Jouer en ligne</h2>

  <p style={styles.texte}>
    🎲 Rejoins une partie en quelques secondes.
    <br />
    👥 Crée ton salon ou rejoins un code.
    <br />
    👀 Observe les parties en direct.
  </p>

  <button onClick={onJeux} style={styles.bouton}>
    🎮 Accéder aux jeux
  </button>
</section>

<section style={styles.sectionSimple}>
  <h2 style={styles.sectionTitre}>🌍 Choisis ton quartier</h2>

  <p style={styles.texteFort}>
    Le respect se gagne quartier par quartier.
  </p>

  <p style={styles.texte}>
    🤫 Tout ce qui se passe dans ton quartier... reste dans ton quartier.
  </p>

  <p style={styles.texte}>
    🔥 <strong>Yopougon</strong> — Les Ultras
    <br />
    🕶️ <strong>Djorobité</strong> — La Conspi
    <br />
    🥁 <strong>Bingerville</strong> — Les Tok-Tok
    <br />
    ✨ <strong>...et bien d'autres quartiers t'attendent.</strong>
  </p>

  <button onClick={onCommencer} style={styles.bouton}>
    ⚔️ Choisir mon quartier
  </button>
</section>
  

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
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #3b0a66, #10051f 55%, #05020c)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px 12px",
    color: "#fff",
    fontFamily: "Poppins, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    background: "linear-gradient(180deg, #35146d, #15111f)",
    borderRadius: 28,
    padding: 22,
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,.45)",
    border: "1px solid rgba(255,255,255,.12)",
  },
  emojis: {
    fontSize: 42,
    marginBottom: 12,
  },
  badge: {
    display: "inline-block",
    background: "rgba(255, 165, 0, .25)",
    color: "#FFD166",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 14,
  },
  titre: {
    fontSize: 42,
    lineHeight: 1,
    margin: "8px 0 16px",
    fontWeight: 950,
  },
  sousTitre: {
    fontSize: 34,
    textTransform: "lowercase",
  },
  accroche: {
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.7,
    marginBottom: 22,
  },
  signature: {
    color: "#FFD166",
    marginTop: 6,
  },
  carteTournoi: {
    background: "linear-gradient(135deg, rgba(255,77,109,.45), rgba(255,190,11,.22))",
    border: "1px solid rgba(255,209,102,.45)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    boxShadow: "0 12px 35px rgba(255,77,109,.18)",
  },
  sectionBadge: {
    color: "#FFD166",
    fontSize: 20,
    fontWeight: 950,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  recompenses: {
    fontSize: 16,
    lineHeight: 1.8,
    fontWeight: 800,
    marginBottom: 14,
  },
  inscriptionTexte: {
    color: "#FFD166",
    fontWeight: 900,
    lineHeight: 1.4,
    margin: "14px 0",
  },
  boutonTournoi: {
    width: "100%",
    border: "none",
    borderRadius: 18,
    padding: "15px 18px",
    background: "linear-gradient(135deg, #FF4D6D, #FFBE0B)",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  },
  sectionSimple: {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.13)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitre: {
    color: "#FFD166",
    fontSize: 22,
    margin: "0 0 12px",
    fontWeight: 950,
  },
  texte: {
    fontSize: 15,
    lineHeight: 1.6,
    margin: "10px 0",
    fontWeight: 700,
  },
  texteFort: {
    color: "#FFD166",
    fontSize: 16,
    lineHeight: 1.5,
    margin: "10px 0",
    fontWeight: 950,
  },
  bouton: {
    width: "100%",
    border: "none",
    borderRadius: 18,
    padding: "16px 18px",
    background: "linear-gradient(135deg, #FF4D6D, #FFBE0B)",
    color: "#fff",
    fontWeight: 950,
    fontSize: 17,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(255,77,109,.3)",
  },
  note: {
    fontSize: 12,
    color: "rgba(255,255,255,.72)",
    marginTop: 18,
    lineHeight: 1.4,
  },
  footer: {
    fontSize: 12,
    color: "#FFD166",
    fontWeight: 800,
    marginTop: 8,
  },
}
