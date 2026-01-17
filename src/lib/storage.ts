/**
 * Универсальная функция для получения URL из хранилища
 * @param filename - название файла (например, 'poster.png')
 * @param bucket - название бакета в Storage
 */
export function getStorageImageUrl(
  filename: string | null | undefined, 
  bucket: string = 'adventures'
): string | null {
  if (!filename) return null;
  
  // Если это уже полная ссылка (например, с Vercel Blob или внешняя), возвращаем как есть
  if (filename.startsWith('http')) {
    return filename;
  }

  // Если путь начинается с /, считаем что это локальный файл в папке public
  if (filename.startsWith('/')) {
    return filename;
  }
  
  // Если это не локальный файл и не полная ссылка, формируем ссылку на Supabase
  const PROJECT_ID = 'uuhuugprmmdobmpkbjnn';
  return `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
}
