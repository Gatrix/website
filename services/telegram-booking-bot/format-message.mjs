const FORMAT_LABELS = {
  oneshot: "Ваншот",
  adventure: "Приключение",
  campaign: "Кампания",
};

/**
 * @param {Record<string, unknown>} body
 */
export function formatBookingMessage(body) {
  const title = String(body.adventureTitle ?? body.adventureId ?? "—");
  const lines = [
    "🎲 <b>Новая заявка на игру</b>",
    "",
    `<b>Приключение:</b> ${escapeHtml(title)}`,
  ];

  if (body.gameSystemName) {
    lines.push(`<b>Система:</b> ${escapeHtml(String(body.gameSystemName))}`);
  }
  if (body.difficultyName) {
    lines.push(`<b>Сложность:</b> ${escapeHtml(String(body.difficultyName))}`);
  }
  if (body.universeName) {
    lines.push(`<b>Вселенная:</b> ${escapeHtml(String(body.universeName))}`);
  }

  const formatId = body.adventureType;
  const formatLabel =
    (formatId && FORMAT_LABELS[/** @type {keyof typeof FORMAT_LABELS} */ (formatId)]) ||
    formatId;
  if (formatLabel) {
    lines.push(`<b>Формат:</b> ${escapeHtml(String(formatLabel))}`);
  }

  if (body.playerCount != null) {
    lines.push(`<b>Игроков:</b> ${escapeHtml(String(body.playerCount))}`);
  }
  if (body.durationHours != null) {
    lines.push(`<b>Длительность сессии:</b> ${escapeHtml(String(body.durationHours))} ч`);
  }
  if (body.startsAt) {
    lines.push(`<b>Начало игры:</b> ${escapeHtml(String(body.startsAt))}`);
  }

  if (body.phone) {
    lines.push(`<b>Телефон:</b> ${escapeHtml(String(body.phone))}`);
  }

  const note = typeof body.playerNote === "string" ? body.playerNote.trim() : "";
  if (note) {
    lines.push("", `<b>Telegram / комментарий:</b>`, escapeHtml(note));
  }

  const warnings = body.warnings;
  if (Array.isArray(warnings) && warnings.length > 0) {
    lines.push("", "<b>⚠️ Предупреждения:</b>");
    for (const w of warnings) {
      if (w) lines.push(`• ${escapeHtml(String(w))}`);
    }
  }

  if (body.requestId) {
    lines.push("", `<i>ID заявки: ${escapeHtml(String(body.requestId))}</i>`);
  }

  const created = body.createdAt;
  if (created) {
    lines.push(`<i>${escapeHtml(String(created))}</i>`);
  }

  return lines.join("\n");
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
