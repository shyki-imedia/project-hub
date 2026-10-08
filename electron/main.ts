import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync, realpathSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import type { ProjectConfig, ProjectCommands, RunCommandPayload } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

const TERMINALS = [
  'ptyxis',
  'gnome-terminal',
  'kitty',
  'alacritty',
  'konsole',
  'xfce4-terminal',
  'x-terminal-emulator',
] as const

function projectsRoot(): string {
  // In dev, vite-plugin-electron puts main in dist-electron/; configs live at repo root.
  // Prefer APP_ROOT/projects, fall back to cwd/projects.
  const candidates = [
    path.join(process.env.APP_ROOT!, 'projects'),
    path.join(process.cwd(), 'projects'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0]
}

function which(bin: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('which', [bin], { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      out += chunk.toString()
    })
    child.on('close', (code) => {
      if (code !== 0) return resolve(null)
      resolve(out.trim() || null)
    })
    child.on('error', () => resolve(null))
  })
}

function terminalKind(resolvedPath: string): string {
  const base = path.basename(resolvedPath)
  if (base === 'x-terminal-emulator') {
    try {
      return path.basename(realpathSync(resolvedPath))
    } catch {
      return base
    }
  }
  return base
}

async function findTerminal(): Promise<string | null> {
  for (const term of TERMINALS) {
    const located = await which(term)
    if (!located) continue
    return terminalKind(located)
  }
  return null
}

function holdShell(command: string): string {
  return `${command}; echo; echo "[exit $?] — press Enter to close"; read`
}

function buildTerminalArgs(
  terminal: string,
  cwd: string,
  command: string,
): { bin: string; args: string[] } {
  const held = holdShell(command)

  switch (terminal) {
    case 'ptyxis':
      return {
        bin: 'ptyxis',
        args: [
          `--working-directory=${cwd}`,
          '-x',
          `bash -lc ${JSON.stringify(held)}`,
        ],
      }
    case 'gnome-terminal':
      return {
        bin: 'gnome-terminal',
        args: ['--working-directory', cwd, '--', 'bash', '-lc', held],
      }
    case 'kitty':
      return {
        bin: 'kitty',
        args: ['--directory', cwd, 'bash', '-lc', held],
      }
    case 'alacritty':
      return {
        bin: 'alacritty',
        args: ['--working-directory', cwd, '-e', 'bash', '-lc', held],
      }
    case 'konsole':
      return {
        bin: 'konsole',
        args: ['--workdir', cwd, '-e', 'bash', '-lc', held],
      }
    case 'xfce4-terminal':
      return {
        bin: 'xfce4-terminal',
        args: [
          `--working-directory=${cwd}`,
          '-e',
          `bash -lc ${JSON.stringify(held)}`,
        ],
      }
    default:
      return {
        bin: terminal,
        args: [
          '--',
          'bash',
          '-lc',
          `cd ${JSON.stringify(cwd)} && ${held}`,
        ],
      }
  }
}

function loadProjects(): ProjectConfig[] {
  const root = projectsRoot()
  if (!existsSync(root)) return []

  const entries = readdirSync(root, { withFileTypes: true })
  const projects: ProjectConfig[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const yamlPath = path.join(root, entry.name, 'project.yaml')
    if (!existsSync(yamlPath)) continue

    try {
      const raw = readFileSync(yamlPath, 'utf8')
      const data = parseYaml(raw) as {
        name?: string
        path?: string
        url?: string
        port?: number
        commands?: ProjectCommands
      }

      if (!data?.name || !data?.path) continue

      projects.push({
        id: entry.name,
        name: data.name,
        path: data.path,
        url: data.url,
        port: data.port,
        commands: data.commands ?? {},
      })
    } catch (err) {
      console.error(`Failed to parse ${yamlPath}:`, err)
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name))
}

function appIconPath(): string | undefined {
  const candidates = [
    path.join(process.env.APP_ROOT!, 'resources', 'icon.png'),
    path.join(process.cwd(), 'resources', 'icon.png'),
  ]
  return candidates.find((p) => existsSync(p))
}

function createWindow() {
  const icon = appIconPath()
  const win = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 700,
    minHeight: 480,
    title: 'Project Hub',
    backgroundColor: '#141414',
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.setName('Project Hub')

app.whenReady().then(() => {
  if (process.platform === 'linux') {
    app.setName('Project Hub')
  }

  ipcMain.handle('projects:list', () => loadProjects())

  ipcMain.handle('projects:runCommand', async (_event, payload: RunCommandPayload) => {
    const { projectPath, command } = payload
    if (!projectPath || !command) {
      return { ok: false, error: 'Missing projectPath or command' }
    }
    if (!existsSync(projectPath)) {
      return { ok: false, error: `Path does not exist: ${projectPath}` }
    }

    const terminal = await findTerminal()
    if (!terminal) {
      return { ok: false, error: 'No supported terminal found' }
    }

    const { bin, args } = buildTerminalArgs(terminal, projectPath, command)
    const child = spawn(bin, args, {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()

    return { ok: true, terminal: bin }
  })

  ipcMain.handle('projects:openCursor', async (_event, projectPath: string) => {
    if (!projectPath || !existsSync(projectPath)) {
      return { ok: false, error: `Path does not exist: ${projectPath}` }
    }

    const child = spawn('cursor', ['-n', projectPath], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()

    return { ok: true }
  })

  ipcMain.handle('projects:openFolder', async (_event, projectPath: string) => {
    if (!projectPath || !existsSync(projectPath)) {
      return { ok: false, error: `Path does not exist: ${projectPath}` }
    }
    const err = await shell.openPath(projectPath)
    return err ? { ok: false, error: err } : { ok: true }
  })

  ipcMain.handle('projects:openUrl', async (_event, url: string) => {
    if (!url) return { ok: false, error: 'Missing url' }
    await shell.openExternal(url)
    return { ok: true }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
