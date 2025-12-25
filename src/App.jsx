import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

export default function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API ${res.status}: ${t || "Request failed"}`);
      }
      const data = await res.json();
      setChat((prev) => [
        ...prev,
        { role: "user", text: input },
        { role: "assistant", text: data.reply || "(no reply)" },
      ]);
      setInput("");
    } catch (e) {
      setError(e.message || "Error contacting server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Praveena AI Chat Assistant 🤖</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minHeight: 280 }}>
        {chat.length === 0 && <p>Say hi! e.g. “What is Amazon S3?”</p>}
        {chat.map((m, i) => (
          <p key={i}>
            <strong>{m.role === "user" ? "You" : "Assistant"}:</strong> {m.text}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your question…"
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: "0 16px" }}>
          {loading ? "…" : "Send"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 8 }}>Error: {error}</p>}
      <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>API: {API_BASE}</p>
    </div>
  );
}
