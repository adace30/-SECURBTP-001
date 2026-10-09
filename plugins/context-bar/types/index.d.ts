export type Total = number

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { total: Total }
  }
}
