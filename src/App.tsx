import { useCallback, useEffect, useState } from 'react'
import type { ProjectConfig } from '../electron/types'

type Status = { kind: 'idle' | 'ok' | 'error'; text: string }

export default function App() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })

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

  async function run(project: ProjectConfig, command: string, label: string) {
    setStatus({ kind: 'idle', text: `Running ${label}…` })
    const result = await window.hub.runCommand({
      projectPath: project.path,
      command,
    })
    if (result.ok) {
      setStatus({ kind: 'ok', text: `${label} opened in ${result.terminal}` })
    } else {
      setStatus({ kind: 'error', text: result.error ?? 'Command failed' })
    }
  }

  async function openCursor(project: ProjectConfig) {
    setStatus({ kind: 'idle', text: `Opening ${project.name} in Cursor…` })
    const result = await window.hub.openCursor(project.path)
    if (result.ok) {
      setStatus({ kind: 'ok', text: `Opened ${project.name} in Cursor` })
    } else {
      setStatus({ kind: 'error', text: result.error ?? 'Failed to open Cursor' })
    }
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Project Hub</h1>
          <p>Запуск, деплой и открытие проектов в Cursor</p>
        </div>
        <button type="button" className="ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>

      <div className={`status ${status.kind !== 'idle' ? status.kind : ''}`}>
        {status.text}
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="empty">
          Нет проектов. Добавьте <code>projects/&lt;id&gt;/project.yaml</code>
        </p>
      ) : (
        <div className="list">
          {projects.map((project) => (
            <article key={project.id} className="project">
              <div className="project-meta">
                <h2>{project.name}</h2>
                <div className="path">{project.path}</div>
              </div>
              <div className="actions">
                {project.commands.dev ? (
                  <button
                    type="button"
                    className="primary"
                    onClick={() =>
                      void run(project, project.commands.dev!, 'Dev')
                    }
                  >
                    Dev
                  </button>
                ) : null}
                {project.commands.stop ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      void run(project, project.commands.stop!, 'Stop')
                    }
                  >
                    Stop
                  </button>
                ) : null}
                {project.commands['deploy:dev'] ? (
                  <button
                    type="button"
                    onClick={() =>
                      void run(
                        project,
                        project.commands['deploy:dev']!,
                        'Deploy Dev',
                      )
                    }
                  >
                    Deploy Dev
                  </button>
                ) : null}
                {project.commands['deploy:prod'] ? (
                  <button
                    type="button"
                    onClick={() =>
                      void run(
                        project,
                        project.commands['deploy:prod']!,
                        'Deploy Prod',
                      )
                    }
                  >
                    Deploy Prod
                  </button>
                ) : null}
                <button type="button" onClick={() => void openCursor(project)}>
                  Cursor
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
