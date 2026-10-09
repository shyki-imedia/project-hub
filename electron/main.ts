import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { spawn } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  realpathSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type {
  GitPushPayload,
  ProjectConfig,
  ProjectCommands,
  ProjectSavePayload,
  RunCommandPayload,
} from './types'

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

function buildOpenTerminalArgs(
  terminal: string,
  cwd: string,
): { bin: string; args: string[] } {
  switch (terminal) {
    case 'ptyxis':
      return { bin: 'ptyxis', args: [`--working-directory=${cwd}`] }
    case 'gnome-terminal':
      return { bin: 'gnome-terminal', args: ['--working-directory', cwd] }
    case 'kitty':
      return { bin: 'kitty', args: ['--directory', cwd] }
    case 'alacritty':
      return { bin: 'alacritty', args: ['--working-directory', cwd] }
    case 'konsole':
      return { bin: 'konsole', args: ['--workdir', cwd] }
    case 'xfce4-terminal':
      return { bin: 'xfce4-terminal', args: [`--working-directory=${cwd}`] }
    default:
      return {
        bin: terminal,
        args: ['--', 'bash', '-lc', `cd ${JSON.stringify(cwd)}; exec bash`],
      }
  }
}

function runGit(
  cwd: string,
  args: string[],
): Promise<{ ok: boolean; stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => {
      resolve({ ok: false, stdout, stderr: err.message, code: 1 })
    })
    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: code ?? 1,
      })
    })
  })
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

const CYR_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

function slugifyId(name: string): string {
  const lower = name.trim().toLowerCase()
  let out = ''
  for (const ch of lower) {
    if (CYR_MAP[ch] !== undefined) out += CYR_MAP[ch]
    else if (/[a-z0-9]/.test(ch)) out += ch
    else if (/[\s._/\\-]/.test(ch)) out += '-'
  }
  out = out.replace(/-+/g, '-').replace(/^-|-$/g, '')
  return out || 'project'
}

function uniqueProjectId(base: string): string {
  const root = projectsRoot()
  let id = base
  let n = 2
  while (existsSync(path.join(root, id))) {
    id = `${base}-${n}`
    n += 1
  }
  return id
}

function cleanCommands(commands: ProjectCommands): ProjectCommands {
  const out: ProjectCommands = {}
  for (const key of ['dev', 'stop', 'deploy:dev', 'deploy:prod'] as const) {
    const value = commands[key]?.trim()
    if (value) out[key] = value
  }
  return out
}

function writeProjectYaml(id: string, payload: ProjectSavePayload) {
  const root = projectsRoot()
  mkdirSync(root, { recursive: true })
  const dir = path.join(root, id)
  mkdirSync(dir, { recursive: true })

  const doc: Record<string, unknown> = {
    name: payload.name.trim(),
    path: payload.path.trim(),
  }
  if (payload.url?.trim()) doc.url = payload.url.trim()
  if (payload.port != null && !Number.isNaN(Number(payload.port))) {
    doc.port = Number(payload.port)
  }
  if (payload.figma?.trim()) doc.figma = payload.figma.trim()
  if (payload.bugs?.trim()) doc.bugs = payload.bugs.trim()
  doc.commands = cleanCommands(payload.commands)

  writeFileSync(
    path.join(dir, 'project.yaml'),
    stringifyYaml(doc, { lineWidth: 0 }),
    'utf8',
  )
}

function ensureProjectHubDir(projectPath: string) {
  const hubDir = path.join(projectPath, '.project_hub')
  mkdirSync(hubDir, { recursive: true })

  const readme = path.join(hubDir, 'README.md')
  if (!existsSync(readme)) {
    writeFileSync(
      readme,
      [
        '# .project_hub',
        '',
        'Локальные Docker/настройки Project Hub. Не коммитить в репозиторий сайта.',
        '',
        'Положи сюда `docker-compose.yml`, `.env`, nginx/php и скрипты восстановления.',
        '',
      ].join('\n'),
      'utf8',
    )
  }

  const gitignorePath = path.join(projectPath, '.gitignore')
  const line = '/.project_hub/'
  if (existsSync(gitignorePath)) {
    const current = readFileSync(gitignorePath, 'utf8')
    if (!current.split(/\r?\n/).includes(line)) {
      appendFileSync(
        gitignorePath,
        `\n# Project Hub local docker\n${line}\n`,
      )
    }
  } else {
    writeFileSync(
      gitignorePath,
      `# Project Hub local docker\n${line}\n`,
      'utf8',
    )
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
        figma?: string
        bugs?: string
        commands?: ProjectCommands
      }

      if (!data?.name || !data?.path) continue

      projects.push({
        id: entry.name,
        name: data.name,
        path: data.path,
        url: data.url,
        port: data.port,
        figma: data.figma,
        bugs: data.bugs,
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

  ipcMain.handle('projects:openTerminal', async (_event, projectPath: string) => {
    if (!projectPath || !existsSync(projectPath)) {
      return { ok: false, error: `Path does not exist: ${projectPath}` }
    }
    const terminal = await findTerminal()
    if (!terminal) return { ok: false, error: 'No supported terminal found' }

    const { bin, args } = buildOpenTerminalArgs(terminal, projectPath)
    const child = spawn(bin, args, { detached: true, stdio: 'ignore' })
    child.unref()
    return { ok: true, terminal: bin }
  })

  ipcMain.handle('projects:gitBranch', async (_event, projectPath: string) => {
    if (!projectPath || !existsSync(projectPath)) {
      return { ok: false, branch: null, error: `Path does not exist: ${projectPath}` }
    }
    const result = await runGit(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
    if (!result.ok) {
      return { ok: false, branch: null, error: 'Не git-репозиторий или ошибка git' }
    }
    return { ok: true, branch: result.stdout }
  })

  ipcMain.handle('projects:gitPull', async (_event, projectPath: string) => {
    if (!projectPath || !existsSync(projectPath)) {
      return { ok: false, error: `Path does not exist: ${projectPath}` }
    }
    const result = await runGit(projectPath, ['pull'])
    if (!result.ok) {
      return { ok: false, error: 'Есть ошибки (git pull)' }
    }
    return { ok: true }
  })

  ipcMain.handle(
    'projects:gitPush',
    async (_event, payload: GitPushPayload) => {
      const projectPath = payload.projectPath?.trim()
      const message = payload.message?.trim()
      if (!projectPath || !existsSync(projectPath)) {
        return { ok: false, error: `Path does not exist: ${projectPath}` }
      }
      if (!message) return { ok: false, error: 'Укажите сообщение коммита' }

      const add = await runGit(projectPath, ['add', '.'])
      if (!add.ok) return { ok: false, error: 'Есть ошибки (git add)' }

      const commit = await runGit(projectPath, ['commit', '-m', message])
      if (!commit.ok) {
        // nothing to commit is still a failure for this flow
        return { ok: false, error: 'Есть ошибки (git commit)' }
      }

      const push = await runGit(projectPath, ['push'])
      if (!push.ok) return { ok: false, error: 'Есть ошибки (git push)' }

      return { ok: true }
    },
  )

  ipcMain.handle('projects:openUrl', async (_event, url: string) => {
    if (!url) return { ok: false, error: 'Missing url' }
    await shell.openExternal(url)
    return { ok: true }
  })

  ipcMain.handle('projects:pickFolder', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = win
      ? await dialog.showOpenDialog(win, {
          properties: ['openDirectory', 'createDirectory'],
        })
      : await dialog.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
        })
    if (result.canceled || !result.filePaths[0]) {
      return { ok: false as const, path: null }
    }
    return { ok: true as const, path: result.filePaths[0] }
  })

  ipcMain.handle(
    'projects:save',
    async (_event, payload: ProjectSavePayload) => {
      try {
        const name = payload.name?.trim()
        const projectPath = payload.path?.trim()
        if (!name) return { ok: false, error: 'Укажите имя проекта' }
        if (!projectPath) return { ok: false, error: 'Укажите путь к папке' }
        if (!existsSync(projectPath)) {
          return { ok: false, error: `Папка не существует: ${projectPath}` }
        }

        const id = payload.id?.trim() || uniqueProjectId(slugifyId(name))

        writeProjectYaml(id, payload)

        if (payload.createProjectHub) {
          ensureProjectHubDir(projectPath)
        }

        return { ok: true, id }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Save failed',
        }
      }
    },
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
