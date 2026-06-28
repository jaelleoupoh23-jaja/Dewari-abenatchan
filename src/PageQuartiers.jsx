import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const quartiers = [
  { nom: "Yopougon", icon: "⚔️", surnom: "Les Ultras", entree: "2 500 FCFA", couleur: "#FF8A00" },
  { nom: "Abobo", icon: "🗡️", surnom: "Les Guerriers", entree: "2 500 FCFA", couleur: "#FF4D6D" },
  { nom: "Koumassi", icon: "🎯", surnom: "Les Stratèges", entree: "5 000 FCFA", couleur: "#3FA7FF" },
  { nom: "Djorobité", icon: "🚀", surnom: "La Conspi", entree: "10 000 FCFA", couleur: "#9D4EDD" },
  { nom: "Bingerville", icon: "🍃", surnom: "Les Tok-Tok", entree: "15 000 FCFA", couleur: "#52B788" },
  { nom: "Palmeraie", icon: "✨", surnom: "Les Choco", entree: "25 000 FCFA", couleur: "#FFD166" },
  { nom: "2 Plateaux", icon: "💼", surnom: "Les Boss", entree: "50 000 FCFA", couleur: "#4361EE" },
  { nom: "Beverly Hills", icon: "💎", surnom: "Le Cercle Royal", entree: "100 000 FCFA", couleur: "#F6C85F" }
];

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
}, [salons]);

  async function chargerConnectesQuartiers() {
    const resultats = {};

    for (const q of quartiers) {
      const { count } = await supabase
        .from("membres")
        .select("*", { count: "exact", head: true })
       .eq("salon_id", salons[quartiers.indexOf(q)]?.id)
.eq("is_online", true);

      resultats[q.nom] = count || 0;
    }

    setConnectesParQuartier(resultats);
  }

  return (
    <div style={styles.page}>
      <button onClick={onRetour} style={styles.retour}>
        ← Retour
      </button>

      <h1 style={styles.titre}>⚔️ Choisis ton quartier</h1>

      <p style={styles.sousTitre}>
        Rejoins ta communauté, défends ton quartier et entre dans l’ambiance.
      </p>

      <div style={styles.liste}>
        {quartiers.map((q, i) => {
          const salon = salons[i] || { id: i, nbMembres: 0 };
          const nbConnectes = connectesParQuartier[q.nom] || 0;

          return (
            <div
              key={q.nom}
              onClick={() => onChoisirSalon({ ...salon, nom: q.nom })}
              style={{
                ...styles.carte,
                borderColor: q.couleur,
                boxShadow: `0 10px 28px ${q.couleur}33`
              }}
            >
              <div style={{ ...styles.avatar, backgroundColor: q.couleur }}>
                {q.icon}
              </div>

              <div style={styles.infos}>
                <div style={styles.nom}>{q.nom}</div>
                <div style={styles.surnom}>
                  {q.icon} {q.surnom}
                </div>
                <div style={styles.detail}>
                  💰 Entrée : à partir de {q.entree}
                </div>
                <div style={styles.connectes}>
                  👥 {nbConnectes} connectés
                </div>
              </div>

              <div style={{ ...styles.fleche, color: q.couleur }}>
                →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #163b1f, #07120b 60%, #020604)",
    color: "white",
    padding: 18,
    boxSizing: "border-box",
    maxWidth: 460,
    margin: "0 auto"
  },
  retour: {
    background: "rgba(255,255,255,0.08)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    marginBottom: 18
  },
  titre: {
    fontSize: 30,
    margin: "8px 0",
    fontWeight: 950
  },
  sousTitre: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.4,
    marginBottom: 18
  },
  liste: {
    display: "grid",
    gap: 16
  },
  carte: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(28,24,58,0.95)",
    border: "2px solid",
    borderRadius: 22,
    padding: 16,
    cursor: "pointer"
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    flexShrink: 0
  },
  infos: {
    flex: 1
  },
  nom: {
    fontSize: 24,
    fontWeight: 950,
    marginBottom: 4
  },
  surnom: {
    color: "#FFD166",
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 8
  },
  detail: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 6
  },
  connectes: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: 900
  },
  fleche: {
    fontSize: 30,
    fontWeight: 900
  }
};
