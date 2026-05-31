/**
 * Подпись запросов к Yandex Object Storage (AWS4): presigned URL картинок и
 * серверное чтение объектов (например data/adventure-options.json).
 */

import { createHash, createHmac } from "crypto";
import { readdir } from "fs/promises";
import path from "path";

const BUCKET = process.env.YC_STORAGE_BUCKET;
const ACCESS_KEY = process.env.YC_STORAGE_ACCESS_KEY;
const SECRET_KEY = process.env.YC_STORAGE_SECRET_KEY;
const ENDPOINT = process.env.YC_STORAGE_ENDPOINT || "https://storage.yandexcloud.net";
const REGION = process.env.YC_STORAGE_REGION || "ru-central1";
const IMAGES_PREFIX = process.env.YC_STORAGE_IMAGES_PREFIX ?? "";

/** Ключи для presigned URL — работают и в dev (`npm run dev`), если заданы в .env.local */
const canPresignObjectGet = Boolean(BUCKET && ACCESS_KEY && SECRET_KEY);

/** Срок жизни presigned URL (сек). Должен быть ≥ revalidate кэша приключений. */
const PRESIGN_EXPIRES_SECONDS = Number(
  process.env.YC_STORAGE_PRESIGN_EXPIRES_SECONDS ?? 86_400
);
/** Обновлять подпись заранее, чтобы URL не протух на клиенте. */
const PRESIGN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const presignedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * AWS4 canonical URI expects each path segment URL-encoded.
 * This also makes plain public URLs work for object keys with spaces.
 */
function encodeS3Path(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function sha256hex(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function signingKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

/**
 * Подписанный GET объекта из бакета (тело ответа — текст/JSON).
 * objectKey: путь внутри бакета, например data/adventure-options.json
 */
async function s3SignedGetObject(objectKey: string): Promise<Response> {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) {
    throw new Error("YC_STORAGE credentials not set");
  }
  const endpointUrl = ENDPOINT;
  const host = new URL(endpointUrl).host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256hex("");
  const path = `/${BUCKET}/${encodeS3Path(objectKey)}`;
  const service = "s3";

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
  const signedHeaders = sortedKeys.join(";");

  const canonicalRequest = [
    "GET",
    path,
    "",
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

  const sk = signingKey(SECRET_KEY!, dateStamp, REGION, service);
  const signature = createHmac("sha256", sk).update(stringToSign).digest("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const fetchHeaders: Record<string, string> = {
    ...headers,
    authorization,
  };
  delete fetchHeaders.host;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${endpointUrl}${path}`, {
      method: "GET",
      headers: fetchHeaders,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

const IMAGE_KEY_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
export const FRONTPAGE_STORAGE_PREFIX = "photos/frontpage/";

function isImageObjectKey(key: string): boolean {
  return IMAGE_KEY_RE.test(key) && !key.endsWith("/");
}

function stripImagesPrefix(key: string): string {
  if (IMAGES_PREFIX && key.startsWith(IMAGES_PREFIX)) {
    return key.slice(IMAGES_PREFIX.length);
  }
  return key;
}

function parseListObjectsV2Keys(xml: string): string[] {
  const keys: string[] = [];
  const re = /<Key>([^<]+)<\/Key>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function parseListObjectsV2Truncated(xml: string): boolean {
  return /<IsTruncated>true<\/IsTruncated>/.test(xml);
}

function parseListObjectsV2ContinuationToken(xml: string): string | null {
  const match = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
  return match?.[1] ?? null;
}

/**
 * Подписанный ListObjectsV2 по префиксу (ключи внутри бакета, с IMAGES_PREFIX если задан).
 */
async function s3SignedListObjects(
  prefix: string,
  continuationToken?: string
): Promise<Response> {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) {
    throw new Error("YC_STORAGE credentials not set");
  }
  const endpointUrl = ENDPOINT;
  const host = new URL(endpointUrl).host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256hex("");
  const bucketPath = `/${BUCKET}`;
  const service = "s3";

  const queryParams: Record<string, string> = {
    "list-type": "2",
    prefix,
    "max-keys": "1000",
  };
  if (continuationToken) {
    queryParams["continuation-token"] = continuationToken;
  }

  const sortedQueryKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedQueryKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    "GET",
    bucketPath,
    canonicalQueryString,
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

  const sk = signingKey(SECRET_KEY!, dateStamp, REGION, service);
  const signature = createHmac("sha256", sk).update(stringToSign).digest("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const fetchHeaders: Record<string, string> = {
    ...headers,
    authorization,
  };
  delete fetchHeaders.host;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${endpointUrl}${bucketPath}?${canonicalQueryString}`, {
      method: "GET",
      headers: fetchHeaders,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function listS3ObjectKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await s3SignedListObjects(prefix, continuationToken);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[storage] LIST ${prefix} → ${res.status}: ${text.slice(0, 200)}`);
      break;
    }
    const xml = await res.text();
    keys.push(...parseListObjectsV2Keys(xml));
    if (!parseListObjectsV2Truncated(xml)) break;
    continuationToken = parseListObjectsV2ContinuationToken(xml) ?? undefined;
  } while (continuationToken);

  return keys;
}

async function listLocalPublicKeys(prefix: string): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", ...prefix.split("/").filter(Boolean));
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && isImageObjectKey(entry.name))
      .map((entry) => `${prefix}${entry.name}`);
  } catch {
    return [];
  }
}

/**
 * Все ключи объектов с заданным префиксом (например photos/frontpage/).
 * S3 при наличии YC_STORAGE_*; иначе — файлы из public/{prefix}.
 */
export async function listObjectStorageKeys(prefix: string): Promise<string[]> {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const storagePrefix = IMAGES_PREFIX
    ? `${IMAGES_PREFIX}${normalizedPrefix}`
    : normalizedPrefix;

  const rawKeys = canPresignObjectGet
    ? await listS3ObjectKeys(storagePrefix)
    : await listLocalPublicKeys(normalizedPrefix);

  return rawKeys
    .map(stripImagesPrefix)
    .filter((key) => key.startsWith(normalizedPrefix) && isImageObjectKey(key))
    .sort((a, b) => a.localeCompare(b, "ru"));
}

/** Все изображения из photos/frontpage/ в object storage (или public/ в dev). */
export async function listFrontpagePhotoKeys(): Promise<string[]> {
  return listObjectStorageKeys(FRONTPAGE_STORAGE_PREFIX);
}

/**
 * Считать UTF-8 текст объекта из бакета (нужны YC_STORAGE_* ключи).
 * @param objectKey полный ключ, например data/adventure-options.json
 */
export async function readObjectStorageText(objectKey: string): Promise<string | null> {
  if (!canPresignObjectGet) return null;
  try {
    const res = await s3SignedGetObject(objectKey);
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      console.error(`[storage] GET ${objectKey} → ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    return res.text();
  } catch (err) {
    console.error(`[storage] readObjectStorageText ${objectKey}:`, err);
    return null;
  }
}

/**
 * Генерирует подписанный URL для GET к объекту в бакете.
 *
 * @param objectKey — путь к объекту, например posters/X.webp
 */
export function getPresignedGetUrl(
  objectKey: string,
  expiresInSeconds = PRESIGN_EXPIRES_SECONDS
): string | null {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) return null;

  const cached = presignedUrlCache.get(objectKey);
  if (cached && Date.now() < cached.expiresAt - PRESIGN_REFRESH_BUFFER_MS) {
    return cached.url;
  }

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

  const canonicalUri = `/${BUCKET}/${encodeS3Path(objectKey)}`;
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
  const url = `${baseUrl}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  presignedUrlCache.set(objectKey, {
    url,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}

const IMAGES_BASE =
  process.env.YC_STORAGE_IMAGES_BASE ||
  process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE;
const PUBLIC_IMAGES_PREFIX =
  process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX ?? "";

/**
 * URL изображения (только на сервере).
 * 1) Публичный бакет: YC_STORAGE_IMAGES_BASE или NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE
 * 2) Приватный бакет: YC_STORAGE_* ключи → presigned URL (в т.ч. в dev)
 * 3) Иначе локальный файл из public/ (например public/posters/...)
 */
export function getStorageImageUrl(
  filename: string | null | undefined
): string | null {
  if (!filename) return null;

  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/")) return filename;

  if (IMAGES_BASE) {
    const base = IMAGES_BASE.replace(/\/$/, "");
    const path =
      PUBLIC_IMAGES_PREFIX && !filename.startsWith(PUBLIC_IMAGES_PREFIX)
        ? `${PUBLIC_IMAGES_PREFIX}${filename}`
        : filename;
    return `${base}/${encodeS3Path(path)}`;
  }

  if (canPresignObjectGet) {
    const objectKey = IMAGES_PREFIX ? `${IMAGES_PREFIX}${filename}` : filename;
    const signed = getPresignedGetUrl(objectKey);
    if (signed) return signed;
  }

  return `/${filename}`;
}

export function isUsingObjectStorage(): boolean {
  return canPresignObjectGet;
}
