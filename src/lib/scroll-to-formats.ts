export const FORMATS_SECTION_ID = "formats";

/** Прокрутка к блоку «Форматы» на главной (scroll-margin на секции). */
export function scrollToFormats(behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById(FORMATS_SECTION_ID);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}
