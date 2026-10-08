# Project Hub

Локальный Ubuntu-дашборд для управления проектами: запуск dev-сервера, деплой и открытие репозитория в Cursor.

Electron + Vite + React. Команды выполняются в системном терминале (Ptyxis / gnome-terminal и т.д.), без встроенных логов.

## Возможности

- Список проектов из YAML-конфигов
- **Dev** / **Stop** / **Deploy Dev** / **Deploy Prod** — только если команда задана в конфиге
- **Cursor** — открыть проект через `cursor -n <path>`
- Ярлык в меню приложений и Dock (`scripts/launch.sh`)

## Установка

```bash
pnpm install
pnpm approve-builds --all   # electron + esbuild (pnpm 10+)
```

## Запуск

```bash
pnpm dev      # разработка (Vite HMR + Electron)
pnpm build    # production-сборка
pnpm start    # Electron из dist/
```

Или через ярлык: `scripts/launch.sh` / «Project Hub» в Activities.

## Конфиги проектов

Папка `projects/` в git не коммитится. Создай локально:

```
projects/
  my-app/
    project.yaml
```

Пример `project.yaml`:

```yaml
name: My App
path: /absolute/path/to/repo
commands:
  dev: pnpm dev
  stop: docker compose down
  "deploy:dev": pnpm deploy:dev
  # "deploy:prod": pnpm deploy:prod
```

Кнопки появляются только для указанных ключей: `dev`, `stop`, `deploy:dev`, `deploy:prod`.


## Docker для проектов

Локальный Docker **не** кладём в корень сайта. Конвенция:

1. Все файлы стека — в `<проект>/project_hub/` (`docker-compose.yml`, `.env`, nginx/php, скрипты восстановления).
2. В `.gitignore` сайта добавить `/project_hub/`.
3. В `projects/<id>/project.yaml` команды `dev` / `stop` указывают на `project_hub/docker-compose.yml`.

## Иконка

`resources/icon.png` — иконка окна и `.desktop`-ярлыка.
