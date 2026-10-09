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
  /** Open in browser. If omitted, built from port as http://localhost:{port} */
  url?: string
  port?: number
  /** Figma / design mockup */
  figma?: string
  /** Bug list (Google Sheets, etc.) */
  bugs?: string
  /** OpenAPI / Swagger UI */
  swagger?: string
  commands: ProjectCommands
}

export type RunCommandPayload = {
  projectPath: string
  command: string
}

export type ProjectSavePayload = {
  /** Existing id when editing; omit when creating */
  id?: string
  name: string
  path: string
  url?: string
  port?: number
  figma?: string
  bugs?: string
  swagger?: string
  commands: ProjectCommands
  createProjectHub?: boolean
}

export type GitCommitPayload = {
  projectPath: string
  message: string
}

export function resolveProjectUrl(
  project: Pick<ProjectConfig, 'url' | 'port'>,
): string | null {
  if (project.url) return project.url
  if (project.port != null) return `http://localhost:${project.port}`
  return null
}
