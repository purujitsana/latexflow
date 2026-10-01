import { useEffect, useState } from 'react'

// Matches Tailwind's `md` breakpoint. JS-driven (not a CSS `hidden`/`md:hidden`
// pair) so only one layout tree ever actually mounts — rendering the same
// editor's content in two simultaneous DOM mounts breaks ProseMirror's
// position-to-DOM lookups (editor.view.nodeDOM), which the cursor-sync
// highlight relies on.
const QUERY = '(min-width: 768px)'

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true))

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
