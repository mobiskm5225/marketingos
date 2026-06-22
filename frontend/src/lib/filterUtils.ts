import type { FilterCondition, ColumnDef } from '../components/FilterBar';

export function applyFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: FilterCondition[],
  columns: ColumnDef[],
): T[] {
  if (!filters.length) return items;
  return items.filter(item =>
    filters.every(f => matchesFilter(item as Record<string, unknown>, f, columns))
  );
}

function matchesFilter(item: Record<string, unknown>, f: FilterCondition, columns: ColumnDef[]): boolean {
  const col = columns.find(c => c.key === f.col);
  if (!col) return true;
  const raw = item[f.col];
  switch (col.type) {
    case 'text':   return matchText(String(raw ?? ''), f.op, f.val);
    case 'select': return matchSelect(String(raw ?? ''), f.op, f.val);
    case 'number': return matchNumber(Number(raw ?? 0), f.op, f.val, f.val2);
    case 'date':   return matchDate(String(raw ?? ''), f.op, f.val, f.val2);
    default:       return true;
  }
}

function matchText(v: string, op: string, val: string): boolean {
  const s = v.toLowerCase();
  const q = (val ?? '').toLowerCase();
  switch (op) {
    case 'contains':     return s.includes(q);
    case 'not_contains': return !s.includes(q);
    case 'starts':       return s.startsWith(q);
    case 'ends':         return s.endsWith(q);
    case 'is':           return s === q;
    case 'is_not':       return s !== q;
    case 'empty':        return v.trim() === '';
    case 'not_empty':    return v.trim() !== '';
    default:             return true;
  }
}

function matchSelect(v: string, op: string, val: string): boolean {
  switch (op) {
    case 'is':     return v === val;
    case 'is_not': return v !== val;
    default:       return true;
  }
}

function matchNumber(v: number, op: string, val: string, val2?: string): boolean {
  const n = parseFloat(val);
  if (isNaN(n)) return true;
  const n2 = val2 ? parseFloat(val2) : NaN;
  switch (op) {
    case 'eq':      return v === n;
    case 'neq':     return v !== n;
    case 'gt':      return v > n;
    case 'lt':      return v < n;
    case 'gte':     return v >= n;
    case 'lte':     return v <= n;
    case 'between': return !isNaN(n2) ? v >= n && v <= n2 : v >= n;
    default:        return true;
  }
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function matchDate(v: string, op: string, val: string, val2?: string): boolean {
  if (!v) return false;
  const d = new Date(v).getTime();
  if (isNaN(d)) return false;

  const now = Date.now();

  switch (op) {
    case 'today':     { const s = startOfDay(now); return d >= s && d < s + 86400000; }
    case 'last7':     return d >= now - 7  * 86400000;
    case 'last30':    return d >= now - 30 * 86400000;
    case 'thismonth': {
      const dt = new Date(now);
      const s = new Date(dt.getFullYear(), dt.getMonth(),     1).getTime();
      const e = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).getTime();
      return d >= s && d < e;
    }
  }

  if (!val) return true;
  const target = new Date(val).getTime();
  if (isNaN(target)) return true;

  switch (op) {
    case 'on':      { const s = startOfDay(target); return d >= s && d < s + 86400000; }
    case 'before':  return d < startOfDay(target);
    case 'after':   return d >= startOfDay(target) + 86400000;
    case 'between': {
      if (!val2) return d >= startOfDay(target);
      const t2 = new Date(val2).getTime();
      return !isNaN(t2) ? d >= startOfDay(target) && d < startOfDay(t2) + 86400000 : d >= startOfDay(target);
    }
    default: return true;
  }
}
