import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  faqKeywords: { id: string; keyword: string }[];
  onFaqClick: (id: string) => void;
}

const ChatInput = ({ onSend, faqKeywords, onFaqClick }: Props) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="border-t bg-card">
      {faqKeywords.length > 0 && (
        <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {faqKeywords.map((faq) => (
            <button key={faq.id} onClick={() => onFaqClick(faq.id)} className="faq-tag whitespace-nowrap flex-shrink-0">
              #{faq.keyword}
            </button>
          ))}
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
