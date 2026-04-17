import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LangCode, UI_TEXTS } from "@/contexts/LanguageContext";

export interface SiteSettings {
  bot_name: string;
  bot_subtitle: string;
  bot_logo_url: string;
  no_result_message: string;
  welcome_message: string;
}

const buildDefaults = (lang: LangCode): SiteSettings => ({
  bot_name: lang === "ko" ? "신세계사이먼" : "Shinsegae Simon",
  bot_subtitle:
    lang === "ko"
      ? "프리미엄 아울렛 고객센터"
      : lang === "en"
      ? "Premium Outlets Customer Center"
      : lang === "zh"
      ? "名牌奥特莱斯客服中心"
      : "プレミアムアウトレット カスタマーセンター",
  bot_logo_url: "",
  no_result_message: UI_TEXTS[lang].defaultNoResult,
  welcome_message: UI_TEXTS[lang].welcome,
});

export function useSiteSettings(lang: LangCode = "ko") {
  const [settings, setSettings] = useState<SiteSettings>(buildDefaults(lang));
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const defaults = buildDefaults(lang);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value, language")
      .eq("language", lang);
    const map: Record<string, string> = {};
    if (data) {
      data.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });
    }
    setSettings({
      bot_name: map.bot_name || defaults.bot_name,
      bot_subtitle: map.bot_subtitle || defaults.bot_subtitle,
      bot_logo_url: map.bot_logo_url || defaults.bot_logo_url,
      no_result_message: map.no_result_message || defaults.no_result_message,
      welcome_message: map.welcome_message || defaults.welcome_message,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return { settings, loading, reload: load };
}
