// AI intent classifier - picks the most relevant candidates for a user query
// Does NOT generate answers; only selects which pre-written items to display.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Candidate {
  id: string;
  type: "faq" | "scenario";
  title: string;
  snippet?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, candidates, language, model } = await req.json() as {
      userMessage: string;
      candidates: Candidate[];
      language?: string;
      model?: string;
    };

    if (!userMessage || !Array.isArray(candidates) || candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: "userMessage and candidates required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chosenModel = model || "google/gemini-3-flash-preview";

    const candidateList = candidates
      .map(
        (c, i) =>
          `[${i + 1}] id="${c.id}" type=${c.type} title="${c.title}"${
            c.snippet ? ` snippet="${c.snippet.slice(0, 200)}"` : ""
          }`
      )
      .join("\n");

    const systemPrompt = `You are an intent classifier for a customer support chatbot.
The user asked a question. Below is a list of candidate answers that were retrieved by keyword matching.
Some candidates may be only loosely related due to overlapping keywords (e.g., a query about "store hours" might also match "parking" if both keywords appear).

Your job: pick ONLY the candidates that genuinely answer the user's PRIMARY intent. Usually 1, occasionally 2 if the question clearly has multiple parts.

Rules:
- Return candidate ids EXACTLY as given.
- If NONE of the candidates truly match the user's intent, return an empty array.
- Prefer fewer, more precise matches over many loose matches.
- Reply language hint: ${language || "ko"}.`;

    const userPrompt = `User question: "${userMessage}"

Candidates:
${candidateList}

Pick the candidate ids that best match the user's primary intent.`;

    const aiController = new AbortController();
    const timeoutId = setTimeout(() => aiController.abort(), 8000);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: aiController.signal,
        body: JSON.stringify({
          model: chosenModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "select_candidates",
                description: "Return the ids of the candidates that best match the user's intent.",
                parameters: {
                  type: "object",
                  properties: {
                    selected_ids: {
                      type: "array",
                      items: { type: "string" },
                      description: "Candidate ids that best match. Empty if none match.",
                    },
                    reason: {
                      type: "string",
                      description: "Short reason for the selection (for debugging).",
                    },
                  },
                  required: ["selected_ids", "reason"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "select_candidates" } },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "ai_gateway_error", status: aiResponse.status }),
        {
          status: aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await aiResponse.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "no_tool_call", raw: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    const validIds = new Set(candidates.map((c) => c.id));
    const selected_ids: string[] = (args.selected_ids || []).filter((id: string) => validIds.has(id));

    return new Response(
      JSON.stringify({ selected_ids, reason: args.reason || "" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    console.error("intent-router error:", e);
    return new Response(
      JSON.stringify({ error: isAbort ? "timeout" : (e instanceof Error ? e.message : "unknown") }),
      { status: isAbort ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
