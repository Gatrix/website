/**
 * Клиент для чтения/записи JSON-файлов.
 * Использует Yandex Object Storage (S3 API), если заданы переменные окружения.
 * Иначе — локальная папка public/data/ (зеркало бакета, для разработки).
 *
 * Реализует AWS4 signing вручную через Node.js crypto, чтобы избежать
 * несовместимости AWS SDK v3 с Yandex Object Storage (лишние заголовки в подписи).
 */

import { createHash, createHmac } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const BUCKET = process.env.YC_STORAGE_BUCKET;
const ACCESS_KEY = process.env.YC_STORAGE_ACCESS_KEY;
const SECRET_KEY = process.env.YC_STORAGE_SECRET_KEY;
const ENDPOINT = process.env.YC_STORAGE_ENDPOINT || "https://storage.yandexcloud.net";
const REGION = process.env.YC_STORAGE_REGION || "ru-central1";
// Префикс пути внутри бакета, например "data/" если файлы лежат в папке data/
const PREFIX = process.env.YC_STORAGE_PREFIX ?? "";
// Префикс для изображений. По умолчанию изображения лежат в корне бакета.
const IMAGES_PREFIX = process.env.YC_STORAGE_IMAGES_PREFIX ?? "";

// Локальный запуск (обычно npm run dev): читаем данные и картинки из public/.
// Продакшен: используем Object Storage / публичную базу изображений.
const isLocalRuntime = process.env.NODE_ENV !== "production";
const useObjectStorage = !isLocalRuntime && Boolean(BUCKET && ACCESS_KEY && SECRET_KEY);

// ── AWS4 Signing ────────────────────────────────────────────────────────────

function sha256hex(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function signingKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate    = hmac(`AWS4${secret}`, date);
  const kRegion  = hmac(kDate,          region);
  const kService = hmac(kRegion,        service);
  return         hmac(kService,        "aws4_request");
}

async function s3Fetch(
  method: "GET" | "PUT",
  objectKey: string,
  body?: string
): Promise<Response> {
  const endpointUrl = ENDPOINT;
  const host = new URL(endpointUrl).host;
  const now = new Date();
  const amzDate   = now.toISOString().replace(/[:\-]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256hex(body ?? "");
  const path = `/${BUCKET}/${objectKey}`;
  const service = "s3";

  // Только стандартные заголовки — ничего лишнего
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (body) {
    headers["content-type"] = "application/json; charset=utf-8";
  }

  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
  const signedHeaders    = sortedKeys.join(";");

  const canonicalRequest = [
    method,
    path,
    "",            // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const key = signingKey(SECRET_KEY!, dateStamp, REGION, service);
  const signature = createHmac("sha256", key).update(stringToSign).digest("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const fetchHeaders: Record<string, string> = {
    ...headers,
    authorization,
  };
  delete fetchHeaders.host; // Node.js fetch управляет Host сам

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${endpointUrl}${path}`, {
      method,
      headers: fetchHeaders,
      body: body ?? undefined,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Object Storage ──────────────────────────────────────────────────────────

async function readFromS3(key: string): Promise<string | null> {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) return null;
  try {
    const res = await s3Fetch("GET", `${PREFIX}${key}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      console.error(`[storage] S3 GET ${key} → ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`S3 GET failed: ${res.status}`);
    }
    return res.text();
  } catch (err) {
    console.error(`[storage] S3 getObject ${key}:`, err);
    throw err;
  }
}

async function writeToS3(key: string, body: string): Promise<void> {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) throw new Error("YC_STORAGE credentials not set");
  const res = await s3Fetch("PUT", `${PREFIX}${key}`, body);
  if (!res.ok) {
    const text = await res.text();
    console.error(`[storage] S3 PUT ${key} → ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`S3 PUT failed: ${res.status}`);
  }
}

// ── Local FS (dev fallback) ─────────────────────────────────────────────────

async function readFromFs(key: string): Promise<string | null> {
  try {
    const path = join(process.cwd(), "public", "data", key);
    return await readFile(path, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    console.error(`[storage] fs read ${key}:`, err);
    throw err;
  }
}

async function writeToFs(key: string, body: string): Promise<void> {
  const path = join(process.cwd(), "public", "data", key);
  await mkdir(join(process.cwd(), "public", "data"), { recursive: true });
  await writeFile(path, body, "utf-8");
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Читает JSON из локального public/data/ (игнорирует Object Storage).
 * Используется как fallback, когда основной источник пуст.
 */
export async function readJsonFromLocal<T>(key: string): Promise<T | null> {
  const raw = await readFromFs(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Читает JSON-файл. Источник: Object Storage или локальный public/data/.
 * При пустом результате или ошибке из основного источника пробует локальный fallback.
 */
export async function readJson<T>(key: string): Promise<T | null> {
  let parsed: T | null = null;
  try {
    const raw = useObjectStorage ? await readFromS3(key) : await readFromFs(key);
    if (raw != null) {
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        parsed = null;
      }
    }
  } catch (err) {
    console.error(`[storage] readJson ${key} from primary source failed:`, err);
  }
  // Fallback: если Object Storage пуст/ошибка — читаем из public/data/
  if (parsed == null && useObjectStorage) {
    parsed = await readJsonFromLocal<T>(key);
    if (parsed != null) {
      console.info(`[storage] readJson ${key} using local fallback`);
    }
  }
  return parsed;
}

/**
 * Записывает JSON-файл. Источник: Object Storage или локальный public/data/.
 */
export async function writeJson<T>(key: string, data: T): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  if (useObjectStorage) {
    await writeToS3(key, body);
  } else {
    await writeToFs(key, body);
  }
}

/**
 * true, если используется Yandex Object Storage.
 */
export function isUsingObjectStorage(): boolean {
  return useObjectStorage;
}

// ── Presigned URL (для приватного бакета) ────────────────────────────────────

/**
 * Генерирует подписанный URL для GET-запроса к объекту.
 * Браузер может загрузить картинку по этой ссылке без публичного доступа к бакету.
 * Ссылка действует expiresInSeconds (по умолчанию 1 час).
 *
 * @param objectKey — путь к объекту в бакете, например "posters/X.webp"
 */
export function getPresignedGetUrl(
  objectKey: string,
  expiresInSeconds = 3600
): string | null {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) return null;

  const host = new URL(ENDPOINT || "https://storage.yandexcloud.net").host;
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${service}/aws4_request`;
  const credential = `${ACCESS_KEY}/${credentialScope}`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQueryString = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k])}`)
    .join("&");

  const canonicalUri = `/${BUCKET}/${objectKey}`;
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQueryString,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const key = signingKey(SECRET_KEY!, dateStamp, REGION, service);
  const signature = createHmac("sha256", key).update(stringToSign).digest("hex");

  const baseUrl = `${ENDPOINT}${canonicalUri}`;
  return `${baseUrl}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// Runtime env (Docker) или build-time (NEXT_PUBLIC_)
const IMAGES_BASE =
  process.env.YC_STORAGE_IMAGES_BASE ||
  process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE;
const PUBLIC_IMAGES_PREFIX =
  process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX ?? "";

/**
 * Возвращает URL изображения. Вызывать только на сервере (server actions).
 * При YC_STORAGE credentials — подписанный URL (приватный бакет).
 * Иначе — публичный или локальный URL.
 */
export function getStorageImageUrl(
  filename: string | null | undefined
): string | null {
  if (!filename) return null;

  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/")) return filename;

  // В локальной среде всегда используем локальные файлы из public/.
  if (isLocalRuntime) {
    return `/${filename}`;
  }

  // Публичный бакет: при заданном IMAGES_BASE используем прямые ссылки
  if (IMAGES_BASE) {
    const base = IMAGES_BASE.replace(/\/$/, "");
    // filename уже может содержать posters/ — не дублируем префикс
    const path = PUBLIC_IMAGES_PREFIX && !filename.startsWith(PUBLIC_IMAGES_PREFIX)
      ? `${PUBLIC_IMAGES_PREFIX}${filename}`
      : filename;
    return `${base}/${path}`;
  }

  // Приватный бакет: presigned URL
  if (useObjectStorage) {
    const objectKey = IMAGES_PREFIX ? `${IMAGES_PREFIX}${filename}` : filename;
    const signed = getPresignedGetUrl(objectKey);
    if (signed) return signed;
  }

  return `/${filename}`;
}
