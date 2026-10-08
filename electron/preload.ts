import { contextBridge, ipcRenderer } from 'electron'
import type { ProjectConfig, RunCommandPayload } from './types'

const api = {
  listProjects: (): Promise<ProjectConfig[]> =>
    ipcRenderer.invoke('projects:list'),

  runCommand: (
    payload: RunCommandPayload,
  ): Promise<{ ok: boolean; error?: string; terminal?: string }> =>
    ipcRenderer.invoke('projects:runCommand', payload),

  openCursor: (
    projectPath: string,
  ): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:openCursor', projectPath),

  openFolder: (
    projectPath: string,
  ): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:openFolder', projectPath),

  openUrl: (url: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:openUrl', url),
}

contextBridge.exposeInMainWorld('hub', api)

export type HubApi = typeof api
