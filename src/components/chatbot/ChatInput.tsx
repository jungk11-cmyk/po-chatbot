import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onSend: (text: string) => void;
  faqKeywords: { id: string; keyword: string }[];
  onFaqClick: (id: string) => void;
}

const FAQ_LABELS: Record<string, string> = {
  ko: "다른 고객님들이 자주 묻는 질문이에요.",
  en: "Frequently asked questions from other customers.",
  zh: "其他顾客经常咨询的问题。",
  ja: "他のお客様からよく寄せられる質問です。",
};

const ChatInput = ({ onSend, faqKeywords, onFaqClick }: Props) => {
  const [text, setText] = useState("");
  const { language } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="border-t bg-card">
      {faqKeywords.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
            {FAQ_LABELS[language]}
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {faqKeywords.map((faq) => (
              <button key={faq.id} onClick={() => onFaqClick(faq.id)} className="faq-tag whitespace-nowrap flex-shrink-0">
                #{faq.keyword}
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력해주세요..."
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
