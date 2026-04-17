import type { ChatMessage } from "@/lib/chatbot-engine";

interface Props {
  message: ChatMessage;
  onButtonClick?: (id: string, label: string) => void;
  onBannerClick?: (id: string, name: string) => void;
}

const ChatBubble = ({ message, onButtonClick, onBannerClick }: Props) => {
  return (
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] ${message.type === "user" ? "chat-bubble-user" : "chat-bubble-bot"}`}>
        {message.isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: message.content }} className="text-sm leading-relaxed break-all overflow-hidden [&_a]:underline [&_a]:text-blue-600 [&_a]:break-all [&_a]:word-break-break-all" style={{ wordBreak: "break-all", overflowWrap: "anywhere" }} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {message.banners && message.banners.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {message.banners.map((b) => (
              <button key={b.id} onClick={() => onBannerClick?.(b.id, b.name)} className="chat-banner-card text-center text-xs">
                {b.icon && <span className="mr-1">{b.icon}</span>}
                {b.name}
              </button>
            ))}
          </div>
        )}

        {message.buttons && message.buttons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.buttons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => onButtonClick?.(btn.id, btn.label)}
                className="bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-[hsl(var(--gold)/0.05)] hover:from-[hsl(var(--gold))] hover:to-[hsl(var(--gold)/0.85)] text-[hsl(var(--navy))] hover:text-[hsl(var(--navy-deep))] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[hsl(var(--gold)/0.4)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
