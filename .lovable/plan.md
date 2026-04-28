# AI 의도 분류 라우터 도입

## 목표

현재 키워드 매칭은 "1주차 여주점 영업시간"처럼 여러 키워드가 섞이면 **주차 답변 + 영업시간 답변**을 모두 출력합니다. AI가 사용자의 진짜 의도를 파악해 **가장 적합한 1개(또는 소수)만 골라** 응답하도록 라우터를 추가합니다.

원본 시나리오/FAQ 글은 **그대로 사용** — AI는 답변을 생성하지 않고 "어떤 항목을 보여줄지"만 결정합니다. 어드민이 작성한 콘텐츠 100% 보존, 환각 위험 없음.

---

## 동작 흐름

```text
사용자 입력
   ↓
[1] 기존 키워드 매칭 → 후보 목록 (FAQ N개 + Scenario M개 + Brand)
   ↓
   ├─ 후보 0개 → no_result_message 출력 (기존과 동일)
   ├─ 후보 1개 → 그대로 출력 (AI 호출 없음, 비용 절약)
   └─ 후보 2개 이상 ↓
[2] AI 라우터 (edge function) 호출
     입력: 사용자 메시지 + 후보들의 {id, 제목/키워드, 요약}
     출력: 가장 관련 있는 항목 ID 1~2개 (tool calling으로 구조화)
   ↓
   ├─ AI 성공 → 선택된 항목만 표시
   └─ AI 실패/타임아웃 → 기존 키워드 매칭 결과 전체 폴백
```

브랜드 검색은 별도 — 브랜드명이 매칭되면 항상 함께 표시(현재 동작 유지).

---

## 변경 사항

### 1. DB: `site_settings`에 AI 토글 추가
`ai_router_enabled` (`"true"`/`"false"`), `ai_model` (기본 `google/gemini-3-flash-preview`) 키를 site_settings에 저장. 언어 무관(language=`ko`로 1행).

### 2. Edge Function: `supabase/functions/intent-router/index.ts` 신규
- 입력: `{ userMessage, candidates: [{id, type, title, snippet}], language }`
- Lovable AI Gateway에 tool calling으로 호출 → `{ selected_ids: string[], reason: string }` 구조화 출력
- 시스템 프롬프트: "사용자 질문 의도와 가장 관련 있는 후보를 1~2개 고르세요. 관련 없으면 빈 배열."
- 429/402 에러 → 클라이언트에 그대로 전달(폴백 트리거)
- `verify_jwt = false` (공개 챗봇)

### 3. `src/lib/chatbot-engine.ts` 수정
`searchByKeyword`를 두 단계로 분리:
- `collectCandidates(input, lang)` — 현재 매칭 로직 그대로, 후보 배열 반환 (FAQ + Scenario)
- `searchByKeyword(input, lang, useAI)` — 후보 수집 → 후보 ≥2개 & AI ON이면 edge function 호출 → 선택된 ID만 ChatMessage로 변환. 실패 시 전체 후보 반환.

브랜드 매칭은 분리해서 항상 그대로 추가.

### 4. `src/components/chatbot/ChatWindow.tsx` 수정
`useSiteSettings`에서 `ai_router_enabled` 읽어 `searchByKeyword`에 전달.

### 5. `src/hooks/useSiteSettings.ts` 수정
`ai_router_enabled`, `ai_model` 필드 추가.

### 6. `src/pages/admin/SettingsPage.tsx` 수정
"AI 의도 분류" 섹션 추가:
- 토글 스위치 (ON/OFF)
- 모델 선택 드롭다운 (gemini-3-flash-preview / gemini-2.5-flash-lite / gpt-5-nano)
- 안내문구: "켜면 사용자 질문을 AI가 분석해 가장 적합한 답변 1개만 보여줍니다. 꺼지면 키워드 매칭 결과를 모두 보여줍니다."
- 언어와 무관하게 전역 설정(언어 탭과 별개 영역으로 표시)

---

## 기술 메모

- **Lovable AI Gateway** (`LOVABLE_API_KEY` 이미 존재) 사용, 추가 API 키 불필요
- 기본 모델: `google/gemini-3-flash-preview` (빠르고 저렴, 분류 작업에 충분)
- Tool calling으로 구조화된 출력 보장 → JSON 파싱 안정성
- 후보 1개일 때는 AI 호출 생략 → 비용/지연 최소화
- 폴백 정책: AI 에러/타임아웃(3초) → 기존 키워드 매칭 결과 전체 표시 (사용자 답변 누락 방지)
- `mem://constraints/logic-engine` 메모리 업데이트 필요: "AI는 라우팅에만 사용, 답변 콘텐츠 생성 금지"

---

## 영향받는 파일

- `supabase/functions/intent-router/index.ts` (신규)
- `src/lib/chatbot-engine.ts`
- `src/components/chatbot/ChatWindow.tsx`
- `src/hooks/useSiteSettings.ts`
- `src/pages/admin/SettingsPage.tsx`
- DB: `site_settings`에 2개 row insert (마이그레이션)
- 메모리: `mem://constraints/logic-engine`, `mem://index.md`

승인하시면 구현하겠습니다.