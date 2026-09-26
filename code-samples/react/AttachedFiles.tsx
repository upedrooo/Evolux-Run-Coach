import type { ReactNode } from "react";

/**
 * Lista de arquivos anexados com indicação visual clara de "vazio" × "com arquivos".
 *
 * Decisões de UX/acessibilidade:
 *  - estado vazio explícito ("Nenhum arquivo anexado"), em vez de simplesmente não mostrar nada;
 *  - cada arquivo tem status (✓ aproveitado / ! ignorado) e um botão X com `aria-label` descritivo
 *    ("Remover activities.csv"), útil para leitores de tela;
 *  - "Limpar tudo" para remoção em massa;
 *  - o componente é "burro" (só apresentação): quem lê e interpreta os arquivos é o componente pai,
 *    o que o mantém simples de testar e reaproveitar.
 *
 * Estilo: Tailwind CSS com tokens semânticos (ok / warn / line) definidos em css/design-tokens.css.
 */

export type AttachedFile = {
  id: string;
  name: string;
  sizeLabel: string;
  /** true = nada aproveitável (outro esporte, formato inválido…) */
  warn: boolean;
  note: string;
};

type Props = {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
  /** resumo do que foi extraído (ex.: "24 corridas · 19 km/semana") */
  footer?: ReactNode;
};

export function AttachedFiles({ files, onRemove, onClear, footer }: Props) {
  if (files.length === 0) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
        <span aria-hidden className="size-2 rounded-full bg-line" />
        Nenhum arquivo anexado
      </p>
    );
  }

  return (
    <div className="mt-4" role="status">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="size-2 rounded-full bg-ok" />
          {files.length} {files.length === 1 ? "arquivo anexado" : "arquivos anexados"}
        </p>
        <button type="button" onClick={onClear} className="text-sm text-muted underline hover:text-ink">
          Limpar tudo
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
              aria-label={`Remover ${f.name}`}
              title="Remover arquivo"
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
