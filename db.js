// Minimal SQLite setup: creates users, characters, images tables if missing.
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './data/database.sqlite';

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // users: id, username (unique), password_hash, created_at
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // characters: id, user_id, name, metadata (JSON), created_at
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // images: id, user_id, character_id (nullable), filename, thumb_filename, created_at
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      character_id INTEGER,
      filename TEXT NOT NULL,
      thumb_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(character_id) REFERENCES characters(id)
    )
  `);
});

module.exports = db;
