import { useSiteSettings } from "@/hooks/useSiteSettings";

const ChatHeader = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="bg-primary px-4 py-3 flex items-center gap-3 shadow-md">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
        {settings.bot_logo_url ? (
          <img src={settings.bot_logo_url} alt="Bot logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-secondary-foreground font-bold text-sm">SS</span>
        )}
      </div>
      <div>
        <h1 className="text-primary-foreground font-semibold text-base">{settings.bot_name}</h1>
        <p className="text-primary-foreground/70 text-xs">{settings.bot_subtitle}</p>
      </div>
    </div>
  );
};

export default ChatHeader;
