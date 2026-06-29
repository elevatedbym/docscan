import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LANGUAGE_NAMES: Record<string, string> = {
  sr: "Serbian",
  hr: "Croatian",
  bs: "Bosnian",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { imageUrl, targetLanguage } = await req.json();

    if (!imageUrl || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "imageUrl and targetLanguage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langName = LANGUAGE_NAMES[targetLanguage] || "Serbian";

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GPT-4o vision: extract text from image, translate, and summarize
    const prompt = `You are a document analysis assistant. The user has uploaded a document image and wants it translated to ${langName}.

Do the following:
1. Read/extract all text visible in the document image (OCR).
2. Translate the extracted text to ${langName}.
3. Provide a concise summary in ${langName} in exactly TWO sentences:
   - First sentence: what action needs to be taken (šta uraditi)
   - Second sentence: by when / the deadline (do kada)

Return ONLY a valid JSON object with this exact structure:
{
  "translated_text": "<full translated text in ${langName}>",
  "summary": "<two-sentence summary in ${langName}>"
}

Do not include any text outside the JSON object.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code fences)
    let jsonStr = content.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in the text
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) {
        parsed = JSON.parse(objMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return new Response(
      JSON.stringify({
        translated_text: parsed.translated_text || "",
        summary: parsed.summary || "",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
