// Minimal Express server with register/login (bcrypt), uploads (multer), thumbnails (sharp), basic character CRUD.
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage directories
const STORAGE_DIR = path.join(__dirname, 'storage');
const IMAGES_DIR = path.join(STORAGE_DIR, 'images');
const THUMBS_DIR = path.join(STORAGE_DIR, 'thumbs');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'dev-secret-change-this', // change for production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(STORAGE_DIR));

// Multer for uploads
const upload = multer({
  dest: IMAGES_DIR,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Helpers
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Auth routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username+password required' });

  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashed], function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') return res.status(400).json({ error: 'username taken' });
      return res.status(500).json({ error: 'database error' });
    }
    req.session.user = { id: this.lastID, username };
    return res.json({ ok: true, user: { id: this.lastID, username } });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username+password required' });

  db.get('SELECT id, username, password_hash FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'db' });
    if (!row) return res.status(400).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(400).json({ error: 'invalid' });
    req.session.user = { id: row.id, username: row.username };
    res.json({ ok: true, user: { id: row.id, username: row.username } });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/whoami', (req, res) => {
  res.json({ user: req.session.user || null });
});

// Upload route
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const userId = req.session.user.id;
  const originalPath = req.file.path; // already in IMAGES_DIR
  const filename = path.basename(originalPath);
  const thumbFilename = `thumb-${filename}.jpg`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);

  // Create thumbnail
  try {
    await sharp(originalPath)
      .resize(300)
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
  } catch (e) {
    console.error('sharp error', e);
  }

  db.run(
    `INSERT INTO images (user_id, character_id, filename, thumb_filename) VALUES (?, NULL, ?, ?)`,
    [userId, filename, thumbFilename],
    function (err) {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json({ ok: true, image: { id: this.lastID, filename, thumb: thumbFilename } });
    }
  );
});

// List user's images
app.get('/api/images', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.all('SELECT id, filename, thumb_filename, created_at FROM images WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db' });
    res.json({ images: rows });
  });
});

// Character CRUD
app.post('/api/characters', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { name, metadata } = req.body;
  db.run('INSERT INTO characters (user_id, name, metadata) VALUES (?, ?, ?)', [userId, name, JSON.stringify(metadata || {})], function (err) {
    if (err) return res.status(500).json({ error: 'db' });
    res.json({ ok: true, character: { id: this.lastID, name, metadata: metadata || {} } });
  });
});

app.get('/api/characters', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.all('SELECT id, name, metadata, created_at FROM characters WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db' });
    // parse metadata
    rows = rows.map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : {} }));
    res.json({ characters: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
