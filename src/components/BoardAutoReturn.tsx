"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type BoardAutoReturnProps = {
  href?: string;
  delayMs?: number;
};

/** Через delayMs заменяет текущую страницу на href (для NFC-планшета). */
export default function BoardAutoReturn({
  href = "/board",
  delayMs = 10_000,
}: BoardAutoReturnProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace(href);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs, href, router]);

  return null;
}
