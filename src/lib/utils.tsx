import React from "react";
import { Sword, Ghost, Rocket, Scroll, Dices, Map } from "lucide-react";

/**
 * Возвращает иконку Lucide в зависимости от сеттинга приключения
 */
export const getIconBySetting = (setting?: string) => {
  const settingLower = setting?.toLowerCase() || "";
  if (settingLower.includes("фэнтези") || settingLower.includes("фентези") || settingLower.includes("fantasy")) return <Sword />;
  if (settingLower.includes("техноген") || settingLower.includes("sci-fi") || settingLower.includes("cyber") || settingLower.includes("фантастика") || settingLower.includes("science")) return <Rocket />;
  if (settingLower.includes("реализм") || settingLower.includes("modern") || settingLower.includes("современность")) return <Map />;
  if (settingLower.includes("ужас") || settingLower.includes("horror") || settingLower.includes("cthulhu") || settingLower.includes("мистика")) return <Ghost />;
  if (settingLower.includes("steampunk") || settingLower.includes("steam")) return <Map />;
  if (settingLower.includes("western") || settingLower.includes("west")) return <Dices />;
  if (settingLower.includes("scroll") || settingLower.includes("cthulhu")) return <Scroll />;
  return <Sword />;
};
