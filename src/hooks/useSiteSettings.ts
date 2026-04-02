import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  bot_name: string;
  bot_subtitle: string;
  bot_logo_url: string;
  no_result_message: string;
}

const defaults: SiteSettings = {
  bot_name: "신세계사이먼",
  bot_subtitle: "프리미엄 아울렛 고객센터",
  bot_logo_url: "",
  no_result_message: "죄송합니다. 관련 내용을 찾을 수 없습니다.\n아래 카테고리에서 원하시는 항목을 선택해주세요.",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setSettings({
        bot_name: map.bot_name || defaults.bot_name,
        bot_subtitle: map.bot_subtitle || defaults.bot_subtitle,
        bot_logo_url: map.bot_logo_url || defaults.bot_logo_url,
        no_result_message: map.no_result_message || defaults.no_result_message,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { settings, loading, reload: load };
}
