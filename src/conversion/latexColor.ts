// Shared color <-> LaTeX conversion for \textcolor and \colorbox (xcolor
// package). Centralized here so the generator and parser agree on the exact
// same format and a round trip never silently drops or mangles a color.

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** CSS color string (hex or named) -> the `[MODEL]{value}` argument LaTeX expects. */
export function toLatexColorArg(color: string): string {
  const c = (color || '').trim()
  if (HEX_RE.test(c)) {
    let hex = c.slice(1)
    if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('')
    return `[HTML]{${hex.toUpperCase()}}`
  }
  // Plain xcolor base names (red, blue, yellow, ...) are also valid CSS
  // color names, so no bracket/model is needed.
  return `{${c || 'black'}}`
}

/** Parses an optional `[MODEL]{value}` (or bare `{name}`) starting at `text[cursor]`
 * (which must be `[` or `{`) back into a CSS-compatible color string. */
export function parseLatexColorArg(
  text: string,
  cursor: number,
  extractBraced: (text: string, openIndex: number) => { content: string; endIndex: number } | null,
  skipWhitespace: (text: string, index: number) => number,
): { color: string; endIndex: number } | null {
  let i = cursor
  let model: string | null = null
  if (text[i] === '[') {
    const close = text.indexOf(']', i)
    if (close === -1) return null
    model = text.slice(i + 1, close).trim()
    i = skipWhitespace(text, close + 1)
  }
  if (text[i] !== '{') return null
  const arg = extractBraced(text, i)
  if (!arg) return null
  const value = arg.content.trim()

  let color = value
  if (model === 'HTML') {
    color = `#${value.replace(/^#/, '')}`
  } else if (model === 'RGB') {
    const parts = value.split(',').map((s) => s.trim())
    if (parts.length === 3) color = `rgb(${parts.join(',')})`
  } else if (model === 'rgb') {
    const parts = value.split(',').map((s) => Math.round(parseFloat(s) * 255))
    if (parts.length === 3) color = `rgb(${parts.join(',')})`
  }
  return { color, endIndex: arg.endIndex }
}
