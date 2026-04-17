import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage, LANGUAGES, LangCode } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown } from "lucide-react";

const ChatHeader = () => {
  const { language, setLanguage } = useLanguage();
  const { settings } = useSiteSettings(language);
  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div className="bg-primary px-4 py-3 flex items-center gap-3 shadow-md">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
        {settings.bot_logo_url ? (
          <img src={settings.bot_logo_url} alt="Bot logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-secondary-foreground font-bold text-sm">SS</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-primary-foreground font-semibold text-base truncate">{settings.bot_name}</h1>
        <p className="text-primary-foreground/70 text-xs truncate">{settings.bot_subtitle}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-medium transition-colors">
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang.short}</span>
          <ChevronDown className="w-3 h-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px] bg-popover">
          {LANGUAGES.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLanguage(l.code as LangCode)}
              className={language === l.code ? "bg-accent font-semibold" : ""}
            >
              <span className="text-xs text-muted-foreground mr-2">{l.short}</span>
              {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatHeader;
