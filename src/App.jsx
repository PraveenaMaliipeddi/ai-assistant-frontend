import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

const SUGGESTED = [
  "Explain Amazon S3 like I'm new to AWS",
  "What’s the difference between IAM Role and IAM User?",
  "Design a highly available 2-tier web app on AWS",
  "VPC vs Subnet vs Route Table — quick explanation",
  "What is CloudFront and when should I use it?",
  "RDS Multi-AZ vs Read Replica — when to use each?",
];

export default function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(true);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const isProdApi = useMemo(
    () => API_BASE && !API_BASE.includes("localhost") && !API_BASE.includes("127.0.0.1"),
    []
  );

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat, loading]);

  const pushUser = (text) => setChat((p) => [...p, { role: "user", text }]);
  const pushAssistant = (text) => setChat((p) => [...p, { role: "assistant", text }]);

  const sendMessage = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setError("");
    setConnected(true);
    setLoading(true);
    setInput("");

    pushUser(message);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API ${res.status}: ${t || "Request failed"}`);
      }

      const data = await res.json();
      pushAssistant(data?.reply || "I didn’t get a reply. Try again?");
    } catch (e) {
      setConnected(false);
      setError(e?.message || "Error contacting server.");
      pushAssistant(
        "⚠️ I couldn’t reach the server. If you just deployed the backend, it may be waking up (free tiers can sleep). Try again in 20–30 seconds."
      );
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const clearChat = () => {
    setChat([]);
    setError("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const copyLastAnswer = async () => {
    const last = [...chat].reverse().find((m) => m.role === "assistant")?.text;
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page">
      <div className="bgGlow" aria-hidden="true" />

      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">P</div>
          <div className="brandText">
            <div className="brandTitle">Praveena AI</div>
            <div className="brandSub">AWS Chat Assistant</div>
          </div>
        </div>

        <div className="sideCard">
          <div className="sideCardTitle">Suggested prompts</div>
          <div className="chips">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                className="chip"
                onClick={() => sendMessage(q)}
                disabled={loading}
                title="Send this prompt"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="sideFooter">
          <div className="metaLine">
            <span className="dotMini" data-ok={connected ? "1" : "0"} />
            <span className="metaText">
              {connected ? "Connected" : "Offline"} •{" "}
              {isProdApi ? "Production API" : "Local API"}
            </span>
          </div>
          <div className="metaSmall">
            Tip: Deploy backend on Render and set <span className="code">VITE_API_BASE</span> in
            Vercel.
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="titleBlock">
            <div className="kicker">AWS • React • Node</div>
            <h1 className="title">Ask AWS. Get answers fast.</h1>
            <p className="subtitle">
              Clean explanations for S3, IAM, VPC, EC2, RDS, CloudFront and more — perfect for your
              cert prep + portfolio.
            </p>
          </div>

          <div className="actions">
            <button className="ghost" onClick={copyLastAnswer} disabled={!chat.length}>
              Copy last answer
            </button>
            <button className="danger" onClick={clearChat} disabled={!chat.length && !error}>
              Clear chat
            </button>
          </div>
        </header>

        <section className="card">
          <div className="cardHeader">
            <div className="status">
              <span className={`statusDot ${loading ? "busy" : connected ? "ok" : "bad"}`} />
              <div className="statusText">
                <div className="statusTitle">Live Chat</div>
                <div className="statusSub">
                  {loading ? "Assistant is typing…" : connected ? "Ready" : "Reconnect and try again"}
                </div>
              </div>
            </div>

            <div className="pill" title="API base URL (for debugging)">
              {API_BASE.replace(/^https?:\/\//, "")}
            </div>
          </div>

          <div className="chat" ref={listRef}>
            {chat.length === 0 ? (
              <div className="empty">
                <div className="emptyTitle">Start with a question ✨</div>
                <div className="emptySub">
                  Try: <span className="kbd">What is Amazon S3?</span> or{" "}
                  <span className="kbd">Explain VPC peering</span>
                </div>
                <div className="emptyRow">
                  <button className="primary" onClick={() => sendMessage("What is Amazon S3?")} disabled={loading}>
                    Ask about S3
                  </button>
                  <button className="secondary" onClick={() => sendMessage("Explain IAM roles with an example")} disabled={loading}>
                    Ask about IAM
                  </button>
                </div>
              </div>
            ) : (
              chat.map((m, i) => (
                <div key={i} className={`row ${m.role === "user" ? "right" : "left"}`}>
                  <div className={`bubble ${m.role}`}>
                    <div className="bubbleTop">
                      <span className="who">{m.role === "user" ? "You" : "Assistant"}</span>
                    </div>
                    <div className="text">{m.text}</div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="row left">
                <div className="bubble assistant">
                  <div className="bubbleTop">
                    <span className="who">Assistant</span>
                  </div>
                  <div className="typing" aria-label="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            <div className="inputWrap">
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your AWS question…"
              />
              <button className="send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                {loading ? "Sending…" : "Send"}
              </button>
            </div>

            {error && <div className="error">Error: {error}</div>}

            <div className="hint">
              Press <span className="kbd">Enter</span> to send • Add backend URL to{" "}
              <span className="code">VITE_API_BASE</span> in Vercel
            </div>
          </div>
        </section>

        <footer className="footer">
          Built by Praveena • Frontend on Vercel • Backend via Node API (Render free tier)
        </footer>
      </main>
    </div>
  );
}
