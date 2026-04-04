import { z } from "zod";

/**
 * Explicit rule: min. 3 scenarios (optimistic / baseline / pessimistic) — spec (scénáře).
 */
export const scenarioKindSchema = z.enum([
  "optimistic",
  "baseline",
  "pessimistic",
]);

export type ScenarioKind = z.infer<typeof scenarioKindSchema>;

export const scenarioSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** Human-readable; PDF "opt / střed / pes" mapping */
  scenarioId: z.string().min(1),
  kind: scenarioKindSchema,

  /** FK to active assumption package for this scenario */
  assumptionSetId: z.string().uuid(),

  /** Optional link to pre-resolved territorial variant */
  territorialDefinitionId: z.string().uuid().optional(),

  notes: z.string().optional(),
  extension: z.record(z.unknown()).optional(),
});

export type Scenario = z.infer<typeof scenarioSchema>;
