import React, { useState } from 'react';

const ApiTest = ({ apiKey, onTestComplete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testProgress, setTestProgress] = useState(0);

  const testOpenAIConnection = async () => {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setTestResult({
        success: false,
        message: 'Neplatný API klíč. Musí začínat s "sk-"'
      });
      return;
    }

    setIsTesting(true);
    setTestProgress(0);
    setTestResult(null);

    try {
      // Test 1: Základní připojení k API
      setTestProgress(20);
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!modelsResponse.ok) {
        throw new Error(`HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`);
      }

      const modelsData = await modelsResponse.json();
      setTestProgress(50);

      // Test 2: Test GPT-4o dostupnosti (hledáme různé varianty)
      const hasGpt4o = modelsData.data.some(model => 
        model.id.includes('gpt-4o') || 
        model.id.includes('gpt-4-vision') ||
        model.id.includes('gpt-4o-vision')
      );

      setTestProgress(70);

      // Test 3: Test jednoduchého volání (zkusíme různé modely)
      let testModel = 'gpt-4o';
      let testResponse;
      
      // Najdeme dostupný model
      const availableModels = modelsData.data.filter(model => 
        model.id.includes('gpt-4') && !model.id.includes('instruct')
      );
      
      if (availableModels.length > 0) {
        testModel = availableModels[0].id;
      }

      testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            {
              role: 'user',
              content: 'Odpověz pouze "API funguje"'
            }
          ],
          max_tokens: 10
        })
      });

      if (!testResponse.ok) {
        throw new Error(`Test volání selhal: ${testResponse.status}`);
      }

      const testData = await testResponse.json();
      setTestProgress(100);

      setTestResult({
        success: true,
        message: 'API klíč funguje správně!',
        details: {
          modelsCount: modelsData.data.length,
          hasGpt4oVision: hasGpt4o,
          testModel: testModel,
          testResponse: testData.choices[0]?.message?.content || 'N/A',
          availableGpt4Models: availableModels.length
        }
      });

      if (onTestComplete) {
        onTestComplete(true);
      }

    } catch (error) {
      console.error('API test chyba:', error);
      setTestResult({
        success: false,
        message: `Chyba při testování API: ${error.message}`,
        details: {
          error: error.message,
          suggestion: getSuggestionForError(error.message)
        }
      });

      if (onTestComplete) {
        onTestComplete(false);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const getSuggestionForError = (errorMessage) => {
    if (errorMessage.includes('401')) {
      return 'API klíč je neplatný nebo vypršel. Zkontrolujte klíč v OpenAI dashboardu.';
    } else if (errorMessage.includes('403')) {
      return 'API klíč nemá dostatečná oprávnění. Zkontrolujte billing a oprávnění.';
    } else if (errorMessage.includes('429')) {
      return 'Překročen limit požadavků. Zkuste to později.';
    } else if (errorMessage.includes('500')) {
      return 'Server OpenAI má problémy. Zkuste to později.';
    } else {
      return 'Zkontrolujte připojení k internetu a zkuste to znovu.';
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          Test OpenAI API
        </h3>
        <button
          onClick={testOpenAIConnection}
          disabled={isTesting || !apiKey}
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
        <div className={`rounded-lg p-4 border ${
          testResult.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {testResult.success ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <div className="font-semibold mb-2">{testResult.message}</div>
              
              {testResult.details && (
                <div className="text-sm space-y-1">
                  {testResult.success ? (
                    <>
                      <div>• Počet dostupných modelů: {testResult.details.modelsCount}</div>
                      <div>• GPT-4o Vision: {testResult.details.hasGpt4oVision ? '✅ Dostupný' : '⚠️ Nedostupný'}</div>
                      <div>• Test model: {testResult.details.testModel}</div>
                      <div>• Dostupných GPT-4 modelů: {testResult.details.availableGpt4Models}</div>
                      <div>• Test odpověď: "{testResult.details.testResponse}"</div>
                      {!testResult.details.hasGpt4oVision && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                          ⚠️ Vision API není dostupné. Aplikace bude fungovat s omezenou funkcionalitou.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>• Chyba: {testResult.details.error}</div>
                      <div>• Doporučení: {testResult.details.suggestion}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!apiKey && (
        <div className="text-sm text-slate-500 bg-slate-100 rounded-lg p-3">
          💡 Nejdříve zadejte API klíč pro testování
        </div>
      )}
    </div>
  );
};

export default ApiTest;
