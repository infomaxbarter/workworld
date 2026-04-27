// Translate text into TR/EN/DE using Lovable AI Gateway
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Lang = 'tr' | 'en' | 'de';
const ALL: Lang[] = ['tr', 'en', 'de'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { text, source = 'tr', targets } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wanted: Lang[] = (Array.isArray(targets) && targets.length
      ? targets
      : ALL.filter((l) => l !== source)
    ).filter((l): l is Lang => ALL.includes(l as Lang));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langNames: Record<Lang, string> = { tr: 'Turkish', en: 'English', de: 'German' };
    const targetList = wanted.map((l) => `"${l}" (${langNames[l]})`).join(', ');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator. Translate the user text into the requested target languages. Preserve formatting, line breaks, and proper nouns. Return only via the provided tool.',
          },
          {
            role: 'user',
            content: `Source language: ${langNames[source as Lang] || source}\nTarget languages: ${targetList}\n\nText:\n${text}`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_translations',
              description: 'Return translated text per language code',
              parameters: {
                type: 'object',
                properties: Object.fromEntries(
                  wanted.map((l) => [l, { type: 'string', description: `Translation in ${langNames[l]}` }])
                ),
                required: wanted,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_translations' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error', response.status, errText);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      const msg =
        response.status === 429
          ? 'Rate limit exceeded. Please try again shortly.'
          : response.status === 402
          ? 'AI credits exhausted. Add credits in Settings → Workspace → Usage.'
          : 'Translation failed';
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};
    const result: Record<string, string> = { [source]: text };
    for (const l of wanted) result[l] = parsed[l] ?? '';

    return new Response(JSON.stringify({ translations: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('translate-content error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
