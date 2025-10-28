import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Aktualizujeme state, aby příští render zobrazil fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logování chyby do konzole
    console.error('ErrorBoundary zachytil chybu:', error, errorInfo);
    
    // Placeholder pro Sentry integraci
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
    
    // Uložení chyby do localStorage pro debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      localStorage.setItem('lastError', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Nepodařilo se uložit error log:', e);
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    // Vyčistíme localStorage a obnovíme stránku
    const confirmReset = window.confirm(
      'Tímto vymažete všechna uložená data a vrátíte aplikaci do výchozího stavu. Pokračovat?'
    );
    
    if (confirmReset) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  handleReload = () => {
    // Jen obnovíme stránku
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Něco se pokazilo</h1>
                  <p className="text-white/80 text-sm">Aplikace narazila na neočekávanou chybu</p>
                </div>
              </div>
            </div>

            {/* Error details */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-2">
                  Co se stalo?
                </h2>
                <p className="text-slate-600">
                  V aplikaci došlo k chybě, která znemožnila pokračování. 
                  To se někdy může stát kvůli nekonzistentním datům nebo problému s načítáním komponent.
                </p>
              </div>

              {/* Error message (for development) */}
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">
                    Chybová zpráva (pouze v development):
                  </h3>
                  <pre className="text-xs text-red-700 overflow-x-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <RefreshCw size={18} />
                  Obnovit stránku
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  <Home size={18} />
                  Reset aplikace
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  💡 Tipy pro řešení problému:
                </h3>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Zkuste obnovit stránku (Ctrl+R nebo F5)</li>
                  <li>Vymažte cache prohlížeče (Ctrl+Shift+R)</li>
                  <li>Pokud problém přetrvává, použijte "Reset aplikace"</li>
                  <li>Zkontrolujte konzoli prohlížeče (F12) pro více informací</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




