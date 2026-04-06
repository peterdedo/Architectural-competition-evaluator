import { createDemoWizardState } from "./demo-seed";
import type { WizardState } from "./wizard-types";

let cached: WizardState | null = null;

/** Jeden read-only snapshot ukázkového stavu — pro vizuální odlišení nezměněných polí. */
export function getDemoWizardReference(): WizardState {
  if (!cached) cached = createDemoWizardState();
  return cached;
}
