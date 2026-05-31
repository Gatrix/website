import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadEnvFile(resolve(rootDir, ".env.local"));
loadEnvFile(resolve(rootDir, ".env"));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local or run with DATABASE_URL=...");
  process.exit(1);
}

const now = new Date();
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  "-",
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0"),
].join("");

const exportDir = resolve(rootDir, "exports", `adventurespool-${stamp}`);
mkdirSync(exportDir, { recursive: true });

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 15_000,
});

try {
  const tables = await listTables();

  if (tables.length === 0) {
    console.log("No user tables found.");
    process.exit(0);
  }

  const exported = [];

  for (const table of tables) {
    const columns = await listColumns(table.schema, table.name);
    const rows = await readTable(table.schema, table.name, columns);
    const basename = safeFilename(`${table.schema}.${table.name}`);

    writeFileSync(
      join(exportDir, `${basename}.csv`),
      "\uFEFF" + toCsv(columns, rows),
      "utf8",
    );

    exported.push({
      ...table,
      columns,
      rows,
      csv: `${basename}.csv`,
    });

    console.log(`${table.schema}.${table.name}: ${rows.length} rows`);
  }

  writeFileSync(join(exportDir, "index.html"), toHtml(exported), "utf8");

  console.log("");
  console.log(`Done: ${exportDir}`);
  console.log("Open index.html on a phone, or import the CSV files into Google Sheets / Excel.");
} finally {
  await pool.end();
}

async function listTables() {
  const { rows } = await pool.query(`
    SELECT
      schemaname AS schema,
      tablename AS name
    FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND schemaname NOT LIKE 'pg_toast%'
    ORDER BY schemaname, tablename
  `);

  return rows;
}

async function listColumns(schema, table) {
  const { rows } = await pool.query(
    `
      SELECT column_name AS name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position
    `,
    [schema, table],
  );

  return rows.map((row) => row.name);
}

async function readTable(schema, table, columns) {
  const columnSql = columns.map((column) => quoteIdent(column)).join(", ");
  const { rows } = await pool.query(
    `SELECT ${columnSql} FROM ${quoteIdent(schema)}.${quoteIdent(table)}`,
  );

  return rows;
}

function toCsv(columns, rows) {
  const lines = [columns.map(csvCell).join(";")];

  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(";"));
  }

  return `${lines.join("\r\n")}\r\n`;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";

  const text = value instanceof Date
    ? value.toISOString()
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function toHtml(tables) {
  const tableSections = tables.map((table, index) => `
    <section class="card">
      <details ${index === 0 ? "open" : ""}>
        <summary>
          <span>${escapeHtml(table.schema)}.${escapeHtml(table.name)}</span>
          <small>${table.rows.length} rows · <a href="./${encodeUriPath(table.csv)}">CSV</a></small>
        </summary>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${table.rows.map((row) => `
                <tr>${table.columns.map((column) => `<td>${formatHtmlCell(row[column])}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `).join("\n");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>adventurespool export</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.4;
    }
    body {
      margin: 0;
      padding: 16px;
      background: #101114;
      color: #f4f1e8;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 24px;
    }
    p {
      margin: 0 0 16px;
      color: #c8c2b3;
    }
    .card {
      margin: 0 0 14px;
      border: 1px solid #38342d;
      border-radius: 12px;
      overflow: hidden;
      background: #18191d;
    }
    summary {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 14px;
      cursor: pointer;
      font-weight: 700;
    }
    summary small {
      color: #c8c2b3;
      font-weight: 500;
      white-space: nowrap;
    }
    a {
      color: #f8c45c;
    }
    .table-wrap {
      overflow-x: auto;
      border-top: 1px solid #38342d;
    }
    table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
      font-size: 13px;
    }
    th,
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #2a2926;
      text-align: left;
      vertical-align: top;
      max-width: 360px;
    }
    th {
      position: sticky;
      top: 0;
      background: #24211c;
      color: #ffe0a0;
      z-index: 1;
    }
    td {
      word-break: break-word;
      white-space: pre-wrap;
    }
    @media (prefers-color-scheme: light) {
      body {
        background: #f7f3eb;
        color: #1d1b16;
      }
      p,
      summary small {
        color: #5f574b;
      }
      .card {
        background: #fff;
        border-color: #dfd4c2;
      }
      .table-wrap {
        border-top-color: #dfd4c2;
      }
      th {
        background: #f0e5d2;
        color: #3a2a08;
      }
      th,
      td {
        border-bottom-color: #eadfce;
      }
      a {
        color: #8a5300;
      }
    }
  </style>
</head>
<body>
  <h1>adventurespool export</h1>
  <p>Таблицы выгружены без сохранения связей. Для обработки используйте CSV-файлы рядом с этим HTML.</p>
  ${tableSections}
</body>
</html>
`;
}

function formatHtmlCell(value) {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    return escapeHtml(value.toISOString());
  }

  if (typeof value === "object") {
    return escapeHtml(JSON.stringify(value, null, 2));
  }

  return escapeHtml(String(value));
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function safeFilename(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "_");
}

function encodeUriPath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const text = readFileSync(path, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
