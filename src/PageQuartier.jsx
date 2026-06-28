import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function PageQuartier({ quartier, onRetour, onOuvrirChat }) {
  const [connectes, setConnectes] = useState(0);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!quartier?.id) return;

    chargerConnectes();
    chargerMessages();

    const channel = supabase
      .channel("quartier-live-" + quartier.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membres" },
        () => chargerConnectes()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => chargerMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quartier?.id]);

  async function chargerConnectes() {
    const { count } = await supabase
      .from("membres")
      .select("*", { count: "exact", head: true })
      .eq("quartier", quartier?.nom)
      .eq("is_online", true);

    setConnectes(count || 0);
  }

  async function chargerMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("salon_id", quartier?.id)
      .order("created_at", { ascending: false })
      .limit(3);

    setMessages((data || []).reverse());
  }
  return (
    <div style={styles.page}>
      <button onClick={onRetour} style={styles.retour}>← Retour aux quartiers</button>

      <section style={styles.hero}>
        <div style={styles.icone}>{quartier?.icon || "⚔️"}</div>
        <h1 style={styles.titre}>{quartier?.nom || "Quartier"}</h1>
        <div style={styles.surnom}>{quartier?.surnom || "Communauté"}</div>
        <div style={styles.connectes}>👥 {connectes} connectés</div>
      </section>

      <div style={styles.grid}>
        <div
          style={{ ...styles.carte, cursor: "pointer" }}
          onClick={() => onOuvrirChat(quartier)}
        >
          <h2>💬 Chat du quartier</h2>

          <div style={styles.messages}>
            {messages.length === 0 ? (
              <div style={styles.message}>
                <strong>👤 Système</strong>
                <div>Aucun message pour le moment.</div>
              </div>
            ) : (
              messages.slice(-3).map((msg) => (
                <div key={msg.id} style={styles.message}>
                  <strong>👤 {msg.pseudo}</strong>
                  <div>{msg.contenu}</div>
                </div>
              ))
            )}
          </div>

          <div style={styles.statsChat}>
            🔥 {messages.length} messages aujourd’hui
          </div>

          <button style={styles.bouton}>
            Entrer dans le chat →
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
  hero: {
    borderRadius: 24,
    padding: 22,
    textAlign: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    marginBottom: 18
  },
  icone: {
    fontSize: 46,
    marginBottom: 12
  },
  titre: {
    fontSize: 34,
    margin: 0,
    fontWeight: 950
  },
  surnom: {
    color: "#FFD166",
    fontWeight: 900,
    fontSize: 18,
    marginTop: 6
  },
  connectes: {
    marginTop: 12,
    fontWeight: 900,
    fontSize: 18
  },
  grid: {
    display: "grid",
    gap: 12
  },
  carte: {
    borderRadius: 20,
    padding: 16,
    background: "rgba(28,24,58,0.92)",
    border: "1px solid rgba(255,255,255,0.12)"
  },
  messages: {
    display: "grid",
    gap: 10,
    marginTop: 12
  },
  message: {
    background: "#1d2757",
    borderRadius: 12,
    padding: 10,
    color: "#fff",
    fontSize: 13
  },
  statsChat: {
    marginTop: 12,
    color: "#FFD166",
    fontWeight: 900
  },
  bouton: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#ffb300",
    color: "#111",
    fontWeight: "bold",
    cursor: "pointer"
  }
};
