import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function PageQuartier({ quartier, onRetour, onOuvrirChat }) {
  const [connectes, setConnectes] = useState(0);
  const [messages, setMessages] = useState([]);
  const [totalMembres, setTotalMembres] = useState(0);
  const [totalMessagesJour, setTotalMessagesJour] = useState(0);

  useEffect(() => {
    if (!quartier?.id) return;

    chargerConnectes();
    chargerMessages();
    chargerTotalMembres();
    chargerTotalMessagesJour();

    const channel = supabase
      .channel("quartier-live-" + quartier.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          chargerMessages();
          chargerTotalMessagesJour();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membres" },
        () => {
          chargerConnectes();
          chargerTotalMembres();
        }
      )
      .subscribe();

    const refresh = setInterval(() => {
      chargerConnectes();
      chargerMessages();
      chargerTotalMembres();
      chargerTotalMessagesJour();
    }, 3000);

    return () => {
      clearInterval(refresh);
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

  async function chargerTotalMembres() {
    const { count } = await supabase
      .from("membres")
      .select("*", { count: "exact", head: true })
      .eq("quartier", quartier?.nom);

    setTotalMembres(count || 0);
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

  async function chargerTotalMessagesJour() {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", quartier?.id)
      .gte("created_at", debutJour.toISOString());

    setTotalMessagesJour(count || 0);
  }

  return (
    <div style={styles.page}>
      <button onClick={onRetour} style={styles.retour}>
        ← Retour aux quartiers
      </button>

      <section style={styles.hero}>
        <div style={styles.icone}>{quartier?.icone || "⚔️"}</div>
        <h1 style={styles.titre}>{quartier?.nom || "Quartier"}</h1>
        <div style={styles.surnom}>{quartier?.surnom || "Communauté"}</div>

        <div style={styles.connectes}>👥 {connectes} connectés</div>

        <div style={styles.membres}>
          {totalMembres} membre{totalMembres > 1 ? "s" : ""}
        </div>
      </section>

      <div style={styles.carte}>
        <h2 style={styles.h2}>💬 Chat du quartier</h2>

        <div style={styles.messages}>
          {messages.length === 0 ? (
            <div style={styles.message}>
              <strong>👤 Système</strong>
              <div>Aucun message pour le moment.</div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={styles.message}>
                <strong>👤 {msg.pseudo || "Membre"}</strong>
                <div>{msg.contenu}</div>
              </div>
            ))
          )}
        </div>

        <div style={styles.statsChat}>
          🔥 {totalMessagesJour} messages aujourd’hui
        </div>

        <button onClick={() => onOuvrirChat(quartier)} style={styles.bouton}>
          Entrer dans le chat →
        </button>
      </div>

      <div style={styles.carte}>
        <h2 style={styles.h2}>🎲 Parties en cours</h2>
        <p style={styles.p}>Observe ou rejoins les matchs disponibles.</p>
      </div>

      <div style={styles.carte}>
        <h2 style={styles.h2}>🏆 Championnat</h2>
        <p style={styles.p}>
          Aucun roi pour le moment. Le premier champion sera affiché ici.
        </p>
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
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 28,
    padding: 30,
    textAlign: "center",
    marginBottom: 20
  },
  icone: { fontSize: 48, marginBottom: 14 },
  titre: { fontSize: 36, fontWeight: 950, margin: "8px 0" },
  surnom: { color: "#FFD166", fontSize: 20, fontWeight: 900, marginBottom: 16 },
  connectes: { fontSize: 20, fontWeight: 900, marginBottom: 8 },
  membres: { color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: 800 },
  carte: {
    background: "rgba(28,24,58,0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18
  },
  h2: { fontSize: 26, fontWeight: 950, marginBottom: 16 },
  messages: { display: "grid", gap: 12 },
  message: {
    background: "#22306b",
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    lineHeight: 1.4
  },
  statsChat: {
    color: "#FFD166",
    fontWeight: 900,
    fontSize: 17,
    marginTop: 16,
    marginBottom: 12
  },
  bouton: {
    width: "100%",
    background: "#FFB000",
    color: "#1b1200",
    border: "none",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer"
  },
  p: { color: "rgba(255,255,255,0.78)", fontSize: 16, lineHeight: 1.4 }
};
