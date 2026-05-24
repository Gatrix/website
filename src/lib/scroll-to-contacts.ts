export const CONTACTS_SECTION_ID = "contacts";

/** Прокрутка к блоку контактов на главной (с учётом фиксированной шапки через scroll-margin на секции). */
export function scrollToContacts(behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById(CONTACTS_SECTION_ID);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}
