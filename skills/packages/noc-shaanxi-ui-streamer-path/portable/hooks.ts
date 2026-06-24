import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

/* ============================================================
 *  Portable Hook Shims
 *  ------------------------------------------------------------
 *  These hooks replicate the small subset of behaviors the
 *  StreamerPath component relies on from
 *      - @fedx-web-common/react-hooks
 *      - ~/web/hooks/useMemorizedObject
 *
 *  Drop-in replacements. If your project already provides these
 *  hooks under the same name, you can simply delete this file
 *  and the component will pick up your version.
 * ============================================================ */

/**
 * Always returns the latest value via ref, avoiding stale closures.
 * Replaces: useLatest from @fedx-web-common/react-hooks
 */
export function useLatest<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}

/**
 * Stable function reference that always invokes the latest closure.
 * Replaces: useMemoizedFn from @fedx-web-common/react-hooks
 */
export function useMemoizedFn<T extends (...args: any[]) => any>(fn: T) {
    const fnRef = useLatest(fn);
    return useCallback(((...args: Parameters<T>) => fnRef.current(...args)) as T, []);
}

/**
 * Observe the size of a DOM element. Falls back to window resize
 * if ResizeObserver is unavailable (e.g. very old browsers / SSR).
 * Replaces: useSize from @fedx-web-common/react-hooks
 */
export function useElementSize(ref: React.RefObject<HTMLElement | null>) {
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            const rect = el.getBoundingClientRect();
            setSize({ width: rect.width, height: rect.height });
        };

        update();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(update);
            observer.observe(el);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [ref]);

    return size;
}

/**
 * Shallow-equal memoized object. Returns the same reference
 * when the value is structurally equal.
 * Replaces: useMemorizedObject from ~/web/hooks/useMemorizedObject
 *
 * Note: original implementation uses lodash-style isEqualWith.
 * Here we use a JSON-based comparison for portability (functions
 * inside the object are compared by reference, which is fine for
 * StreamerPath's colors/lineWidth/track configs).
 */
function shallowEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
        if (!Object.is((a as any)[k], (b as any)[k])) return false;
    }
    return true;
}

export function useMemorizedObject<T>(value: T): T {
    const ref = useRef(value);
    return useMemo(() => {
        if (!shallowEqual(ref.current, value)) {
            ref.current = value;
        }
        return ref.current as T;
    }, [value]);
}