import React, { useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "नमस्ते! म SATHI AI (साथी एआई) हुँ। मलाई नेपालीमा जे पनि सोध्न सक्नुहुन्छ—म तपाईंको साथी बनेर मद्दत गर्न तयार छु।"
    }
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const updatedMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      if (!API_BASE_URL) {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            text: "ब्याकएन्ड URL (`VITE_API_URL`) अझै जोडिएको छैन। ब्याकएन्ड तयार भएपछि यहाँबाट सिधै AI जवाफ आउनेछ।"
          }
        ]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "जवाफ ल्याउन सकिएन।");
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", text: data.reply }
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          text: `कनेक्सनमा समस्या आयो: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceClick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "यो ब्राउजरमा भ्वाइस इनपुट उपलब्ध छैन। कृपया सन्देश टाइप गर्नुहोस्।"
        }
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ne-NP";
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setInput(spoken);
    };
    recognition.start();
  };

  return (
    <div className="sathi-shell">
      <header className="sathi-header">
        <div className="sathi-brand">
          <img
            src="/sathi-ai-logo.png"
            alt="SATHI AI Logo"
            className="sathi-logo-img"
          />
          <div>
            <div className="sathi-title">SATHI AI</div>
            <div className="sathi-subtitle">SMARTER. FASTER. TOGETHER.</div>
          </div>
        </div>
        <span className="sathi-badge">Gemini Connected</span>
      </header>

      <main className="sathi-main">
        <section className="sathi-hero">
          <img
            src="/sathi-ai-logo.png"
            alt="SATHI AI"
            className="sathi-hero-logo"
          />
          <h1>साथी एआई (SATHI AI)</h1>
          <p>SMARTER. FASTER. TOGETHER.</p>
        </section>

        {messages.map((msg, index) => (
          <div key={index} className={`msg-row ${msg.role}`}>
            <div className="msg-bubble">{msg.text}</div>
          </div>
        ))}

        {loading && (
          <div className="msg-row assistant">
            <div className="msg-bubble">साथी एआई जवाफ तयार पार्दैछ...</div>
          </div>
        )}
      </main>

      <form className="sathi-input-bar" onSubmit={handleSend}>
        <div className="sathi-input-inner">
          <button
            type="button"
            className="sathi-btn sathi-btn-voice"
            onClick={handleVoiceClick}
            title="नेपाली भ्वाइस"
          >
            🎤
          </button>
          <input
            type="text"
            className="sathi-input"
            placeholder="नेपालीमा केही लेख्नुहोस्..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="sathi-btn sathi-btn-send"
            disabled={loading}
          >
            {loading ? "..." : "पठाउनुहोस्"}
          </button>
        </div>
      </form>
    </div>
  );
}
