// LaTeX reserves ten characters. Ordinary text passed through the generator
// must have them neutralized, or the emitted .tex simply won't compile.
const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '%': '\\%',
  '&': '\\&',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
  $: '\\$',
}

const ESCAPE_PATTERN = /[\\%&#_{}~^$]/g

export function escapeLatex(text: string): string {
  return text.replace(ESCAPE_PATTERN, (ch) => ESCAPE_MAP[ch] ?? ch)
}

// Reverse of escapeLatex, used when turning generated LaTeX text runs back
// into plain text for the rich editor. Order matters: textbackslash must be
// unescaped before the generic backslash-command patterns are stripped.
export function unescapeLatex(text: string): string {
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\\$/g, '$')
}
