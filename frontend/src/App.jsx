import React, { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "नमस्ते! म SATHI AI (साथी एआई) हुँ। अहिले थिम र इन्टरफेस तयार हुँदैछ—तपाईं नेपालीमा सन्देश लेख्न वा भ्वाइस बटन थिचेर परीक्षण गर्न सक्नुहुन्छ।"
    }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextMessages = [
      ...messages,
      { role: "user", text: trimmed },
      {
        role: "assistant",
        text: `तपाईंले भन्नुभयो: "${trimmed}" — अर्को चरणमा हामी यहाँ Google AI Studio (Gemini) API जोड्नेछौँ।`
      }
    ];
    setMessages(nextMessages);
    setInput("");
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
        <span className="sathi-badge">v0.1 UI</span>
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
          />
          <button type="submit" className="sathi-btn sathi-btn-send">
            पठाउनुहोस्
          </button>
        </div>
      </form>
    </div>
  );
}

