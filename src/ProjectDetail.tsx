import type { ReactNode } from 'react'
import type { ProjectConfig } from '../electron/types'
import { resolveProjectUrl } from '../electron/types'
import {
  IconBack,
  IconCursor,
  IconExternal,
  IconFigma,
  IconGitCommit,
  IconGitPull,
  IconGitPush,
  IconPlay,
  IconRocket,
  IconSettings,
  IconSheets,
  IconStop,
  IconSwagger,
  IconTerminal,
} from './icons'

type Props = {
  project: ProjectConfig
  onBack: () => void
  onEdit: () => void
  onRun: (command: string, label: string) => void
  onCursor: () => void
  onTerminal: () => void
  onGitPull: () => void
  onGitCommit: () => void
  onGitPush: () => void
  onOpenLink: (url: string, label?: string) => void
}

function ActionButton({
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
      className={`action-btn ${className ?? ''}`.trim()}
      onClick={onClick}
    >
      <span className="action-btn-icon">{children}</span>
      <span className="action-btn-label">{label}</span>
    </button>
  )
}

export default function ProjectDetail({
  project,
  onBack,
  onEdit,
  onRun,
  onCursor,
  onTerminal,
  onGitPull,
  onGitCommit,
  onGitPush,
  onOpenLink,
}: Props) {
  const siteUrl = resolveProjectUrl(project)

  return (
    <div className="detail">
      <div className="detail-toolbar">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconBack size={18} />
          <span>К списку</span>
        </button>
        <button type="button" className="text-btn" onClick={onEdit}>
          <IconSettings size={16} />
          <span>Настройки</span>
        </button>
      </div>

      <header className="detail-header">
        <h1>{project.name}</h1>
        <p className="detail-path" title={project.path}>
          {project.path}
        </p>
      </header>

      <section className="detail-section">
        <h3>Открыть</h3>
        <div className="detail-actions">
          <ActionButton label="Терминал" onClick={onTerminal}>
            <IconTerminal size={18} />
          </ActionButton>
          <ActionButton label="Cursor" onClick={onCursor}>
            <IconCursor size={18} />
          </ActionButton>
          {siteUrl ? (
            <ActionButton
              label="Сайт"
              className="open-site"
              onClick={() => onOpenLink(siteUrl)}
            >
              <IconExternal size={18} />
            </ActionButton>
          ) : null}
          {project.figma ? (
            <ActionButton
              label="Figma"
              className="link-figma"
              onClick={() => onOpenLink(project.figma!, 'Figma')}
            >
              <IconFigma size={18} />
            </ActionButton>
          ) : null}
          {project.bugs ? (
            <ActionButton
              label="Баг-лист"
              className="link-sheets"
              onClick={() => onOpenLink(project.bugs!, 'Bugs')}
            >
              <IconSheets size={18} />
            </ActionButton>
          ) : null}
          {project.swagger ? (
            <ActionButton
              label="Swagger"
              className="link-swagger"
              onClick={() => onOpenLink(project.swagger!, 'Swagger')}
            >
              <IconSwagger size={18} />
            </ActionButton>
          ) : null}
        </div>
      </section>

      <section className="detail-section">
        <h3>Команды</h3>
        <div className="detail-actions">
          {project.commands.dev ? (
            <ActionButton
              label="Dev"
              className="primary"
              onClick={() => onRun(project.commands.dev!, 'Dev')}
            >
              <IconPlay size={18} />
            </ActionButton>
          ) : null}
          {project.commands.stop ? (
            <ActionButton
              label="Stop"
              className="danger"
              onClick={() => onRun(project.commands.stop!, 'Stop')}
            >
              <IconStop size={18} />
            </ActionButton>
          ) : null}
          {project.commands['deploy:dev'] ? (
            <ActionButton
              label="Deploy Dev"
              className="deploy-dev"
              onClick={() =>
                onRun(project.commands['deploy:dev']!, 'Deploy Dev')
              }
            >
              <IconRocket size={18} />
            </ActionButton>
          ) : null}
          {project.commands['deploy:prod'] ? (
            <ActionButton
              label="Deploy Prod"
              className="deploy-prod"
              onClick={() =>
                onRun(project.commands['deploy:prod']!, 'Deploy Prod')
              }
            >
              <IconRocket size={18} />
            </ActionButton>
          ) : null}
          {!project.commands.dev &&
          !project.commands.stop &&
          !project.commands['deploy:dev'] &&
          !project.commands['deploy:prod'] ? (
            <p className="detail-empty">Команды не заданы</p>
          ) : null}
        </div>
      </section>

      <section className="detail-section">
        <h3>Git</h3>
        <div className="detail-actions">
          <ActionButton
            label="Pull"
            className="git-pull"
            onClick={onGitPull}
          >
            <IconGitPull size={18} />
          </ActionButton>
          <ActionButton
            label="Commit"
            className="git-commit"
            onClick={onGitCommit}
          >
            <IconGitCommit size={18} />
          </ActionButton>
          <ActionButton
            label="Push"
            className="git-push"
            onClick={onGitPush}
          >
            <IconGitPush size={18} />
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
