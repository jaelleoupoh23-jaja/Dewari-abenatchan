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

  <div style={styles.messages}>
    <div style={styles.message}>
      <strong>👤 Fantôme_82</strong>
      <div>Quelqu'un pour une partie ? 🎲</div>
    </div>

    <div style={styles.message}>
      <strong>👤 King225</strong>
      <div>Moi 🔥</div>
    </div>

    <div style={styles.message}>
      <strong>👤 Shadow</strong>
      <div>J'arrive dans 2 min.</div>
    </div>
  </div>

  <input
    placeholder="Écrire un message..."
    style={styles.input}
  />

  <button style={styles.bouton}>
    Envoyer
  </button>
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
  };
  messages: {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 12,
  marginBottom: 12
},

message: {
  background: '#1d2757',
  borderRadius: 12,
  padding: 10,
  color: '#fff',
  fontSize: 13
},

input: {
  width: '100%',
  padding: 10,
  borderRadius: 10,
  border: 'none',
  marginBottom: 10,
  outline: 'none'
},

bouton: {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: 'none',
  background: '#ffb300',
  color: '#111',
  fontWeight: 'bold',
  cursor: 'pointer'
}
}
