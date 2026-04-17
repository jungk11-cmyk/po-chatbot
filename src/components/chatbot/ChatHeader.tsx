import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage, LANGUAGES, LangCode } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown, Check } from "lucide-react";

const ChatHeader = () => {
  const { language, setLanguage } = useLanguage();
  const { settings } = useSiteSettings(language);
  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div className="relative gradient-header shadow-header overflow-hidden">
      {/* Decorative gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] gradient-gold" />
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[hsl(var(--gold)/0.15)] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl pointer-events-none" />

      <div className="relative px-4 py-3.5 flex items-center gap-3">
        {/* Logo with gold ring */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full gradient-gold blur-sm opacity-60" />
          <div className="relative w-11 h-11 rounded-full gradient-gold p-[2px] shadow-glow-gold">
            <div className="w-full h-full rounded-full bg-[hsl(var(--navy-deep))] flex items-center justify-center overflow-hidden">
              {settings.bot_logo_url ? (
                <img src={settings.bot_logo_url} alt="Bot logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-[hsl(var(--gold))] font-bold text-sm tracking-wider">SS</span>
              )}
            </div>
          </div>
          {/* Online dot */}
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[hsl(var(--navy-deep))] animate-shimmer" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-primary-foreground font-bold text-base truncate tracking-tight">
            {settings.bot_name}
          </h1>
          <p className="text-[hsl(var(--gold-light))]/80 text-[11px] truncate font-medium">
            {settings.bot_subtitle}
          </p>
        </div>

        {/* Language Selector — Gold accented */}
        <DropdownMenu>
          <DropdownMenuTrigger className="group relative flex items-center gap-1.5 px-3 py-2 rounded-full gradient-gold text-[hsl(var(--navy-deep))] text-xs font-bold shadow-glow-gold hover:scale-105 active:scale-95 transition-transform duration-200">
            <Globe className="w-3.5 h-3.5" />
            <span className="tracking-wider">{currentLang.short}</span>
            <ChevronDown className="w-3 h-3 group-data-[state=open]:rotate-180 transition-transform" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[160px] bg-popover border border-[hsl(var(--gold)/0.3)] shadow-xl rounded-xl p-1.5 mt-2"
          >
            {LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLanguage(l.code as LangCode)}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    active
                      ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--navy))] font-semibold"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? "bg-[hsl(var(--gold))] text-[hsl(var(--navy-deep))]" : "bg-muted text-muted-foreground"}`}>
                    {l.short}
                  </span>
                  <span className="flex-1">{l.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom gold gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.6)] to-transparent" />
    </div>
  );
};

export default ChatHeader;
