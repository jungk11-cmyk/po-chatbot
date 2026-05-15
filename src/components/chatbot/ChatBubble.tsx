import type { ChatMessage } from "@/lib/chatbot-engine";

interface Props {
  message: ChatMessage;
  onButtonClick?: (id: string, label: string) => void;
  onBannerClick?: (id: string, name: string) => void;
}

const ChatBubble = ({ message, onButtonClick, onBannerClick }: Props) => {
  const isUser = message.type === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}>
      <div className={`max-w-[85%] ${isUser ? "chat-bubble-user" : "chat-bubble-bot"}`}>
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
                className="bg-white hover:bg-[hsl(var(--navy))] text-[hsl(var(--navy))] hover:text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[hsl(var(--navy)/0.2)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.linkButtons && message.linkButtons.length > 0 && (
        <div className="mt-2 max-w-[85%] flex flex-wrap gap-2">
          {message.linkButtons.map((lb, i) => (
            <a
              key={i}
              href={lb.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[hsl(var(--gold-bright))] to-[hsl(var(--gold))] text-[hsl(var(--navy-deep))] text-xs font-bold px-3.5 py-2 rounded-lg shadow-[0_2px_8px_-1px_hsl(var(--gold)/0.5)] hover:shadow-[0_4px_12px_-1px_hsl(var(--gold)/0.7)] hover:-translate-y-0.5 transition-all duration-200 border border-[hsl(var(--gold)/0.4)]"
            >
              <span aria-hidden="true">🔗</span>
              {lb.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
