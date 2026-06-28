export default function PageQuartier({ quartier, onRetour }) {
  return (
    <div style={styles.page}>
      <button onClick={onRetour} style={styles.retour}>← Retour aux quartiers</button>

      <section style={styles.hero}>
        <div style={styles.icone}>{quartier?.icone || '⚔️'}</div>
        <h1 style={styles.titre}>{quartier?.nom || 'Quartier'}</h1>
        <div style={styles.surnom}>{quartier?.surnom || 'Communauté'}</div>
        <div style={styles.connectes}>👥 {quartier?.nbMembres || 0} connectés</div>
      </section>

      <div style={styles.grid}>
        <div style={styles.carte}>
          <h2>💬 Chat du quartier</h2>
          <p>Discute anonymement avec les joueurs de ce quartier.</p>
        </div>

        <div style={styles.carte}>
          <h2>🎲 Parties en cours</h2>
          <p>Observe ou rejoins les matchs disponibles.</p>
        </div>

        <div style={styles.carte}>
          <h2>🏆 Championnat</h2>
          <p>Le championnat de ce quartier arrive bientôt.</p>
        </div>

        <div style={styles.carte}>
          <h2>👑 Roi du quartier</h2>
          <p>Aucun roi pour le moment. Le premier champion sera affiché ici.</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #163b1f, #07120b 60%, #020604)',
    color: 'white',
    padding: 18,
    boxSizing: 'border-box',
    maxWidth: 460,
    margin: '0 auto'
  },
  retour: {
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 14,
    padding: '10px 14px',
    fontWeight: 800,
    marginBottom: 18
  },
  hero: {
    borderRadius: 24,
    padding: 22,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
    border: '1px solid rgba(255,255,255,0.12)',
    textAlign: 'center',
    marginBottom: 16
  },
  icone: {
    fontSize: 52,
    marginBottom: 8
  },
  titre: {
    fontSize: 32,
    margin: 0,
    fontWeight: 950
  },
  surnom: {
    color: '#FFD166',
    fontWeight: 900,
    fontSize: 17,
    marginTop: 4
  },
  connectes: {
    marginTop: 10,
    fontWeight: 900
  },
  grid: {
    display: 'grid',
    gap: 12
  },
  carte: {
    borderRadius: 20,
    padding: 16,
    background: 'rgba(28,24,58,0.92)',
    border: '1px solid rgba(255,255,255,0.12)'
  }
}
