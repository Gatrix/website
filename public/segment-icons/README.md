# Иконки и текстуры для сегментов формата игры

В карточках «Городская площадь», «Посиделки в таверне» и «Королевский приём» сейчас стоят эмодзи-плейсхолдеры. Их можно заменить на свои изображения.

## Куда вставлять

Файлы положите в `public/segment-icons/` (или `public/icons/` — путь на ваш выбор). Примеры:
- `city-square.webp` — для Городской площади
- `tavern.webp` — для Посиделок в таверне
- `royal.webp` — для Королевского приёма

## Как вставить в код

В `src/app/HomeClient.tsx` найдите блоки с комментарием `Placeholder для иконки` и замените `<div>...</div>` на:

```tsx
<Image
  src="/segment-icons/city-square.webp"
  alt="Городская площадь"
  width={48}
  height={48}
  className="mb-4 rounded-lg object-cover"
/>
```

Для Next.js `Image` нужен импорт: `import Image from "next/image";` (он уже есть в файле).

## Нюансы

1. **Формат**: WebP предпочтителен (меньше вес, хорошее качество). PNG тоже подойдёт.
2. **Размер**: Рекомендуемый размер иконки — 96×96 px или 128×128 px. Next.js оптимизирует при `width`/`height`.
3. **Фон**: Если картинка с прозрачностью — она впишется в тёмный фон. Если нет — лучше подготовить с прозрачным фоном или под цвет карточки.
4. **Текстура вместо иконки**: Можно использовать `background-image` на контейнере:
   ```tsx
   <div
     className="w-12 h-12 rounded-lg mb-4"
     style={{ backgroundImage: "url(/segment-icons/tavern-texture.webp)", backgroundSize: "cover" }}
   />
   ```
5. **Внешний CDN**: Если картинки на Yandex Object Storage или другом CDN — укажите полный URL в `src` (для Next.js может понадобиться настройка `images.remotePatterns` в `next.config.ts`).
