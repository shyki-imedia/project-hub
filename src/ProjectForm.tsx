import { useEffect, useState, type FormEvent } from 'react'
import type { ProjectConfig, ProjectSavePayload } from '../electron/types'

type Props = {
  initial?: ProjectConfig | null
  onClose: () => void
  onSaved: (id: string) => void
}

type FormState = {
  name: string
  path: string
  url: string
  port: string
  figma: string
  bugs: string
  swagger: string
  commandDev: string
  commandStop: string
  commandDeployDev: string
  commandDeployProd: string
  createProjectHub: boolean
}

function fromProject(project?: ProjectConfig | null): FormState {
  return {
    name: project?.name ?? '',
    path: project?.path ?? '',
    url: project?.url ?? '',
    port: project?.port != null ? String(project.port) : '',
    figma: project?.figma ?? '',
    bugs: project?.bugs ?? '',
    swagger: project?.swagger ?? '',
    commandDev: project?.commands.dev ?? '',
    commandStop: project?.commands.stop ?? '',
    commandDeployDev: project?.commands['deploy:dev'] ?? '',
    commandDeployProd: project?.commands['deploy:prod'] ?? '',
    createProjectHub: !project,
  }
}

export default function ProjectForm({ initial, onClose, onSaved }: Props) {
  const editing = Boolean(initial?.id)
  const [form, setForm] = useState<FormState>(() => fromProject(initial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(fromProject(initial))
    setError('')
  }, [initial])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function pickPath() {
    const result = await window.hub.pickFolder()
    if (result.ok && result.path) setField('path', result.path)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const portRaw = form.port.trim()
    const port = portRaw ? Number(portRaw) : undefined
    if (portRaw && (Number.isNaN(port) || port! <= 0)) {
      setError('PORT должен быть числом')
      setSaving(false)
      return
    }

    const commands: ProjectSavePayload['commands'] = {}
    if (form.commandDev.trim()) commands.dev = form.commandDev.trim()
    if (form.commandStop.trim()) commands.stop = form.commandStop.trim()
    if (form.commandDeployDev.trim()) {
      commands['deploy:dev'] = form.commandDeployDev.trim()
    }
    if (form.commandDeployProd.trim()) {
      commands['deploy:prod'] = form.commandDeployProd.trim()
    }

    const payload: ProjectSavePayload = {
      id: initial?.id,
      name: form.name,
      path: form.path,
      url: form.url.trim() || undefined,
      port,
      figma: form.figma.trim() || undefined,
      bugs: form.bugs.trim() || undefined,
      swagger: form.swagger.trim() || undefined,
      commands,
      createProjectHub: form.createProjectHub,
    }

    const result = await window.hub.saveProject(payload)
    setSaving(false)
    if (!result.ok || !result.id) {
      setError(result.error ?? 'Не удалось сохранить')
      return
    }
    onSaved(result.id)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="project-form-title">
            {editing ? 'Редактировать проект' : 'Добавить проект'}
          </h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <form className="modal-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>Имя</span>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Дымов керамика"
            />
          </label>

          <label className="field">
            <span>Папка проекта</span>
            <div className="path-row">
              <input
                required
                value={form.path}
                onChange={(e) => setField('path', e.target.value)}
                placeholder="/run/media/shyki/WORK2/my-app"
              />
              <button
                type="button"
                className="text-btn"
                onClick={() => void pickPath()}
              >
                Выбрать…
              </button>
            </div>
          </label>

          <div className="field-row">
            <label className="field">
              <span>URL</span>
              <input
                value={form.url}
                onChange={(e) => setField('url', e.target.value)}
                placeholder="http://localhost:8088"
              />
            </label>
            <label className="field">
              <span>PORT</span>
              <input
                value={form.port}
                onChange={(e) => setField('port', e.target.value)}
                placeholder="3000"
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="field">
            <span>Макет (Figma)</span>
            <input
              value={form.figma}
              onChange={(e) => setField('figma', e.target.value)}
              placeholder="https://www.figma.com/design/…"
            />
          </label>

          <label className="field">
            <span>Баг-лист (Google Sheets)</span>
            <input
              value={form.bugs}
              onChange={(e) => setField('bugs', e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/…"
            />
          </label>

          <label className="field">
            <span>Swagger</span>
            <input
              value={form.swagger}
              onChange={(e) => setField('swagger', e.target.value)}
              placeholder="http://localhost:8080/swagger"
            />
          </label>

          <label className="field">
            <span>Dev</span>
            <input
              value={form.commandDev}
              onChange={(e) => setField('commandDev', e.target.value)}
              placeholder="pnpm dev"
            />
          </label>

          <label className="field">
            <span>Stop</span>
            <input
              value={form.commandStop}
              onChange={(e) => setField('commandStop', e.target.value)}
              placeholder="docker compose -f .project_hub/docker-compose.yml down"
            />
          </label>

          <label className="field">
            <span>Deploy Dev</span>
            <input
              value={form.commandDeployDev}
              onChange={(e) => setField('commandDeployDev', e.target.value)}
              placeholder="pnpm deploy:dev"
            />
          </label>

          <label className="field">
            <span>Deploy Prod</span>
            <input
              value={form.commandDeployProd}
              onChange={(e) => setField('commandDeployProd', e.target.value)}
              placeholder="pnpm deploy:prod"
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={form.createProjectHub}
              onChange={(e) => setField('createProjectHub', e.target.checked)}
            />
            <span>
              Создать папку с настройками <code>.project_hub</code>
            </span>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="text-btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
