import { useState, useCallback } from "react";

interface LayoutState {
  order: string[];
  collapsed: Record<string, boolean>;
  hidden: Record<string, boolean>;
}

export function useDashboardLayout(storageKey: string, defaultOrder: string[]) {
  const [state, setState] = useState<LayoutState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as LayoutState;
        const merged = [...parsed.order];
        for (const id of defaultOrder) {
          if (!merged.includes(id)) merged.push(id);
        }
        const filtered = merged.filter(id => defaultOrder.includes(id));
        return { order: filtered, collapsed: parsed.collapsed || {}, hidden: parsed.hidden || {} };
      }
    } catch {}
    return { order: defaultOrder, collapsed: {}, hidden: {} };
  });

  const persist = (next: LayoutState) => {
    setState(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const moveUp = useCallback((id: string) => {
    setState(prev => {
      const idx = prev.order.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev.order];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      const result = { ...prev, order: next };
      localStorage.setItem(storageKey, JSON.stringify(result));
      return result;
    });
  }, [storageKey]);

  const moveDown = useCallback((id: string) => {
    setState(prev => {
      const idx = prev.order.indexOf(id);
      if (idx < 0 || idx >= prev.order.length - 1) return prev;
      const next = [...prev.order];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      const result = { ...prev, order: next };
      localStorage.setItem(storageKey, JSON.stringify(result));
      return result;
    });
  }, [storageKey]);

  const toggleCollapse = useCallback((id: string) => {
    setState(prev => {
      const result = { ...prev, collapsed: { ...prev.collapsed, [id]: !prev.collapsed[id] } };
      localStorage.setItem(storageKey, JSON.stringify(result));
      return result;
    });
  }, [storageKey]);

  const toggleHidden = useCallback((id: string) => {
    setState(prev => {
      const result = { ...prev, hidden: { ...prev.hidden, [id]: !prev.hidden[id] } };
      localStorage.setItem(storageKey, JSON.stringify(result));
      return result;
    });
  }, [storageKey]);

  const isCollapsed = useCallback((id: string) => !!state.collapsed[id], [state.collapsed]);
  const isHidden = useCallback((id: string) => !!state.hidden[id], [state.hidden]);

  const resetLayout = useCallback(() => {
    const result = { order: defaultOrder, collapsed: {}, hidden: {} };
    persist(result);
  }, [defaultOrder, storageKey]);

  return { order: state.order, moveUp, moveDown, toggleCollapse, isCollapsed, toggleHidden, isHidden, resetLayout };
}
