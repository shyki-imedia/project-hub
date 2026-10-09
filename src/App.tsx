import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ProjectConfig } from '../electron/types'
import { resolveProjectUrl } from '../electron/types'
import GitPushForm from './GitPushForm'
import ProjectForm from './ProjectForm'
import {
  IconCursor,
  IconExternal,
  IconGitPull,
  IconGitPush,
  IconPlay,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconSearch,
  IconSettings,
  IconStop,
  IconTerminal,
} from './icons'

type Status = { kind: 'idle' | 'ok' | 'error'; text: string }

function IconButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${className ?? ''}`.trim()}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function App() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectConfig | null>(null)
  const [pushProject, setPushProject] = useState<ProjectConfig | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.hub.listProjects()
      setProjects(list)
      setStatus({ kind: 'idle', text: '' })
    } catch (err) {
      setStatus({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Failed to load projects',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q),
    )
  }, [projects, query])

  async function run(project: ProjectConfig, command: string, label: string) {
    setStatus({ kind: 'idle', text: `${label}: ${project.name}…` })
    const result = await window.hub.runCommand({
      projectPath: project.path,
      command,
    })
    if (result.ok) {
      setStatus({ kind: 'ok', text: `${label} → ${result.terminal}` })
    } else {
      setStatus({ kind: 'error', text: result.error ?? 'Command failed' })
    }
  }

  async function openCursor(project: ProjectConfig) {
    const result = await window.hub.openCursor(project.path)
    setStatus(
      result.ok
        ? { kind: 'ok', text: `Cursor: ${project.name}` }
        : { kind: 'error', text: result.error ?? 'Failed to open Cursor' },
    )
  }

  async function openTerminal(project: ProjectConfig) {
    const result = await window.hub.openTerminal(project.path)
    setStatus(
      result.ok
        ? { kind: 'ok', text: `Terminal: ${result.terminal}` }
        : { kind: 'error', text: result.error ?? 'Failed to open terminal' },
    )
  }

  async function gitPull(project: ProjectConfig) {
    setStatus({ kind: 'idle', text: `git pull: ${project.name}…` })
    const result = await window.hub.gitPull(project.path)
    setStatus(
      result.ok
        ? { kind: 'ok', text: `Pull ok — ${project.name}` }
        : { kind: 'error', text: result.error ?? 'Есть ошибки' },
    )
  }

  async function openSite(project: ProjectConfig) {
    const url = resolveProjectUrl(project)
    if (!url) return
    const result = await window.hub.openUrl(url)
    setStatus(
      result.ok
        ? { kind: 'ok', text: url }
        : { kind: 'error', text: result.error ?? 'Failed to open URL' },
    )
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(project: ProjectConfig) {
    setEditing(project)
    setFormOpen(true)
  }

  async function onSaved(id: string) {
    setFormOpen(false)
    setEditing(null)
    await refresh()
    setStatus({ kind: 'ok', text: `Сохранено: ${id}` })
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Project Hub</h1>
          <p>Запуск, деплой и открытие проектов</p>
        </div>
        <div className="header-actions">
          <IconButton label="Добавить проект" className="primary" onClick={openCreate}>
            <IconPlus />
          </IconButton>
          <IconButton
            label="Refresh"
            className="ghost"
            onClick={() => void refresh()}
          >
            <IconRefresh />
          </IconButton>
        </div>
      </header>

      <div className="toolbar">
        <label className="search">
          <IconSearch />
          <input
            type="search"
            placeholder="Поиск проекта…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={`status ${status.kind !== 'idle' ? status.kind : ''}`}>
        {status.text}
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          {projects.length === 0 ? (
            <>
              Нет проектов. Нажмите <strong>+</strong>, чтобы добавить.
            </>
          ) : (
            'Ничего не найдено'
          )}
        </p>
      ) : (
        <div className="grid">
          {filtered.map((project) => {
            const siteUrl = resolveProjectUrl(project)
            return (
              <article key={project.id} className="card">
                <div className="card-top">
                  <h2 title={project.path}>{project.name}</h2>
                  <div className="card-meta">
                    <IconButton
                      label="Настройки"
                      onClick={() => openEdit(project)}
                    >
                      <IconSettings />
                    </IconButton>
                    <IconButton
                      label="Открыть терминал"
                      onClick={() => void openTerminal(project)}
                    >
                      <IconTerminal />
                    </IconButton>
                    {siteUrl ? (
                      <IconButton
                        label={`Открыть ${siteUrl}`}
                        className="open-site"
                        onClick={() => void openSite(project)}
                      >
                        <IconExternal />
                      </IconButton>
                    ) : null}
                  </div>
                </div>

                <div className="card-actions">
                  {project.commands.dev ? (
                    <IconButton
                      label="Dev"
                      className="primary"
                      onClick={() =>
                        void run(project, project.commands.dev!, 'Dev')
                      }
                    >
                      <IconPlay />
                    </IconButton>
                  ) : null}
                  {project.commands.stop ? (
                    <IconButton
                      label="Stop"
                      className="danger"
                      onClick={() =>
                        void run(project, project.commands.stop!, 'Stop')
                      }
                    >
                      <IconStop />
                    </IconButton>
                  ) : null}
                  {project.commands['deploy:dev'] ? (
                    <IconButton
                      label="Deploy Dev"
                      className="deploy-dev"
                      onClick={() =>
                        void run(
                          project,
                          project.commands['deploy:dev']!,
                          'Deploy Dev',
                        )
                      }
                    >
                      <IconRocket />
                    </IconButton>
                  ) : null}
                  {project.commands['deploy:prod'] ? (
                    <IconButton
                      label="Deploy Prod"
                      className="deploy-prod"
                      onClick={() =>
                        void run(
                          project,
                          project.commands['deploy:prod']!,
                          'Deploy Prod',
                        )
                      }
                    >
                      <IconRocket />
                    </IconButton>
                  ) : null}
                  <IconButton
                    label="Open in Cursor"
                    onClick={() => void openCursor(project)}
                  >
                    <IconCursor />
                  </IconButton>
                  <IconButton
                    label="git pull"
                    className="git-pull"
                    onClick={() => void gitPull(project)}
                  >
                    <IconGitPull />
                  </IconButton>
                  <IconButton
                    label="git push"
                    className="git-push"
                    onClick={() => setPushProject(project)}
                  >
                    <IconGitPush />
                  </IconButton>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {formOpen ? (
        <ProjectForm
          initial={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={(id) => void onSaved(id)}
        />
      ) : null}

      {pushProject ? (
        <GitPushForm
          project={pushProject}
          onClose={() => setPushProject(null)}
          onDone={(ok, text) => {
            setPushProject(null)
            setStatus({ kind: ok ? 'ok' : 'error', text })
          }}
        />
      ) : null}
    </div>
  )
}
