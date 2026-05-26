import { writeFileSync } from "fs";

const adventures = {
  "key-to-the-underhill": ["dnd5e", "dungeon-crawl-classics"],
  "wedding-at-heather-ford": ["dnd5e", "warhammer-fantasy-4e"],
  "archives-of-a-forgotten-century": ["dnd5e", "dungeon-crawl-classics"],
  "atomic-resort": ["savage-worlds", "fate"],
  "battle-at-helms-deep": ["dnd5e", "warhammer-fantasy-4e"],
  "raven-seal": ["dnd5e", "warhammer-fantasy-4e"],
  "shadow-over-waterdeep": ["dnd5e", "pathfinder2e"],
  "the-returned-drakkar": ["savage-worlds", "dnd5e"],
  "emission-at-agroprom": ["savage-worlds", "gurps"],
  "the-guillotine-does-not-wait": ["savage-worlds", "blades-in-the-dark"],
  "jazz-on-bones": ["coc7", "blades-in-the-dark"],
  "road-for-a-dead-man": ["savage-worlds", "fate"],
  "dragons-rule": ["dnd5e", "pathfinder2e"],
  "dont-return-her": ["dnd5e", "dungeon-world"],
  "golden-dew": ["coc7", "savage-worlds"],
  "map-without-an-island": ["savage-worlds", "fate"],
  "book-without-a-cover": ["coc7", "delta-green"],
  "dead-loop": ["coc7", "dnd5e"],
  "hammer-and-ash": ["savage-worlds", "gurps"],
  "our-synthetic-paradise": ["cyberpunk-red", "shadowrun"],
  "samurai-without-a-master": ["savage-worlds", "gurps"],
  "sands-of-the-golden-city": ["savage-worlds", "fate"],
  "ashes-of-the-jedi": ["savage-worlds", "fate"],
  "curse-of-strahd": ["dnd5e", "pathfinder2e"],
  "curse-of-the-black-bridge": ["dnd5e", "coc7"],
  "dusty-cauldron": ["savage-worlds", "fate"],
  "annuminas-ruins": ["dnd5e", "warhammer-fantasy-4e"],
  "heart-of-anubis": ["savage-worlds", "gurps"],
  "ave-caesar": ["savage-worlds", "gurps"],
  "tavern-on-the-edge-of-the-world": ["dnd5e", "pathfinder2e"],
  "mystery-of-kholatchakhl": ["coc7", "blades-in-the-dark"],
  "zimmermann-telegram": ["savage-worlds", "gurps"],
  "shadow-of-angmar": ["dnd5e", "warhammer-fantasy-4e"],
  "shadow-over-a-puddle": ["dnd5e", "dungeon-world"],
  "silent-cargo": ["savage-worlds", "fate"],
  "thin-blue-line": ["dnd5e", "blades-in-the-dark"],
  "callix-hive": ["warhammer-40k-wrath-and-glory", "savage-worlds"],
  "black-bell": ["witcher-rpg", "dnd5e"],
  "electric-angel": ["coc7", "savage-worlds"],
  "elf-dwarf-and-a-bad-idea": ["dnd5e", "pathfinder2e"],
  "i-am-a-monster": ["coc7", "dnd5e"],
};

const ORIGINAL = ["original-full", "original-simple"];
const values = [];

for (const [adv, bases] of Object.entries(adventures)) {
  const ids = [...ORIGINAL];
  for (const b of bases.slice(0, 3)) {
    ids.push(b, `${b}-simple`);
  }
  for (const id of ids) {
    values.push(`  ('${adv}', '${id}')`);
  }
}

const sql = `-- adventure_gamesystems: авторская (полная + упрощ.) + до 3 пар систем на приключение
-- Применение: sudo -u postgres psql -d adventurespool -f adventure-gamesystems.sql
-- TRUNCATE adventure_gamesystems;

INSERT INTO adventure_gamesystems (adventure_id, gamesystem_id) VALUES
${values.join(",\n")}
ON CONFLICT (adventure_id, gamesystem_id) DO NOTHING;
`;

writeFileSync("db/seed/adventure-gamesystems.sql", sql, "utf8");
console.log(`Wrote ${Object.keys(adventures).length} adventures, ${values.length} rows`);
