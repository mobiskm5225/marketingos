import { useState, useRef, useEffect } from 'react';

export type ColumnDef = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: { value: string; label: string }[];
};

export type FilterCondition = {
  id: string;
  col: string;
  op: string;
  val: string;
  val2?: string;
};

type Props = {
  columns: ColumnDef[];
  value: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
};

const OPS: Record<string, { value: string; label: string; noVal?: boolean; isBetween?: boolean }[]> = {
  text: [
    { value: 'contains',     label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts',       label: 'starts with' },
    { value: 'ends',         label: 'ends with' },
    { value: 'is',           label: 'is' },
    { value: 'is_not',       label: 'is not' },
    { value: 'empty',        label: 'is empty',     noVal: true },
    { value: 'not_empty',    label: 'is not empty', noVal: true },
  ],
  select: [
    { value: 'is',     label: 'is' },
    { value: 'is_not', label: 'is not' },
  ],
  number: [
    { value: 'eq',      label: '='        },
    { value: 'neq',     label: '≠'        },
    { value: 'gt',      label: '>'        },
    { value: 'lt',      label: '<'        },
    { value: 'gte',     label: '≥'        },
    { value: 'lte',     label: '≤'        },
    { value: 'between', label: 'between', isBetween: true },
  ],
  date: [
    { value: 'on',        label: 'is'          },
    { value: 'before',    label: 'before'       },
    { value: 'after',     label: 'after'        },
    { value: 'between',   label: 'between',     isBetween: true },
    { value: 'today',     label: 'today',       noVal: true },
    { value: 'last7',     label: 'last 7 days', noVal: true },
    { value: 'last30',    label: 'last 30 days',noVal: true },
    { value: 'thismonth', label: 'this month',  noVal: true },
  ],
};

function defaultOp(type: string) {
  if (type === 'select') return 'is';
  if (type === 'number') return 'eq';
  if (type === 'date')   return 'on';
  return 'contains';
}

function getOpMeta(op: string, type: string) {
  return (OPS[type] ?? OPS.text).find(o => o.value === op);
}

function chipText(f: FilterCondition, columns: ColumnDef[]): string {
  const col = columns.find(c => c.key === f.col);
  if (!col) return f.col;
  const meta = getOpMeta(f.op, col.type);
  const opLbl = meta?.label ?? f.op;
  if (meta?.noVal) return `${col.label} ${opLbl}`;
  let val = f.val;
  if (col.type === 'select' && col.options) {
    val = col.options.find(o => o.value === f.val)?.label ?? f.val;
  }
  if (meta?.isBetween && f.val2) return `${col.label} ${opLbl} ${val} and ${f.val2}`;
  return `${col.label} ${opLbl} "${val}"`;
}

type Draft = { id: string | null; col: string; op: string; val: string; val2: string };

export default function FilterBar({ columns, value, onChange }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setDraft(null);
      }
    }
    if (draft) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [!!draft]);

  function openNew() {
    const col = columns[0];
    setDraft({ id: null, col: col.key, op: defaultOp(col.type), val: '', val2: '' });
  }

  function openEdit(f: FilterCondition) {
    setDraft({ id: f.id, col: f.col, op: f.op, val: f.val, val2: f.val2 ?? '' });
  }

  function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter(f => f.id !== id));
  }

  function setDraftCol(col: string) {
    const colDef = columns.find(c => c.key === col);
    setDraft(d => d ? { ...d, col, op: defaultOp(colDef?.type ?? 'text'), val: '', val2: '' } : null);
  }

  function setDraftOp(op: string) {
    setDraft(d => d ? { ...d, op, val: '', val2: '' } : null);
  }

  function commit() {
    if (!draft) return;
    const colDef = columns.find(c => c.key === draft.col);
    const meta = getOpMeta(draft.op, colDef?.type ?? 'text');
    if (!meta?.noVal && !draft.val.trim()) return;
    if (draft.id === null) {
      onChange([...value, {
        id: crypto.randomUUID(),
        col: draft.col, op: draft.op,
        val: draft.val,
        val2: draft.val2 || undefined,
      }]);
    } else {
      onChange(value.map(f =>
        f.id === draft.id
          ? { ...f, col: draft.col, op: draft.op, val: draft.val, val2: draft.val2 || undefined }
          : f
      ));
    }
    setDraft(null);
  }

  const draftCol  = draft ? columns.find(c => c.key === draft.col) : null;
  const draftOps  = draftCol ? (OPS[draftCol.type] ?? OPS.text) : [];
  const draftMeta = draft && draftCol ? getOpMeta(draft.op, draftCol.type) : null;
  const noVal     = !!draftMeta?.noVal;
  const between   = !!draftMeta?.isBetween;
  const canCommit = noVal || (!!draft?.val.trim());

  return (
    <div>
      <div className="filter-strip">
        <span>Filter:</span>
        {value.length === 0 && <span className="muted" style={{ fontSize: 12 }}>No conditions — showing all records</span>}
        {value.map(f => (
          <span key={f.id} className="filter-chip" onClick={() => openEdit(f)}>
            {chipText(f, columns)}
            <span className="chip-remove" onClick={e => remove(f.id, e)}>×</span>
          </span>
        ))}
        <button className="add-filter-btn" onClick={openNew}>+ Add filter</button>
        {value.length > 0 && (
          <button className="clear-filter-btn" onClick={() => onChange([])}>Clear all</button>
        )}
      </div>

      {draft && (
        <div className="filter-editor" ref={editorRef}>
          <select
            className="sn-select"
            value={draft.col}
            onChange={e => setDraftCol(e.target.value)}
            style={{ width: 'auto', minWidth: 130 }}
          >
            {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          <select
            className="sn-select"
            value={draft.op}
            onChange={e => setDraftOp(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            {draftOps.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {!noVal && draftCol?.type === 'select' && draftCol.options && (
            <select
              className="sn-select"
              value={draft.val}
              onChange={e => setDraft(d => d ? { ...d, val: e.target.value } : null)}
              style={{ width: 'auto', minWidth: 140 }}
            >
              <option value="">— select —</option>
              {draftCol.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}

          {!noVal && draftCol?.type === 'text' && (
            <input
              className="sn-input"
              placeholder="Value"
              value={draft.val}
              style={{ width: 200 }}
              autoFocus
              onChange={e => setDraft(d => d ? { ...d, val: e.target.value } : null)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canCommit) commit();
                if (e.key === 'Escape') setDraft(null);
              }}
            />
          )}

          {!noVal && draftCol?.type === 'number' && (
            <>
              <input
                className="sn-input"
                type="number"
                placeholder="Value"
                value={draft.val}
                style={{ width: 100 }}
                autoFocus
                onChange={e => setDraft(d => d ? { ...d, val: e.target.value } : null)}
                onKeyDown={e => { if (e.key === 'Enter' && canCommit) commit(); }}
              />
              {between && (
                <>
                  <span style={{ color: 'var(--sn-muted)', fontSize: 13 }}>and</span>
                  <input
                    className="sn-input"
                    type="number"
                    placeholder="Value 2"
                    value={draft.val2}
                    style={{ width: 100 }}
                    onChange={e => setDraft(d => d ? { ...d, val2: e.target.value } : null)}
                    onKeyDown={e => { if (e.key === 'Enter' && canCommit) commit(); }}
                  />
                </>
              )}
            </>
          )}

          {!noVal && draftCol?.type === 'date' && (
            <>
              <input
                className="sn-input"
                type="date"
                value={draft.val}
                style={{ width: 150 }}
                autoFocus
                onChange={e => setDraft(d => d ? { ...d, val: e.target.value } : null)}
              />
              {between && (
                <>
                  <span style={{ color: 'var(--sn-muted)', fontSize: 13 }}>and</span>
                  <input
                    className="sn-input"
                    type="date"
                    value={draft.val2}
                    style={{ width: 150 }}
                    onChange={e => setDraft(d => d ? { ...d, val2: e.target.value } : null)}
                  />
                </>
              )}
            </>
          )}

          <button className="sn-btn sn-btn-primary" onClick={commit} disabled={!canCommit}>
            {draft.id === null ? 'Add' : 'Update'}
          </button>
          <button className="sn-btn" onClick={() => setDraft(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
