import { z } from "zod";

/**
 * MHDSI computational modules per docs/mhdsi-system-spec.md (seznam výpočtových modulů).
 */
export const MHDSI_MODULES = [
  "M0",
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
] as const;

export type MhdsiModuleId = (typeof MHDSI_MODULES)[number];

export const vypBlockIdSchema = z.enum([
  "VYP_1.4_1",
  "VYP_1.5_1",
  "VYP_2.1_1",
  "VYP_2.1_2",
  "VYP_2.1_3",
  "VYP_2.1_4",
  "VYP_2.1_5",
  "VYP_2.2_1",
  "VYP_2.2_2",
  "VYP_2.2_3",
  "VYP_2.2_4",
  "VYP_2.2_5",
  "VYP_2.3_1",
  "VYP_2.3_2",
  "VYP_2.3_3",
  "VYP_2.3_4",
  "VYP_2.4_1",
  "VYP_2.4_2",
  "VYP_2.4_3",
  "VYP_2.4_4",
  "VYP_2.4_5",
]);

export type VypBlockId = z.infer<typeof vypBlockIdSchema>;
