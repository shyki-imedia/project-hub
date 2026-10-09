import { contextBridge, ipcRenderer } from 'electron'
import type {
  GitPushPayload,
  ProjectConfig,
  ProjectSavePayload,
  RunCommandPayload,
} from './types'

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

  openTerminal: (
    projectPath: string,
  ): Promise<{ ok: boolean; error?: string; terminal?: string }> =>
    ipcRenderer.invoke('projects:openTerminal', projectPath),

  openUrl: (url: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:openUrl', url),

  pickFolder: (): Promise<{ ok: boolean; path: string | null }> =>
    ipcRenderer.invoke('projects:pickFolder'),

  saveProject: (
    payload: ProjectSavePayload,
  ): Promise<{ ok: boolean; id?: string; error?: string }> =>
    ipcRenderer.invoke('projects:save', payload),

  gitBranch: (
    projectPath: string,
  ): Promise<{ ok: boolean; branch: string | null; error?: string }> =>
    ipcRenderer.invoke('projects:gitBranch', projectPath),

  gitPull: (
    projectPath: string,
  ): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:gitPull', projectPath),

  gitPush: (
    payload: GitPushPayload,
  ): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('projects:gitPush', payload),
}

contextBridge.exposeInMainWorld('hub', api)

export type HubApi = typeof api
