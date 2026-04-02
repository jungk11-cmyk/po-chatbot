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
  searchByKeyword,
} from "@/lib/chatbot-engine";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [faqKeywords, setFaqKeywords] = useState<{ id: string; keyword: string; answer_html: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadInitial = async () => {
    const [cats, faqs] = await Promise.all([getCategories(), getFaqKeywords()]);
    setFaqKeywords(faqs);
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: "bot",
      content: "안녕하세요! 신세계사이먼 프리미엄 아울렛입니다.\n아래 항목 중 문의사항을 선택해주세요.",
      banners: cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon || undefined })),
    };
    setMessages([welcomeMsg]);
  };

  const addMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  const handleBannerClick = async (categoryId: string, name: string) => {
    addMessage({ id: crypto.randomUUID(), type: "user", content: name });
    const nodes = await getRootNodes(categoryId);
    if (nodes.length === 0) {
      addMessage({ id: crypto.randomUUID(), type: "bot", content: "등록된 항목이 없습니다." });
      return;
    }
    // Check if first node has answer directly
    const cat = (await getCategories()).find((c) => c.id === categoryId);
    addMessage({
      id: crypto.randomUUID(),
      type: "bot",
      content: `${name}에 대해 문의하실 내용을 선택해주세요.`,
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

    const children = await getChildNodes(nodeId);
    if (children.length > 0) {
      addMessage({
        id: crypto.randomUUID(),
        type: "bot",
        content: node.message || `${label} 관련 항목을 선택해주세요.`,
        buttons: children.map((c) => ({ id: c.id, label: c.label })),
      });
    } else {
      addMessage({ id: crypto.randomUUID(), type: "bot", content: "등록된 답변이 없습니다." });
    }
  };

  const handleSend = async (text: string) => {
    addMessage({ id: crypto.randomUUID(), type: "user", content: text });
    const results = await searchByKeyword(text);
    if (results.length > 0) {
      results.forEach((msg) => addMessage(msg));
    } else {
      addMessage({
        id: crypto.randomUUID(),
        type: "bot",
        content: "죄송합니다. 관련 내용을 찾을 수 없습니다.\n아래 카테고리에서 원하시는 항목을 선택해주세요.",
      });
      const cats = await getCategories();
      if (cats.length > 0) {
        addMessage({
          id: crypto.randomUUID(),
          type: "bot",
          content: "",
          banners: cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon || undefined })),
        });
      }
    }
  };

  const handleFaqClick = (id: string) => {
    const faq = faqKeywords.find((f) => f.id === id);
    if (!faq) return;
    addMessage({ id: crypto.randomUUID(), type: "user", content: `#${faq.keyword}` });
    addMessage({ id: crypto.randomUUID(), type: "bot", content: faq.answer_html, isHtml: true });
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-card shadow-xl">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
