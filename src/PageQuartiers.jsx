import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
const quartiers = [
  { nom: 'Yopougon', icone: '⚔️', surnom: 'Les Ultras', entree: '2 500 FCFA', couleur: '#FF8A00' },
  { nom: 'Abobo', icone: '💉', surnom: 'Les Guerriers', entree: '2 500 FCFA', couleur: '#FF4D6D' },
  { nom: 'Koumassi', icone: '🎯', surnom: 'Les Stratèges', entree: '5 000 FCFA', couleur: '#3FA7FF' },
  { nom: 'Djorobité', icone: '🚀', surnom: 'La Conspi', entree: '10 000 FCFA', couleur: '#9D4EDD' },
  { nom: 'Bingerville', icone: '🍃', surnom: 'Les Tok-Tok', entree: '15 000 FCFA', couleur: '#52B788' },
  { nom: 'Palmeraie', icone: '✨', surnom: 'Les Choco', entree: '25 000 FCFA', couleur: '#FFD166' },
  { nom: '2 Plateaux', icone: '💼', surnom: 'Les Boss', entree: '50 000 FCFA', couleur: '#4361EE' },
  { nom: 'Beverly Hills', icone: '💎', surnom: 'Le Cercle Royal', entree: '100 000 FCFA', couleur: '#F6C85F' }
]

export default function PageQuartiers({ salons = [], onChoisirSalon, onRetour }) {
  const [connectesParQuartier, setConnectesParQuartier] = useState({});

useEffect(() => {
  chargerConnectesQuartiers();

  const channel = supabase
    .channel("quartiers-online")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "membres" },
      () => chargerConnectesQuartiers()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

async function chargerConnectesQuartiers() {
  const resultats = {};

  for (const q of quartiers) {
    const { count } = await supabase
      .from("membres")
      .select("*", { count: "exact", head: true })
      .eq("quartier", q.nom)
      .eq("is_online", true);

    resultats[q.nom] = count || 0;
  }

  setConnectesParQuartier(resultats);
}
  return (
    <div style={styles.page}>
      <button onClick={onRetour} style={styles.retour}>← Retour</button>

      <h1 style={styles.titre}>⚔️ Choisis ton quartier</h1>
      <p style={styles.sousTitre}>
        Rejoins ta communauté, défends ton quartier et entre dans l’ambiance.
      </p>

      <div style={styles.liste}>
        {quartiers.map((q, i) => {
          const salon = salons[i] || { id: i, nbMembres: 0 }

          return (
            <div
              key={q.nom}
              onClick={() => onChoisirSalon({ ...salon, nom: q.nom })}
              style={{ ...styles.carte, borderColor: q.couleur, boxShadow: `0 10px 28px ${q.couleur}33` }}
            >
              <div style={{ ...styles.avatar, backgroundColor: q.couleur }}>{q.icone}</div>

              <div style={styles.infos}>
                <div style={styles.nom}>{q.nom}</div>
                <div style={styles.surnom}>{q.icone} {q.surnom}</div>
                <div style={styles.detail}>💰 Entrée : à partir de {q.entree}</div>
               <div style={styles.connectes}>
  👥 {connectesParQuartier[q.nom] || 0} connectés
</div>

              <div style={{ ...styles.fleche, color: q.couleur }}>→</div>
            </div>
          )
        })}
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
  titre: {
    fontSize: 26,
    margin: '0 0 6px',
    fontWeight: 950
  },
  sousTitre: {
    margin: '0 0 18px',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 1.4,
    fontWeight: 650
  },
  liste: {
    display: 'grid',
    gap: 12
  },
  carte: {
    display: 'flex',
    alignItems: 'flex-start',
    border: '2px solid',
    borderRadius: 18,
    padding: 14,
    background: 'rgba(28,24,58,0.92)',
    cursor: 'pointer'
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0
  },
  infos: {
    flex: 1,
    marginLeft: 12
  },
  nom: {
    fontSize: 18,
    fontWeight: 950
  },
  surnom: {
    color: '#FFD166',
    fontWeight: 900,
    fontSize: 14,
    marginTop: 2
  },
  detail: {
    marginTop: 7,
    fontSize: 13,
    color: '#d8d3ea',
    fontWeight: 700
  },
  connectes: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 900
  },
  fleche: {
    fontSize: 24,
    fontWeight: 950
  }
}
