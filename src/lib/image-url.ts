/** Presigned S3 URLs cannot go through next/image optimization (signature in query string). */
export function shouldBypassImageOptimization(src: string): boolean {
  if (!src || src.startsWith("/")) return false;
  try {
    const u = new URL(src);
    return u.searchParams.has("X-Amz-Signature") || u.searchParams.has("X-Amz-Algorithm");
  } catch {
    return true;
  }
}
