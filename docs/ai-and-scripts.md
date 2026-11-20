# Where AI Fits and Where Code Fits

**Golden rule:** everything involving numbers, limits, or safety is handled by **deterministic code**. AI only **selects and writes** the workouts within boundaries that code enforces and revalidates afterward. It never invents volume, paces, or dates.

Why split responsibilities this way?

- **Accuracy:** language models make arithmetic mistakes. Formulas don't.
- **Safety:** a poorly scaled training plan can cause injury. Progression limits cannot depend on generated text.
- **Cost & latency:** with the math already done, the prompt fits in ~2k tokens and the response in ~4k, which runs on free-tier models.
- **Testability:** code is covered by automated tests; AI output is checked by automated validators.

```mermaid
flowchart LR
  A["Form + files"] --> B["CODE: metrics, VDOT, zones, weekly volume, warnings"]
  B --> C["AI: picks sessions, writes descriptions"]
  C --> D["CODE: validates rules, normalizes, sums totals, injects paces"]
  D -->|"rejected"| C
  D --> E["Final plan"]
```

## Handled by Code

| Area | How |
|---|---|
| **File parsing** | GPX, TCX, FIT, CSV, and ZIP files are reduced to date, distance, duration, HR, and elevation. Filters plausible runs and removes duplicates. Runs in the browser. |
| **History analysis** | Weekly km, 4-week rolling average, runs per week, longest run, average pace, and best effort. |
| **Training paces** | Easy / Marathon / Threshold / Interval / Repetition zones via VDOT (Daniels' model) plus the **target pace** zone for the user's goal. See [`pace-zones.ts`](../code-samples/typescript/pace-zones.ts). |
| **Plan structure** | Number of weeks based on distance, per-week target volume (capped progression, cutback every 4th week, taper, goal week), caps by level and distance, weekend long run. See [`training-skeleton.ts`](../code-samples/typescript/training-skeleton.ts). |
| **Warnings** | Goal time far above history, target time without history to evaluate, short timeline for the distance, or no workouts uploaded. |
| **Output validation** | Week count, allowed days, at most one long run per week, volume within tolerance, cap on hard sessions, no intervals during cutback/taper, race/goal session on the right day and distance. See [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts). |
| **Post-processing** | Recomputes weekly mileage totals (ignoring LLM sums), calculates exact calendar dates for each session, and injects pace ranges from the chosen zone. |
| **Usage control** | Atomic per-account plan quota in PostgreSQL, automatic slot refund on any failure, and multi-model fallback. See [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql) and [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts). |

## Handled by AI

- Choosing **which sessions** go into each week (easy, tempo, interval, long, recovery, strength, cross-training) and distributing weekly volume across them.
- **Writing** titles, descriptions, weekly focus notes, tips, and the overall plan summary.
- Selecting the **pace zone** for each session. The actual numeric pace range is injected by code.
- Interpreting the user's **additional notes** (e.g., an injury) to reduce impact, add cross-training, and include a note recommending professional medical evaluation.

## How AI Is Constrained

1. **Explicit rules in the prompt** alongside the precomputed skeleton (weekly volume, available days, allowed zones).
2. **User free-text treated strictly as data**, delimited inside the prompt with explicit instructions to ignore any commands embedded within it.
3. **JSON output** validated against a Zod schema first, then checked by domain business rules.
4. **Self-repair:** on rejection, a single retry receives the exact list of validation errors. If it fails again, the request is aborted and the user's quota slot is refunded.

## Known Limitations (and How They Would Be Addressed)

- The **internal structure** of individual workouts (e.g., interval reps) comes from the AI and is only partially validated: code guarantees mileage, days, and session type, not internal workout progression or strict duration-distance-pace coherence.
- Injuries and health conditions rely on model interpretation; code only caps the count and type of high-intensity sessions.
- Paces estimated from training history are **conservative**, since everyday runs are typically slower than all-out races.
- The prompt asks for ±10% on weekly volume while code accepts ±15%, avoiding rejecting a solid plan over small rounding differences.
