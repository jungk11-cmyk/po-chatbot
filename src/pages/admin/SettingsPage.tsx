import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Save } from "lucide-react";

const SettingsPage = () => {
  const [botName, setBotName] = useState("");
  const [botSubtitle, setBotSubtitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setBotName(map.bot_name || "");
      setBotSubtitle(map.bot_subtitle || "");
      setLogoUrl(map.bot_logo_url || "");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `bot-logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("logos").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName);
      setLogoUrl(publicUrl);
      toast.success("로고가 업로드되었습니다.");
    } catch (err: any) {
      toast.error("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "bot_name", value: botName },
        { key: "bot_subtitle", value: botSubtitle },
        { key: "bot_logo_url", value: logoUrl },
      ];
      for (const u of updates) {
        await supabase.from("site_settings").update({ value: u.value }).eq("key", u.key);
      }
      toast.success("설정이 저장되었습니다.");
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-6">관리자 설정</h1>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium block mb-2">챗봇 로고</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden border-2 border-border">
              {logoUrl ? (
                <img src={logoUrl} alt="Bot logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-foreground font-bold text-lg">SS</span>
              )}
            </div>
            <div>
              <label htmlFor="logo-upload">
                <Button variant="outline" asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-1" />
                    {uploading ? "업로드 중..." : "이미지 업로드"}
                  </span>
                </Button>
              </label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <p className="text-xs text-muted-foreground mt-1">챗봇 헤더와 대화에 사용됩니다.</p>
            </div>
          </div>
          {logoUrl && (
            <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => setLogoUrl("")}>
              로고 제거
            </Button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">챗봇 이름</label>
          <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="예: 신세계사이먼" />
          <p className="text-xs text-muted-foreground mt-1">챗봇 헤더에 표시되는 이름입니다.</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">챗봇 부제</label>
          <Input value={botSubtitle} onChange={(e) => setBotSubtitle(e.target.value)} placeholder="예: 프리미엄 아울렛 고객센터" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-1" />
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
