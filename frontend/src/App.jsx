import React, { useEffect, useRef, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "नमस्ते! म SATHI AI (साथी एआई) हुँ। मलाई नेपालीमा जे पनि सोध्न सक्नुहुन्छ—म तपाईंको साथी बनेर मद्दत गर्न तयार छु।"
    }
  ]);

  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const baseTextRef = useRef("");
  const latestTextRef = useRef("");

  useEffect(() => {
    latestTextRef.current = input;
  }, [input]);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const sendMessageText = async (rawText) => {
    const trimmed = (rawText || "").trim();
    if (!trimmed || loading) return;

    const updatedMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    baseTextRef.current = "";
    latestTextRef.current = "";
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (isListening) {
      stopListeningOnly();
    }
    const textToSend = latestTextRef.current || input;
    await sendMessageText(textToSend);
  };

  const stopListeningOnly = () => {
    manualStopRef.current = true;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const handleVoiceSendClick = async () => {
    const textToSend = (latestTextRef.current || input).trim();
    stopListeningOnly();
    if (textToSend) {
      await sendMessageText(textToSend);
    }
  };

  const handleVoiceClick = () => {
    if (loading || isListening) return;

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
    recognition.continuous = true;
    recognition.interimResults = true;

    baseTextRef.current = latestTextRef.current ? `${latestTextRef.current.trim()} ` : "";
    manualStopRef.current = false;
    recognitionRef.current = recognition;
    setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        baseTextRef.current = `${baseTextRef.current}${finalTranscript}`;
      }

      const combined = `${baseTextRef.current}${interimTranscript}`.trimStart();
      latestTextRef.current = combined;
      setInput(combined);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        manualStopRef.current = true;
        setIsListening(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "माइक्रोफोन अनुमति दिइएको छैन। कृपया ब्राउजर सेटिङबाट माइक्रोफोन अनुमति दिनुहोस्।"
          }
        ]);
      }
    };

    recognition.onend = () => {
      if (!manualStopRef.current) {
        baseTextRef.current = latestTextRef.current
          ? `${latestTextRef.current.trim()} `
          : "";
        try {
          recognition.start();
        } catch (_) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch (_) {
      manualStopRef.current = true;
      setIsListening(false);
    }
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
          {!isListening ? (
            <button
              type="button"
              className="sathi-btn sathi-btn-voice"
              onClick={handleVoiceClick}
              disabled={loading}
              title="नेपाली भ्वाइस सुरु गर्नुहोस्"
              aria-label="नेपाली भ्वाइस सुरु गर्नुहोस्"
            >
              🎙️ माइक
            </button>
          ) : (
            <button
              type="button"
              className="sathi-btn sathi-btn-stop"
              onClick={stopListeningOnly}
              title="रेकर्डिङ रोक्नुहोस्"
              aria-label="रेकर्डिङ रोक्नुहोस्"
            >
              ⏹ Stop
            </button>
          )}

          <input
            type="text"
            className="sathi-input"
            placeholder={
              isListening
                ? "सुन्दैछु... बोलिरहनुहोस् वा Stop / Send थिच्नुहोस्"
                : "नेपालीमा केही लेख्नुहोस्..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          {isListening ? (
            <button
              type="button"
              className="sathi-btn sathi-btn-send"
              onClick={handleVoiceSendClick}
              disabled={loading}
              title="भ्वाइस सन्देश पठाउनुहोस्"
            >
              ➤ Send
            </button>
          ) : (
            <button
              type="submit"
              className="sathi-btn sathi-btn-send"
              disabled={loading}
            >
              {loading ? "..." : "पठाउनुहोस्"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
