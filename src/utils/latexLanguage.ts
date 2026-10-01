import type { Monaco } from '@monaco-editor/react'
import type { languages, editor as MonacoEditorNS, Position } from 'monaco-editor'

export const LATEX_LANGUAGE_ID = 'latex-flow'

const COMPLETIONS = [
  'section',
  'subsection',
  'subsubsection',
  'textbf',
  'textit',
  'underline',
  'frac',
  'sqrt',
  'begin',
  'end',
  'cite',
  'ref',
  'label',
  'includegraphics',
  'caption',
  'item',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'theta',
  'sum',
  'int',
  'infty',
  'hline',
  'href',
  'footnote',
  'usepackage',
  'documentclass',
]

export function registerLatexLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((l: languages.ILanguageExtensionPoint) => l.id === LATEX_LANGUAGE_ID)) return

  monaco.languages.register({ id: LATEX_LANGUAGE_ID, extensions: ['.tex'], aliases: ['LaTeX', 'latex'] })

  monaco.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\\[a-zA-Z]+\*?/, 'keyword'],
        [/\\[^a-zA-Z]/, 'keyword.escape'],
        [/\{/, { token: 'delimiter.curly', next: '@push' }],
        [/\}/, { token: 'delimiter.curly', next: '@pop' }],
        [/\[/, 'delimiter.square'],
        [/\]/, 'delimiter.square'],
        [/\$\$/, { token: 'string.math', next: '@mathDisplay' }],
        [/\$/, { token: 'string.math', next: '@mathInline' }],
        [/[&#_^~]/, 'operator'],
      ],
      mathInline: [
        [/[^$]+/, 'string.math'],
        [/\$/, { token: 'string.math', next: '@pop' }],
      ],
      mathDisplay: [
        [/[^$]+/, 'string.math'],
        [/\$\$/, { token: 'string.math', next: '@pop' }],
      ],
    },
  })

  monaco.languages.setLanguageConfiguration(LATEX_LANGUAGE_ID, {
    brackets: [
      ['{', '}'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '$', close: '$' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '$', close: '$' },
    ],
    comments: { lineComment: '%' },
  })

  monaco.languages.registerCompletionItemProvider(LATEX_LANGUAGE_ID, {
    triggerCharacters: ['\\'],
    provideCompletionItems(model: MonacoEditorNS.ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }
      return {
        suggestions: COMPLETIONS.map((name) => ({
          label: `\\${name}`,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: name,
          range,
        })),
      }
    },
  })
}
