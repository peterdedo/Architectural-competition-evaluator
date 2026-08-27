import { useLocalStorage } from './useLocalStorage.js';

// Jediný přepínač pro AI funkce, které vstupují do posouzení poroty (návrh vah, evaluační
// komentář) – ne pro extrakci dat z PDF, ta je vždy explicitní akce (tlačítko „Zpracovat"
// u konkrétního souboru). Výchozí stav je VYPNUTO – porota si AI asistenci musí sama zapnout.
export function useAiFeaturesEnabled() {
  const [enabled, setEnabled] = useLocalStorage('archieval-ai-features-enabled', false);
  return [Boolean(enabled), setEnabled];
}
