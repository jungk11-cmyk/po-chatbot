import { supabase } from "@/integrations/supabase/client";

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

export async function searchByKeyword(input: string): Promise<ChatMessage[]> {
  const normalizedInput = normalize(input);
  const results: ChatMessage[] = [];

  // 1. Check FAQ keywords first (highest priority)
  const { data: faqs } = await supabase
    .from("faq_keywords")
    .select("*")
    .eq("is_active", true);

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
        results.push({
          id: crypto.randomUUID(),
          type: "bot",
          content: faq.answer_html,
          isHtml: true,
        });
      }
    }
  }

  // 2. Check scenario node keywords
  const { data: nodes } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("is_active", true)
    .not("keywords", "is", null);

  if (nodes) {
    for (const node of nodes) {
      const keywords = node.keywords!.split(",").map((k) => k.trim());
      for (const kw of keywords) {
        if (normalizedInput.includes(normalize(kw)) && kw.length > 0) {
          if (node.answer_html) {
            results.push({
              id: crypto.randomUUID(),
              type: "bot",
              content: node.answer_html,
              isHtml: true,
            });
          } else {
            const { data: children } = await supabase
              .from("scenario_nodes")
              .select("id, label")
              .eq("parent_id", node.id)
              .eq("is_active", true)
              .order("sort_order");
            if (children && children.length > 0) {
              results.push({
                id: crypto.randomUUID(),
                type: "bot",
                content: node.message || `${node.label} 관련 항목입니다.`,
                buttons: children.map((c) => ({ id: c.id, label: c.label })),
              });
            }
          }
          break;
        }
      }
    }
  }

  // 3. Check brand tenants
  const { data: brands } = await supabase
    .from("brand_tenants")
    .select("*")
    .eq("is_active", true);

  if (brands) {
    const matched = brands.filter(
      (brand) =>
        normalizedInput.includes(normalize(brand.brand_name)) ||
        normalizedInput.includes(normalize(brand.brand_name_en))
    );

    if (matched.length === 1) {
      const brand = matched[0];
      const storeCode = getStoreCode(brand.store_name);
      const brandUrl = `https://app.premiumoutlets.co.kr/rpage/store/brand/category-view/${brand.tenant_code}/${storeCode}`;
      results.push({
        id: crypto.randomUUID(),
        type: "bot",
        content: `네~ <strong>${brand.brand_name}</strong>(${brand.brand_name_en})이(가) <strong>${brand.store_name}</strong>에 입점해 있습니다.<br/>카테고리: ${brand.category}<br/>자세한 브랜드 정보는 아래 링크를 클릭해주세요.<br/><a href="${brandUrl}" target="_blank" class="underline text-blue-600">${brandUrl}</a>`,
        isHtml: true,
      });
    }

    if (matched.length > 1) {
      const brandName = matched[0].brand_name;
      const brandNameEn = matched[0].brand_name_en;
      const storeNames = matched.map((b) => b.store_name).join(", ");
      const storeLinks = matched
        .map((b) => {
          const sc = getStoreCode(b.store_name);
          const url = `https://app.premiumoutlets.co.kr/rpage/store/brand/category-view/${b.tenant_code}/${sc}`;
          return `• <strong>${b.store_name}</strong> (${b.category})<br/>&nbsp;&nbsp;<a href="${url}" target="_blank" class="underline text-blue-600">${url}</a>`;
        })
        .join("<br/>");

      results.push({
        id: crypto.randomUUID(),
        type: "bot",
        content: `네~ <strong>${brandName}</strong>(${brandNameEn})이(가) [${storeNames}]에 입점해 있습니다.<br/>각 점포의 상세 정보는 아래 링크를 확인해주세요.<br/><br/>${storeLinks}`,
        isHtml: true,
      });
    }
  }

  return results;
}

export async function getCategories() {
  const { data } = await supabase
    .from("chat_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getChildNodes(parentId: string) {
  const { data } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getRootNodes(categoryId: string) {
  const { data } = await supabase
    .from("scenario_nodes")
    .select("*")
    .eq("category_id", categoryId)
    .is("parent_id", null)
    .eq("is_active", true)
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

export async function getFaqKeywords() {
  const { data } = await supabase
    .from("faq_keywords")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}
