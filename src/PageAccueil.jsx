export default function PageAccueil({ onCommencer }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>⚔️🎲🚀</div>

        <div style={styles.badge}>🇨🇮 L'expérience ivoirienne en ligne</div>

        <h1 style={styles.titre}>Dewari-abenatchai</h1>

      <div>⚔️ Choisis ton quartier</div>
<div>👀 Observe les parties en direct</div>
<div>💬 Discute anonymement avec la communauté</div>


        <button onClick={onCommencer} style={styles.bouton}>
          ⚔️ Choisis ton quartier
        </button>

        <p style={styles.note}>
          En continuant, tu acceptes les règles, la sécurité et les conditions de la plateforme.
        </p>

        <div style={styles.footer}>
          CGU · Confidentialité · Règlement
        </div>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    textAlign: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 34,
    padding: '34px 22px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    boxShadow: '0 25px 80px rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.12)'
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
      animation: 'floatLogo 2.8s ease-in-out infinite'
  },
  badge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(255,184,0,0.16)',
    color: '#FFD166',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 18
  },
  titre: {
    fontSize: 38,
    lineHeight: 1.1,
    margin: '0 0 14px',
    fontWeight: 950
  },
  slogan: {
    fontSize: 17,
    lineHeight: 1.45,
    opacity: 0.88,
    margin: '0 auto 24px',
    maxWidth: 340
  },
  stats: {
    display: 'grid',
    gap: 10,
    marginBottom: 26,
    fontWeight: 800,
    fontSize: 15
  },
  bouton: {
    border: 'none',
    borderRadius: 22,
    padding: '17px 28px',
    width: '100%',
    maxWidth: 310,
    fontWeight: 950,
    fontSize: 17,
    color: 'white',
    background: 'linear-gradient(135deg,#FF4D6D,#FFB800)',
    boxShadow: '0 14px 30px rgba(255,77,109,0.35)',
    cursor: 'pointer',
    animation: 'pulseButton 2s ease-in-out infinite'
  },
  note: {
    fontSize: 12,
    opacity: 0.62,
    lineHeight: 1.4,
    margin: '22px auto 14px',
    maxWidth: 320
  },
  footer: {
    fontSize: 12,
    opacity: 0.75,
    fontWeight: 700
  }
}
