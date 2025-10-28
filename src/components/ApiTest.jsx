import React, { useState, useEffect, useCallback } from 'react';
import {
  getOpenAiModels,
  postOpenAiChatCompletions,
  getOpenAiHealth,
  OPENAI_PROXY_DIAG_VERSION,
  OPENAI_MODELS_LIST_DISABLED_CODE,
  OPENAI_CHAT_PAYLOAD_TOO_LARGE_CODE,
  OPENAI_CHAT_MODEL_NOT_ALLOWED_CODE,
  OPENAI_CHAT_MODEL_MISSING_CODE,
} from '../utils/openaiProxy';

/**
 * Parsuje JSON tělo chyby z proxy (lokální i Vercel) – očekává tvar { error: { code?, message?, details? } }.
 */
async function parseProxyErrorResponse(response) {
  const text = await response.text();
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      status: response.status,
      code: null,
      message: text.slice(0, 400) || response.statusText,
      hint: null,
      rawPreview: text.slice(0, 200),
    };
  }
  const err = parsed.error || {};
  return {
    status: response.status,
    code: err.code || null,
    message: err.message || response.statusText,
    hint: err.details?.hint || null,
    rawPreview: null,
  };
}

/**
 * Chybějící klíč: nové proxy posílá error.code === OPENAI_KEY_MISSING.
 * Starší openai-proxy vracelo jen error.message (např. „…is not set (use .env in project root)“) bez code –
 * pak UI dřív skládalo „Test modelů… (503: celá message)“.
 */
function isOpenAiKeyMissingResponse(parsed) {
  if (parsed.code === 'OPENAI_KEY_MISSING') return true;
  if (parsed.status !== 503) return false;
  const msg = String(parsed.message || '');
  return (
    /OPENAI_API_KEY is not set/i.test(msg) ||
    /not configured on the server/i.test(msg) ||
    /OPENAI_KEY_MISSING/i.test(msg)
  );
}

function buildRecommendation(parsed, { isNetworkError = false } = {}) {
  if (isNetworkError) {
    return {
      title: 'Nelze se spojit s lokálním proxy',
      text:
        'Spusťte z kořene projektu npm run dev (spouští zároveň Vite i openai-proxy na 127.0.0.1:8792, nebo dle OPENAI_PROXY_PORT v .env). ' +
        'Příkaz npm run dev:vite spouští jen frontend – bez proxy endpoint /api/openai nebude fungovat. ' +
        'Zkontrolujte také, že nic neblokuje zvolený port proxy.',
    };
  }

  if (isOpenAiKeyMissingResponse(parsed)) {
    return {
      title: 'Chybí OPENAI_API_KEY',
      text:
        parsed.hint ||
        'V kořenovém adresáři projektu vytvořte soubor .env nebo .env.local s řádkem OPENAI_API_KEY=sk-... ' +
        'Starší dokumentace zmiňovala VITE_OPENAI_KEY – lokální Node proxy čte pouze OPENAI_API_KEY. ' +
        'Hláška „use .env in project root“ pochází ze starší verze lokálního proxy – zastavte všechny instance npm run dev / node server/openai-proxy.mjs a spusťte znovu z aktuálního repozitáře. ' +
        'Po změně .env vždy proxy restartujte. Viz .env.example a v terminálu řádek „Kořen pro .env“.',
    };
  }

  if (parsed.code === 'PROXY_UPSTREAM_ERROR' || parsed.status === 502) {
    return {
      title: 'Chyba mezi proxy a OpenAI',
      text:
        parsed.hint ||
        'Proxy běží, ale volání na api.openai.com selhalo (síť, DNS nebo výpadek). Zkuste to později.',
    };
  }

  if (parsed.code === OPENAI_MODELS_LIST_DISABLED_CODE) {
    return {
      title: 'Výpis modelů na serveru vypnutý',
      text:
        parsed.hint ||
        'Na tomto nasazení je GET /api/openai/models z bezpečnostních důvodů vypnutý. Tlačítko „Testovat API“ přesto může zkusit chat; pokud selže jen krok modelů, není to chyba klíče v prohlížeči.',
    };
  }

  if (parsed.code === OPENAI_CHAT_PAYLOAD_TOO_LARGE_CODE || parsed.status === 413) {
    return {
      title: 'Příliš velké tělo chat požadavku',
      text:
        parsed.hint ||
        'Proxy odmítla požadavek – překročen limit velikosti JSON (viz OPENAI_CHAT_MAX_BODY_BYTES). U vision PDF zmenšete počet stránek v jednom volání.',
    };
  }

  if (parsed.code === OPENAI_CHAT_MODEL_NOT_ALLOWED_CODE || parsed.code === OPENAI_CHAT_MODEL_MISSING_CODE) {
    return {
      title:
        parsed.code === OPENAI_CHAT_MODEL_MISSING_CODE
          ? 'Chybí pole model v požadavku'
          : 'Model není na serveru povolený',
      text:
        parsed.hint ||
        'Proxy povoluje jen modely z allowlistu (výchozí gpt-4o, gpt-4o-mini). Na serveru lze nastavit OPENAI_CHAT_ALLOWED_MODELS.',
    };
  }

  const msg = String(parsed.message || '');
  if (msg.includes('401') || parsed.status === 401) {
    return {
      title: 'Neautorizováno (401)',
      text:
        'OPENAI_API_KEY je neplatný nebo odvolaný. Ověřte klíč v OpenAI dashboardu a .env v kořenu projektu.',
    };
  }
  if (msg.includes('403') || parsed.status === 403) {
    return {
      title: 'Zakázáno (403)',
      text: 'Klíč nemá oprávnění nebo účet nemá billing. Zkontrolujte OpenAI účet.',
    };
  }
  if (msg.includes('429') || parsed.status === 429) {
    const retryMatch = msg.match(/za (\d+) sekund/);
    if (retryMatch) {
      return {
        title: 'Limit požadavků (429)',
        text: `Zkuste to znovu za ${retryMatch[1]} s. Jedná se o dočasné omezení OpenAI.`,
      };
    }
    return {
      title: 'Limit požadavků (429)',
      text: 'Počkejte 1–2 minuty a zkuste test znovu.',
    };
  }
  if (msg.includes('500') || parsed.status === 500) {
    return {
      title: 'Chyba serveru (500)',
      text: 'OpenAI nebo proxy vrátila 500. Zkuste to později; při lokálním vývoji zkontrolujte výstup terminálu u proxy.',
    };
  }

  return {
    title: 'Obecná chyba',
    text:
      parsed.hint ||
      (parsed.rawPreview
        ? `Neočekávaná odpověď (${parsed.status}). Zkontrolujte konzoli a Network záložku.`
        : 'Zkontrolujte připojení k internetu, stav proxy a znovu spusťte test.'),
  };
}

/** Styl status chipu v diagnostice proxy */
const DIAG_CHIP_CLASS = {
  success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  warning: 'bg-amber-100 text-amber-900 border-amber-300',
  danger: 'bg-red-100 text-red-900 border-red-300',
  muted: 'bg-slate-100 text-slate-800 border-slate-300',
};

/**
 * Mapuje odpověď GET /api/openai/health na srozumitelný stav pro UI (bez změny kontraktu serveru).
 * @param {Response} res
 * @param {string} text
 * @param {string} expectedDiagVersion např. OPENAI_PROXY_DIAG_VERSION
 */
function interpretOpenAiHealthResult(res, text, expectedDiagVersion) {
  if (res.ok) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        outcome: 'error',
        chipVariant: 'danger',
        chipTitle: 'Neplatná odpověď /health',
        detail: 'HTTP 200, ale tělo není platný JSON. Zkontrolujte Network → Response.',
        payload: null,
      };
    }
    if (!data || typeof data !== 'object' || data.mode == null || data.proxyVersion == null) {
      return {
        outcome: 'error',
        chipVariant: 'danger',
        chipTitle: 'Neočekávaný tvar /health',
        detail: 'Chybí pole mode nebo proxyVersion — server neodpovídá aktuálnímu kontraktu.',
        payload: null,
      };
    }

    const hasKey = Boolean(data.hasOpenAiKey);
    const versionMatch = data.proxyVersion === expectedDiagVersion;
    if (!versionMatch) {
      return {
        outcome: 'success',
        chipVariant: 'warning',
        chipTitle: 'Proxy odpovídá — neaktuální verze kontraktu',
        detail: `Server hlásí proxyVersion „${String(data.proxyVersion)}“, aplikace očekává „${expectedDiagVersion}“. Nasaďte / restartujte proxy z aktuálního repozitáře — jinak může jít o starý proces nebo starý deploy.${
          !hasKey ? ' V prostředí proxy navíc chybí OPENAI_API_KEY.' : ''
        }`,
        payload: data,
      };
    }
    return {
      outcome: 'success',
      chipVariant: hasKey ? 'success' : 'warning',
      chipTitle: hasKey
        ? 'Běží aktuální proxy — klíč je nastaven'
        : 'Běží aktuální proxy — chybí OPENAI_API_KEY',
      detail: hasKey
        ? null
        : 'Proxy odpověděla správně (HTTP 200, diagnostický JSON). Doplňte OPENAI_API_KEY do .env / .env.local v kořenu projektu a restartujte npm run dev, nebo proměnnou na Vercel.',
      payload: data,
    };
  }

  let errBody = null;
  try {
    errBody = JSON.parse(text);
  } catch {
    /* ignore */
  }
  const errMsg = String(errBody?.error?.message ?? '');
  const legacyHealth503 =
    res.status === 503 &&
    /OPENAI_API_KEY is not set/i.test(errMsg) &&
    (/use \.env in project root/i.test(errMsg) || errBody?.error?.code == null);

  if (errBody?.error?.code === 'OPENAI_KEY_MISSING' || legacyHealth503) {
    const newStyleGuard = errBody?.error?.code === 'OPENAI_KEY_MISSING' && !legacyHealth503;
    return {
      outcome: 'error',
      chipVariant: 'danger',
      chipTitle: 'Starý nebo nekompatibilní lokální proxy',
      detail: newStyleGuard
        ? 'GET /api/openai/health vrátilo 503 s OPENAI_KEY_MISSING — typicky běží starý openai-proxy (často na portu 8788), který kontroluje klíč dřív než /health. Aktuální výchozí port v tomto repozitáři je 8792 — zastavte npm run dev a spusťte znovu; v terminálu musí být banner openai-diag-v2. Pokud máte v .env OPENAI_PROXY_PORT=8788, smažte ho nebo srovnejte s vite.config (stejná hodnota).'
        : 'GET /api/openai/health vrátilo 503 s hláškou o chybějícím klíči (často „use .env in project root“, bez error.code). To neodpovídá aktuálnímu server/openai-proxy.mjs (/health = vždy 200). Nejde o správnou novou proxy — buď starý proces (často 8788), nebo Vite stále proxyuje na špatný port (ověřte OPENAI_PROXY_PORT a výchozí 8792).',
      payload: null,
    };
  }

  if (res.status === 404) {
    return {
      outcome: 'error',
      chipVariant: 'danger',
      chipTitle: 'Starý proxy nebo špatná cesta',
      detail:
        'GET /api/openai/health → 404. Endpoint neexistuje na procesu za Vite — pravděpodobně starší openai-proxy bez /health nebo špatná URL. Aktualizujte a restartujte proxy z tohoto repozitáře.',
      payload: null,
    };
  }

  return {
    outcome: 'error',
    chipVariant: 'muted',
    chipTitle: 'Diagnostika /health nedokončena',
    detail: `HTTP ${res.status}. Zkontrolujte Network. Náhled těla: ${text.slice(0, 280)}`,
    payload: null,
  };
}

/** Testuje serverový proxy (/api/openai/*) a OPENAI_API_KEY na serveri – nie kľúč v prehliadači. */
const ApiTest = ({ onTestComplete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testProgress, setTestProgress] = useState(0);

  const [diagLoading, setDiagLoading] = useState(true);
  /** Jednotný panel: chip + volitelný detail + volitelný payload (technické řádky) */
  const [diagPanel, setDiagPanel] = useState(null);

  const refreshDiagnostics = useCallback(async () => {
    setDiagLoading(true);
    setDiagPanel(null);
    try {
      const res = await getOpenAiHealth();
      const text = await res.text();
      const interpreted = interpretOpenAiHealthResult(res, text, OPENAI_PROXY_DIAG_VERSION);
      setDiagPanel({
        ...interpreted,
        httpStatus: res.status,
      });
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Failed to fetch') {
        setDiagPanel({
          outcome: 'error',
          chipVariant: 'danger',
          chipTitle: 'Proxy není dostupná',
          detail:
            'Prohlížeč se nepřipojil k /api/openai/health (Failed to fetch). Spusťte npm run dev (Vite + proxy), ne jen npm run dev:vite. Výchozí port proxy je 8792 (viz terminál u proxy). EADDRINUSE = port obsazený — postup v README nebo výpis v terminálu.',
          payload: null,
          httpStatus: null,
        });
      } else {
        setDiagPanel({
          outcome: 'error',
          chipVariant: 'muted',
          chipTitle: 'Diagnostika selhala',
          detail: e instanceof Error ? e.message : String(e),
          payload: null,
          httpStatus: null,
        });
      }
    } finally {
      setDiagLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  const testOpenAIConnection = async () => {
    setIsTesting(true);
    setTestProgress(0);
    setTestResult(null);

    try {
      setTestProgress(20);
      const modelsResponse = await getOpenAiModels();

      let modelsListSkipped = false;
      let modelsData = null;
      let hasGpt4o = false;
      let availableModels = [];

      if (!modelsResponse.ok) {
        const parsed = await parseProxyErrorResponse(modelsResponse);
        if (parsed.code === OPENAI_MODELS_LIST_DISABLED_CODE) {
          modelsListSkipped = true;
        } else {
          const rec = buildRecommendation(parsed);
          throw { __proxyError: true, parsed, rec };
        }
      } else {
        modelsData = await modelsResponse.json();
        if (!Array.isArray(modelsData.data)) {
          throw new Error('Neočekávaný formát odpovědi models: chybí pole data');
        }

        hasGpt4o = modelsData.data.some(
          (model) =>
            model.id.includes('gpt-4o') ||
            model.id.includes('gpt-4-vision') ||
            model.id.includes('gpt-4o-vision')
        );

        availableModels = modelsData.data.filter(
          (model) => model.id.includes('gpt-4') && !model.id.includes('instruct')
        );
      }

      // Proxy přijímá jen přesné aliasy gpt-4o / gpt-4o-mini — nikdy ID z /models (gpt-4-0613, gpt-4o-2024-…).
      const allIds = modelsListSkipped ? [] : (modelsData?.data ?? []).map((m) => m.id);
      const accountHasGpt4oAlias = allIds.some(
        (id) => id === 'gpt-4o' || (id.startsWith('gpt-4o-') && !id.includes('mini'))
      );
      const modelForProxyTest = modelsListSkipped || !accountHasGpt4oAlias ? 'gpt-4o-mini' : 'gpt-4o';

      setTestProgress(50);
      setTestProgress(70);

      const testResponse = await postOpenAiChatCompletions({
        model: modelForProxyTest,
        messages: [
          {
            role: 'user',
            content: 'Odpověz pouze "API funguje"',
          },
        ],
        max_tokens: 10,
      });

      if (!testResponse.ok) {
        if (testResponse.status === 429) {
          const retryAfter = testResponse.headers.get('Retry-After');
          const errorDetails = retryAfter
            ? `Limit překročen. Zkuste to za ${retryAfter} sekund.`
            : 'Limit překročen. Zkuste to později.';
          throw new Error(`Test volání selhal: ${testResponse.status} - ${errorDetails}`);
        }
        const parsed = await parseProxyErrorResponse(testResponse);
        const rec = buildRecommendation(parsed);
        throw { __proxyError: true, parsed, rec, phase: 'chat' };
      }

      const testData = await testResponse.json();
      setTestProgress(100);

      setTestResult({
        success: true,
        message: modelsListSkipped
          ? 'Serverový proxy funguje – chat odpověděl (výpis /models je na tomto nasazení vypnutý, to je očekávané na Vercel).'
          : 'Serverový proxy funguje – OPENAI_API_KEY je načten a OpenAI odpovídá.',
        details: {
          modelsListSkipped,
          modelsCount: modelsListSkipped ? null : modelsData.data.length,
          hasGpt4oVision: modelsListSkipped ? null : hasGpt4o,
          testModel: modelForProxyTest,
          testResponse: testData.choices[0]?.message?.content || 'N/A',
          availableGpt4Models: modelsListSkipped ? null : availableModels.length,
        },
      });

      if (onTestComplete) {
        onTestComplete(true);
      }
    } catch (error) {
      console.error('API test chyba:', error);

      if (error?.__proxyError) {
        const { parsed, rec, phase } = error;
        const technical = `${parsed.status}${parsed.code ? `, ${parsed.code}` : ''}: ${parsed.message}`;
        const friendlyHeadline = isOpenAiKeyMissingResponse(parsed)
          ? 'Lokální proxy odpověděla, ale v jejím prostředí není OPENAI_API_KEY (HTTP 503). To není chyba prohlížeče ani CORS.'
          : null;
        setTestResult({
          success: false,
          message:
            friendlyHeadline ||
            (phase === 'chat'
              ? `Chat test přes proxy selhal (${technical})`
              : `Test modelů přes proxy selhal (${technical})`),
          details: {
            error: isOpenAiKeyMissingResponse(parsed)
              ? 'HTTP 503 – v procesu openai-proxy není nastavený OPENAI_API_KEY (tělo odpovědi z proxy může být ze starší verze – viz doporučení).'
              : parsed.message,
            code: parsed.code || (isOpenAiKeyMissingResponse(parsed) ? 'OPENAI_KEY_MISSING' : null),
            recommendationTitle: rec.title,
            recommendationText: rec.text,
          },
        });
      } else {
        const isNetwork =
          error instanceof TypeError &&
          (error.message === 'Failed to fetch' ||
            /network|fetch/i.test(error.message || ''));

        const rec = buildRecommendation(
          { status: 0, message: error.message, code: null, hint: null },
          { isNetworkError: isNetwork }
        );

        setTestResult({
          success: false,
          message: `Chyba při testování API: ${error.message}`,
          details: {
            error: error.message,
            recommendationTitle: rec.title,
            recommendationText: rec.text,
          },
        });
      }

      if (onTestComplete) {
        onTestComplete(false);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const diagPayload = diagPanel?.payload ?? null;
  const diagVersionMismatch =
    diagPayload &&
    typeof diagPayload.proxyVersion === 'string' &&
    diagPayload.proxyVersion !== OPENAI_PROXY_DIAG_VERSION;
  const diagChipVariant = diagPanel?.chipVariant ?? 'muted';

  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-800">Diagnostika proxy</h4>
          <button
            type="button"
            onClick={refreshDiagnostics}
            disabled={diagLoading}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {diagLoading ? 'Načítám…' : 'Obnovit'}
          </button>
        </div>
        {diagLoading && <p className="text-slate-500">Kontroluji GET /api/openai/health…</p>}
        {!diagLoading && diagPanel && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DIAG_CHIP_CLASS[diagChipVariant] || DIAG_CHIP_CLASS.muted}`}
              >
                {diagPanel.chipTitle}
              </span>
              {diagPanel.httpStatus != null && (
                <span className="text-xs text-slate-500 font-mono">HTTP {diagPanel.httpStatus}</span>
              )}
            </div>
            {diagPanel.detail && (
              <p
                className={`text-sm rounded-md border px-2 py-1.5 mb-2 ${
                  diagPanel.chipVariant === 'danger'
                    ? 'bg-red-50 border-red-200 text-red-950'
                    : diagPanel.chipVariant === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {diagPanel.detail}
              </p>
            )}
            {diagPayload && (
              <ul className="space-y-1 text-xs sm:text-sm font-mono text-slate-800 border-t border-slate-100 pt-2">
                <li>
                  • Režim: <strong>{diagPayload.mode}</strong>{' '}
                  {diagPayload.mode === 'local-proxy'
                    ? '(Node openai-proxy přes Vite)'
                    : diagPayload.mode === 'serverless'
                      ? '(Vercel api/openai/*)'
                      : ''}
                </li>
                <li>
                  • Verze kontraktu: <strong>{String(diagPayload.proxyVersion)}</strong>{' '}
                  <span className="text-slate-500">(frontend očekává {OPENAI_PROXY_DIAG_VERSION})</span>
                </li>
                {diagVersionMismatch && (
                  <li className="text-amber-800 font-sans text-xs sm:text-sm">
                    ⚠ Verze se neshoduje s aplikací — aktualizujte / restartujte proxy nebo nasaďte nový
                    serverless kód (jinak můžete mít starý proces nebo zastaralý deploy).
                  </li>
                )}
                <li>
                  • OPENAI_API_KEY v prostředí proxy:{' '}
                  <strong>{diagPayload.hasOpenAiKey ? 'ano (nastaveno)' : 'ne'}</strong>
                </li>
                <li>
                  • Čas odpovědi: <strong>{diagPayload.timestamp || '—'}</strong>
                </li>
              </ul>
            )}
          </>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Žádný tajný klíč se do prohlížeče neposílá – pouze booleovský stav a metadata.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          Test OpenAI proxy (server)
        </h3>
        <button
          onClick={testOpenAIConnection}
          disabled={isTesting}
          className="btn-primary"
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full border-2 border-slate-300 border-t-white w-4 h-4"></div>
              Testuji...
            </>
          ) : (
            <>
              <span className="text-lg">🧪</span>
              Testovat API
            </>
          )}
        </button>
      </div>

      {isTesting && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Testování připojení...</span>
            <span>{testProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${testProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {testResult && (
        <div
          className={`rounded-lg p-4 border ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
            <div className="flex-1">
              <div className="font-semibold mb-2">{testResult.message}</div>

              {testResult.details && (
                <div className="text-sm space-y-2">
                  {testResult.success ? (
                    <>
                      {testResult.details.modelsListSkipped ? (
                        <div className="text-slate-700">
                          • Seznam modelů:{' '}
                          <strong>vypnutý na serveru</strong> (403 {OPENAI_MODELS_LIST_DISABLED_CODE}) – test pokračoval
                          přes <code className="text-xs bg-emerald-100 px-1 rounded">/api/openai/chat</code>.
                        </div>
                      ) : (
                        <>
                          <div>• Počet dostupných modelů: {testResult.details.modelsCount}</div>
                          <div>
                            • GPT-4o Vision:{' '}
                            {testResult.details.hasGpt4oVision ? '✅ Dostupný' : '⚠️ Nedostupný'}
                          </div>
                          <div>• Dostupných GPT-4 modelů: {testResult.details.availableGpt4Models}</div>
                        </>
                      )}
                      <div>• Test model: {testResult.details.testModel}</div>
                      <div>
                        • Test odpověď:{' '}
                        <span className="whitespace-pre-wrap">&quot;{testResult.details.testResponse}&quot;</span>
                      </div>
                      {!testResult.details.modelsListSkipped &&
                        !testResult.details.hasGpt4oVision && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                          ⚠️ Vision API není dostupné. Aplikace bude fungovat s omezenou funkcionalitou.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {testResult.details.code && (
                        <div>
                          • Kód: <code className="text-xs bg-red-100 px-1 rounded">{testResult.details.code}</code>
                        </div>
                      )}
                      <div>• Technická zpráva: {testResult.details.error}</div>
                      <div className="border-t border-red-200 pt-2 mt-2">
                        <div className="font-medium text-red-900">{testResult.details.recommendationTitle}</div>
                        <p className="text-red-800/90 mt-1 whitespace-pre-wrap">
                          {testResult.details.recommendationText}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-500 bg-slate-100 rounded-lg p-3 mt-4 space-y-1">
        <p>
          💡 Lokálně použijte <code className="text-xs bg-slate-200 px-1 rounded">npm run dev</code> (Vite + proxy).
          V kořenu projektu nastavte <code className="text-xs bg-slate-200 px-1 rounded">OPENAI_API_KEY</code> v{' '}
          <code className="text-xs bg-slate-200 px-1 rounded">.env</code> nebo{' '}
          <code className="text-xs bg-slate-200 px-1 rounded">.env.local</code> – viz{' '}
          <code className="text-xs bg-slate-200 px-1 rounded">.env.example</code>.
        </p>
        <p>
          V DevTools → Network by se nemělo objevit přímé volání na api.openai.com z prohlížeče s vaším Bearer
          tokenem.
        </p>
        <p>
          Kódy chyb z proxy (např. <code className="text-xs bg-slate-200 px-1 rounded">OPENAI_KEY_MISSING</code>) a
          rozdíl <code className="text-xs bg-slate-200 px-1 rounded">npm run dev</code> vs{' '}
          <code className="text-xs bg-slate-200 px-1 rounded">npm run dev:vite</code> jsou popsány v README.
        </p>
      </div>
    </div>
  );
};

export default ApiTest;
