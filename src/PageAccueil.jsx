export default function PageAccueil({ onCommencer }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #12051f, #1f0f3d)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      textAlign: 'center'
    }}>
      <div>
        <div style={{ fontSize: 54 }}>👑🎲</div>
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>Dewari-abenatchai</h1>
        <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 28 }}>
          Le jeu, la stratégie et le défi en ligne.
        </p>

        <button
          onClick={onCommencer}
          style={{
            border: 'none',
            borderRadius: 18,
            padding: '16px 28px',
            fontWeight: 900,
            fontSize: 16,
            color: 'white',
            background: 'linear-gradient(135deg,#FF4D6D,#FFB800)',
            cursor: 'pointer'
          }}
        >
          Commencer
        </button>
      </div>
    </div>
  )
}
