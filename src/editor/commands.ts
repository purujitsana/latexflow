// Central registry of app-level actions, shared by the Command Palette and
// the global keyboard-shortcut handler so the two never drift apart.
export interface AppCommand {
  id: string
  label: string
  shortcut?: string
  group: 'File' | 'Edit' | 'Insert' | 'Format' | 'View' | 'Help'
  run: () => void
}

type Registry = Map<string, AppCommand>

const registry: Registry = new Map()

export function registerCommands(commands: AppCommand[]) {
  for (const c of commands) registry.set(c.id, c)
}

export function unregisterAll() {
  registry.clear()
}

export function getCommands(): AppCommand[] {
  return Array.from(registry.values())
}

export function runCommand(id: string) {
  registry.get(id)?.run()
}
