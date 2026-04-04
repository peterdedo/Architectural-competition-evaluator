import { z } from "zod";

/** INP-007 — schedule: preparation, construction, operations (time series / milestones). */
export const schedulePhaseSchema = z.object({
  phase: z.enum(["preparation", "construction", "operations"]),
  /** ISO 8601 date or year-month per study convention */
  start: z.string().min(1),
  end: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export type SchedulePhase = z.infer<typeof schedulePhaseSchema>;

/**
 * INP-007 + INP-008 — harmonogram and reference moment T0 (M0).
 */
export const projectTimelineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  /** INP-008 — reference year / instant */
  t0: z.string().min(1),
  /** INP-007 */
  schedulePhases: z.array(schedulePhaseSchema).min(1),
  /** Optional named milestones (PDF § 1.3.2 structure) */
  milestones: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        date: z.string().optional(),
      }),
    )
    .optional(),
  extension: z.record(z.unknown()).optional(),
});

export type ProjectTimeline = z.infer<typeof projectTimelineSchema>;
