import { useEffect, useState, type FormEvent } from 'react'
import type { ProjectConfig } from '../electron/types'

type Props = {
  project: ProjectConfig
  onClose: () => void
  onDone: (ok: boolean, text: string) => void
}

export default function GitCommitForm({ project, onClose, onDone }: Props) {
  const [branch, setBranch] = useState('…')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const result = await window.hub.gitBranch(project.path)
      if (cancelled) return
      if (!result.ok || !result.branch) {
        setError(result.error ?? 'Не удалось получить ветку')
        setBranch('—')
      } else {
        setBranch(result.branch)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [project.path])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Укажите сообщение коммита')
      return
    }
    setSaving(true)
    setError('')
    const result = await window.hub.gitCommit({
      projectPath: project.path,
      message: message.trim(),
    })
    setSaving(false)
    if (!result.ok) {
      onDone(false, result.error ?? 'Есть ошибки')
      return
    }
    onDone(true, `Commit ok → ${branch}`)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="git-commit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="git-commit-title">Git commit — {project.name}</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <form className="modal-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>Текущая ветка</span>
            <input value={loading ? 'загрузка…' : branch} readOnly />
          </label>

          <label className="field">
            <span>Сообщение коммита</span>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Кратко: что и зачем"
              autoFocus
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="text-btn" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={saving || loading || branch === '—'}
            >
              {saving ? 'Commit…' : 'git add · commit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
