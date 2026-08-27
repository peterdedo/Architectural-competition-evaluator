// Sdílené nízkoúrovňové volání OpenAI Chat Completions přes serverový proxy (utils/openaiProxy.js).
// Používají ho: extrakce bilance z PDF, AI návrh vah, AI evaluační komentář – jediné místo, kde
// se parsuje odpověď modelu a hlídá formát JSON, aby se logika nekopírovala na třech místech.

import { postOpenAiChatCompletions } from './openaiProxy.js';

export const DEFAULT_AI_MODEL = 'gpt-5.6-luna';

/** Vytáhne JSON objekt z obsahu odpovědi modelu (ošetří ```json fence i syrový text). */
export function extractJsonFromContent(content) {
  let text = String(content || '').trim();
  if (text.startsWith('```json')) {
    text = text.replace(/```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/```\s*/, '').replace(/\s*```$/, '');
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model nevrátil platný JSON objekt.');
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    // Poslední záchrana: odstranění trailing čárek, které modely občas přidají.
    const repaired = match[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(repaired);
  }
}

/**
 * Zavolá /api/openai/chat a vrátí naparsovaný JSON obsah odpovědi (message.content jako objekt).
 * @param {Object} params
 * @param {string} [params.model]
 * @param {Array} params.messages - OpenAI Chat Completions messages (může obsahovat image_url obsah)
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 */
export async function callOpenAiChatJson({ model = DEFAULT_AI_MODEL, messages, maxTokens = 4000, temperature = 0.1 }) {
  // Novější "reasoning" modely (gpt-5.x a výš) mají jiné API: 'max_completion_tokens' místo
  // 'max_tokens' a nepodporují vlastní temperature/top_p/penalty – jen výchozí hodnoty.
  const isReasoningModel = /^gpt-[5-9]/.test(model);

  const body = isReasoningModel
    ? { model, messages, max_completion_tokens: maxTokens }
    : {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

  const response = await postOpenAiChatCompletions(body);

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData?.error?.message || errorData?.error || message;
    } catch {
      // tělo nebylo JSON – necháme statusText
    }
    throw new Error(`OpenAI API chyba: ${response.status} – ${message}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Odpověď modelu neobsahuje žádný text.');
  }
  return extractJsonFromContent(content);
}
