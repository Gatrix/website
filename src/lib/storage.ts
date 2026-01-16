// Твой ID проекта из Supabase (взят из твоего URL)
const PROJECT_ID = 'uuhuugprmmdobmpkbjnn';

// Используем переменную окружения для URL, если есть, иначе формируем дефолтный
const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : `https://${PROJECT_ID}.supabase.co/storage/v1/object/public`;

const STORAGE_URL = BASE_URL;

/**
 * Универсальная функция для получения URL из Supabase Storage
 * @param filename - название файла (например, 'poster.png')
 * @param bucket - название бакета в Storage
 */
export function getStorageImageUrl(
  filename: string | null | undefined, 
  bucket: string = 'adventures'
): string | null {
  if (!filename) return null;
  
  // Если это уже полная ссылка, возвращаем как есть
  if (filename.startsWith('http')) {
    return filename;
  }

  // Если путь начинается с /, считаем что это локальный файл в папке public
  if (filename.startsWith('/')) {
    return filename;
  }
  
  // Формируем прямую ссылку на Supabase Storage
  return `${STORAGE_URL}/${bucket}/${filename}`;
}