export type ProjectCommands = {
  dev?: string
  stop?: string
  'deploy:dev'?: string
  'deploy:prod'?: string
}

export type ProjectConfig = {
  id: string
  name: string
  path: string
  commands: ProjectCommands
}

export type RunCommandPayload = {
  projectPath: string
  command: string
}
