import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/content.db');

let SQL;
let db;

// Initialize database
export async function initDatabase() {
  SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      image_filename TEXT NOT NULL,
      event_type TEXT DEFAULT 'General',
      mood TEXT DEFAULT 'Warm',
      
      description TEXT,
      instagram_caption TEXT,
      facebook_caption TEXT,
      twitter_caption TEXT,
      hashtags TEXT,
      story_ideas TEXT,
      
      scheduled_date TEXT,
      scheduled_platform TEXT,
      status TEXT DEFAULT 'draft',
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dbPath, buffer);
}

// Database operations
export const dbOperations = {
  run(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    return { lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] };
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  all(sql, params = []) {
    const results = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};

export default { initDatabase, dbOperations };
