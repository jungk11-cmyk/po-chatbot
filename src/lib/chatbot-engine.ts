import { supabase } from "@/integrations/supabase/client";
import { LangCode, UI_TEXTS } from "@/contexts/LanguageContext";

export interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  isHtml?: boolean;
  buttons?: { id: string; label: string }[];
  banners?: { id: string; name: string; icon?: string }[];
}

const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

const STORE_CODE_MAP: Record<string, string> = {
  "여주점": "01",
  "파주점": "02",
  "부산점": "03",
  "시흥점": "05",
  "제주점": "06",
};

const getStoreCode = (storeName: string): string => STORE_CODE_MAP[storeName] || "00";

const getLocalizedBrandName = (brand: any, lang: LangCode): string => {
  if (lang === "en") return brand.brand_name_en || brand.brand_name;
  if (lang === "zh") return brand.brand_name_zh || brand.brand_name;
  if (lang === "ja") return brand.brand_name_ja || brand.brand_name;
  return brand.brand_name;
};

// Strip HTML tags for AI snippet (keep text only)
const htmlToText = (html: string): string =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

interface Candidate {
  id: string;
  type: "faq" | "scenario";
  title: string;
  snippet: string;
  message: ChatMessage;
}

/**
 * Collect candidate ChatMessages from FAQ + Scenario keyword matches.
 * Brand matches are NOT included here — they are added separately and never filtered.
 */
async function collectCandidates(
  normalizedInput: string,
  lang: LangCode,
  t: typeof UI_TEXTS[LangCode]
): Promise<Candidate[]> {
  const candidates: Candidate[] = [];

  // 1. FAQ
  const { data: faqs } = await supabase
    .from("faq_keywords")
    .select("*")
    .eq("is_active", true)
    .eq("language", lang);

  if (faqs) {
    for (const faq of faqs) {
      const allKeywords = [faq.keyword];
      const searchKw = (faq as any).search_keywords;
      if (searchKw) {
        allKeywords.push(...searchKw.split(",").map((k: string) => k.trim()));
      }
      const matched = allKeywords.some(
        (kw) => kw.length > 0 && normalizedInput.includes(normalize(kw))
      );
      if (matched) {
        const cid = crypto.randomUUID();
        candidates.push({
          id: cid,
          type: "faq",
          title: faq.keyword,
          snippet: htmlToText(faq.answer_html),
          message: {
            id: cid,
            type: "bot",
            content: faq.answer_html,
            isHtml: true,
          },
        });
      }
    }
  }

  // 2. Scenario nodes
  const { data: nodes } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("is_active", true)
    .eq("language", lang)
    .not("keywords", "is", null);

  if (nodes) {
    for (const node of nodes) {
      const keywords = node.keywords!.split(",").map((k) => k.trim());
      let matched = false;
      for (const kw of keywords) {
        if (normalizedInput.includes(normalize(kw)) && kw.length > 0) {
          matched = true;
          break;
        }
      }
      if (!matched) continue;

      if (node.answer_html) {
        const cid = crypto.randomUUID();
        candidates.push({
          id: cid,
          type: "scenario",
          title: node.label,
          snippet: htmlToText(node.answer_html),
          message: {
            id: cid,
            type: "bot",
            content: node.answer_html,
            isHtml: true,
          },
        });
      } else {
        const { data: children } = await supabase
          .from("scenario_nodes")
          .select("id, label")
          .eq("parent_id", node.id)
          .eq("is_active", true)
          .eq("language", lang)
          .order("sort_order");
        if (children && children.length > 0) {
          const cid = crypto.randomUUID();
          candidates.push({
            id: cid,
            type: "scenario",
            title: node.label,
            snippet: node.message || node.label,
            message: {
              id: cid,
              type: "bot",
              content: node.message || t.selectFromCategory(node.label),
              buttons: children.map((c) => ({ id: c.id, label: c.label })),
            },
          });
        }
      }
    }
  }

  return candidates;
}

async function getBrandMessages(
  normalizedInput: string,
  lang: LangCode,
  t: typeof UI_TEXTS[LangCode]
): Promise<ChatMessage[]> {
  const out: ChatMessage[] = [];
  const { data: brands } = await supabase
    .from("brand_tenants")
    .select("*")
    .eq("is_active", true);

  if (!brands) return out;

  const matched = brands.filter((brand: any) => {
    const names = [
      brand.brand_name,
      brand.brand_name_en,
      brand.brand_name_zh,
      brand.brand_name_ja,
    ].filter(Boolean);
    return names.some((n: string) => normalizedInput.includes(normalize(n)));
  });

  if (matched.length === 1) {
    const brand = matched[0];
    const localized = getLocalizedBrandName(brand, lang);
    const storeCode = getStoreCode(brand.store_name);
    const brandUrl = `https://app.premiumoutlets.co.kr/rpage/store/brand/category-view/${brand.tenant_code}/${storeCode}`;
    out.push({
      id: crypto.randomUUID(),
      type: "bot",
      content: t.brandSingle(localized, brand.brand_name_en, brand.store_name, brand.category, brandUrl),
      isHtml: true,
    });
  } else if (matched.length > 1) {
    const localized = getLocalizedBrandName(matched[0], lang);
    const brandNameEn = matched[0].brand_name_en;
    const storeNames = matched.map((b: any) => b.store_name).join(", ");
    const storeLinks = matched
      .map((b: any) => {
        const sc = getStoreCode(b.store_name);
        const url = `https://app.premiumoutlets.co.kr/rpage/store/brand/category-view/${b.tenant_code}/${sc}`;
        return `• <strong>${b.store_name}</strong> (${b.category})<br/>&nbsp;&nbsp;<a href="${url}" target="_blank" class="underline text-blue-600">${url}</a>`;
      })
      .join("<br/>");

    out.push({
      id: crypto.randomUUID(),
      type: "bot",
      content: t.brandMulti(localized, brandNameEn, storeNames, storeLinks),
      isHtml: true,
    });
  }

  return out;
}

export interface SearchOptions {
  aiEnabled?: boolean;
  aiModel?: string;
}

export async function searchByKeyword(
  input: string,
  lang: LangCode = "ko",
  options: SearchOptions = {}
): Promise<ChatMessage[]> {
  const normalizedInput = normalize(input);
  const t = UI_TEXTS[lang];

  const [candidates, brandMessages] = await Promise.all([
    collectCandidates(normalizedInput, lang, t),
    getBrandMessages(normalizedInput, lang, t),
  ]);

  let chosen: ChatMessage[] = candidates.map((c) => c.message);

  // AI router only kicks in for 2+ candidates
  if (options.aiEnabled && candidates.length >= 2) {
    try {
      const { data, error } = await supabase.functions.invoke("intent-router", {
        body: {
          userMessage: input,
          language: lang,
          model: options.aiModel,
          candidates: candidates.map((c) => ({
            id: c.id,
            type: c.type,
            title: c.title,
            snippet: c.snippet,
          })),
        },
      });

      if (!error && data && Array.isArray(data.selected_ids)) {
        const selectedIds: string[] = data.selected_ids;
        if (selectedIds.length > 0) {
          const idSet = new Set(selectedIds);
          const filtered = candidates
            .filter((c) => idSet.has(c.id))
            .map((c) => c.message);
          if (filtered.length > 0) {
            chosen = filtered;
          }
        }
        // If AI returned empty array, fall back to all candidates (don't drop user)
      }
    } catch (e) {
      console.warn("intent-router failed, falling back to all candidates", e);
    }
  }

  return [...chosen, ...brandMessages];
}

export async function getCategories(lang: LangCode = "ko") {
  const { data } = await supabase
    .from("chat_categories")
    .select("*")
    .eq("is_active", true)
    .eq("language", lang)
    .order("sort_order");
  return data || [];
}

export async function getChildNodes(parentId: string, lang: LangCode = "ko") {
  const { data } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .eq("language", lang)
    .order("sort_order");
  return data || [];
}

export async function getRootNodes(categoryId: string, lang: LangCode = "ko") {
  const { data } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("category_id", categoryId)
    .is("parent_id", null)
    .eq("is_active", true)
    .eq("language", lang)
    .order("sort_order");
  return data || [];
}

export async function getNodeById(nodeId: string) {
  const { data } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();
  return data;
}

export async function getFaqKeywords(lang: LangCode = "ko") {
  const { data } = await supabase
    .from("faq_keywords")
    .select("*")
    .eq("is_active", true)
    .eq("language", lang)
    .order("sort_order");
  return data || [];
}
