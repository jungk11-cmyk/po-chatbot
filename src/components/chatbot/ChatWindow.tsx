import { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import {
  type ChatMessage,
  getCategories,
  getRootNodes,
  getChildNodes,
  getNodeById,
  getFaqKeywords,
  askAgent,
} from "@/lib/chatbot-engine";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage, UI_TEXTS } from "@/contexts/LanguageContext";

const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [faqKeywords, setFaqKeywords] = useState<{ id: string; keyword: string; answer_html: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const { settings } = useSiteSettings(language);
  const t = UI_TEXTS[language];

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, settings.welcome_message]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadInitial = async () => {
    const [cats, faqs] = await Promise.all([getCategories(language), getFaqKeywords(language)]);
    setFaqKeywords(faqs);
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: "bot",
      content: settings.welcome_message,
      banners: cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon || undefined })),
    };
    setMessages([welcomeMsg]);
  };

  const addMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  const handleBannerClick = async (categoryId: string, name: string) => {
    addMessage({ id: crypto.randomUUID(), type: "user", content: name });
    const nodes = await getRootNodes(categoryId, language);
    if (nodes.length === 0) {
      addMessage({ id: crypto.randomUUID(), type: "bot", content: t.noItems });
      return;
    }
    addMessage({
      id: crypto.randomUUID(),
      type: "bot",
      content: t.selectFromCategory(name),
      buttons: nodes.map((n) => ({ id: n.id, label: n.label })),
    });
  };

  const handleButtonClick = async (nodeId: string, label: string) => {
    addMessage({ id: crypto.randomUUID(), type: "user", content: label });
    const node = await getNodeById(nodeId);
    if (!node) return;

    if (node.answer_html) {
      addMessage({ id: crypto.randomUUID(), type: "bot", content: node.answer_html, isHtml: true });
      return;
    }

    const children = await getChildNodes(nodeId, language);
    if (children.length > 0) {
      addMessage({
        id: crypto.randomUUID(),
        type: "bot",
        content: node.message || t.selectFromCategory(label),
        buttons: children.map((c) => ({ id: c.id, label: c.label })),
      });
    } else {
      addMessage({ id: crypto.randomUUID(), type: "bot", content: t.noAnswer });
    }
  };

  const handleSend = async (text: string) => {
    addMessage({ id: crypto.randomUUID(), type: "user", content: text });

    // Typing indicator
    const typingId = crypto.randomUUID();
    addMessage({ id: typingId, type: "bot", content: t.thinking || "..." });

    const results = await askAgent(text, language, { aiModel: settings.ai_model });

    // Remove typing indicator
    setMessages((prev) => prev.filter((m) => m.id !== typingId));

    if (results.length > 0) {
      results.forEach((msg) => addMessage(msg));
    } else {
      addMessage({
        id: crypto.randomUUID(),
        type: "bot",
        content: settings.no_result_message.replace(/\\n/g, "\n"),
      });
    }
  };

  const handleFaqClick = (id: string) => {
    const faq = faqKeywords.find((f) => f.id === id);
    if (!faq) return;
    addMessage({ id: crypto.randomUUID(), type: "user", content: `#${faq.keyword}` });
    addMessage({ id: crypto.randomUUID(), type: "bot", content: faq.answer_html, isHtml: true });
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-card shadow-2xl shadow-[hsl(var(--navy-deep)/0.25)] border-x border-border/50">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 gradient-bg">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onButtonClick={handleButtonClick}
            onBannerClick={handleBannerClick}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} faqKeywords={faqKeywords} onFaqClick={handleFaqClick} />
    </div>
  );
};

export default ChatWindow;
