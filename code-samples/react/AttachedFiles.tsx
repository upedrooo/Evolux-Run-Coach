import type { ReactNode } from "react";

/**
 * Attached-files list with clear visual distinction between empty and populated states.
 *
 * UX & accessibility decisions:
 *  - explicit empty state ("No files attached") instead of rendering nothing;
 *  - each file displays a status badge (✓ usable / ! skipped) and a remove button with a descriptive
 *    `aria-label` ("Remove activities.csv") for screen readers;
 *  - "Clear all" action for bulk removal;
 *  - purely presentational component: file parsing and state live in the parent,
 *    keeping this component easy to test and reuse.
 *
 * Styling: Tailwind CSS using semantic tokens (ok / warn / line) defined in css/design-tokens.css.
 */

export type AttachedFile = {
  id: string;
  name: string;
  sizeLabel: string;
  /** true = nothing usable (different sport, invalid format…) */
  warn: boolean;
  note: string;
};

type Props = {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
  /** summary of extracted workouts (e.g., "24 runs · 19 km/week") */
  footer?: ReactNode;
};

export function AttachedFiles({ files, onRemove, onClear, footer }: Props) {
  if (files.length === 0) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
        <span aria-hidden className="size-2 rounded-full bg-line" />
        No files attached
      </p>
    );
  }

  return (
    <div className="mt-4" role="status">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="size-2 rounded-full bg-ok" />
          {files.length} {files.length === 1 ? "file attached" : "files attached"}
        </p>
        <button type="button" onClick={onClear} className="text-sm text-muted underline hover:text-ink">
          Clear all
        </button>
      </div>

      <ul className="mt-2 space-y-2">
        {files.map((f) => (
          <li
            key={f.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
              f.warn ? "border-warn/60 bg-warn-soft" : "border-ok/60 bg-ok-soft"
            }`}
          >
            <span
              aria-hidden
              className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                f.warn ? "bg-warn" : "bg-ok"
              }`}
            >
              {f.warn ? "!" : "✓"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={f.name}>{f.name}</p>
              <p className={`text-xs ${f.warn ? "text-warn" : "text-ok"}`}>{f.note} · {f.sizeLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(f.id)}
              aria-label={`Remove ${f.name}`}
              title="Remove file"
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {footer}
    </div>
  );
}
