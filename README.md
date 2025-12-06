# Medium Read Local
<img width="883" height="214" alt="image" src="https://github.com/user-attachments/assets/f9ca3727-b417-4081-936e-0fa68e21e500" />

## Что делает
- Добавляет статьям "Member-only" доп. опцию для чтения через локальный Freedium: `http://localhost:6752/<оригинальный URL>`.
- Срабатывает и на Medium, и на блогах с кастомными доменами (Исключение .ru домены).

## Установка
1. Скачайте или распакуйте проект в удобную папку.
2. В Chrome/Chromium откройте `chrome://extensions/`, включите режим разработчика.
3. Нажмите `Load unpacked` и выберите папку проекта.

## Требование
- Локальный freedium должен быть запущен на `http://localhost:6752/` (значение задается в `content.js` через `LOCAL_PREFIX`).
