import { useEffect } from 'react';

// Focus trap hook: traps Tab/Shift+Tab within the given container ref while enabled
export default function useFocusTrap(containerRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef?.current;
    if (!container) return;

    const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(container.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
}
