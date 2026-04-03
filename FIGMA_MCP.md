# Figma MCP

В этом репозитории Figma MCP уже подключён в двух местах:

- `/.vscode/mcp.json` — сервер `Figma-MCP` для IDE
- `frontend/index.html` — подключение capture-скрипта `https://mcp.figma.com/mcp/html-to-design/capture.js`

## Что нужно для работы

1. Открыть репозиторий в VS Code / JetBrains-WS с поддержкой MCP.
2. Убедиться, что `.vscode/mcp.json` подхватился IDE.
3. При первом подключении ввести Figma access token, который IDE запросит как скрытый input.
4. Запустить фронтенд локально и открыть страницу в браузере.

## Локальный запуск

```bash
cd /Users/jasureshonov/Documents/GitHub/mezon_admin/frontend
npm install
npm run dev
```

После этого откройте приложение по адресу из Vite, обычно это `http://localhost:5173/`.

## Как проверить, что всё работает

- В IDE должен появиться сервер `Figma-MCP`.
- В браузере должен загружаться capture-скрипт Figma без ошибок в консоли.
- При открытии страницы должен быть доступен сценарий html-to-design capture.

## Если что-то не работает

- Если сервер `Figma-MCP` отвечает `Unauthorized`, заново пройдите запрос токена в IDE и убедитесь, что это именно Figma access token, а не Render или другой API key.
- Проверьте, что сеть не блокирует `https://mcp.figma.com`.
- Убедитесь, что в браузере не блокируются сторонние скрипты.
- Перезагрузите окно VS Code после правки `.vscode/mcp.json`.
- Если capture-скрипт нужен только для локальной разработки, не отключайте его при проверке дизайна в браузере.

