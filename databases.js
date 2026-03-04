const Database = require("better-sqlite3");

const db = new Database("data.sqlite");

db.exec(`
CREATE TABLE IF NOT EXISTS tutors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    grade TEXT,
    homeroom TEXT,
    current_class TEXT,
    courses TEXT,
    availability TEXT,
    matched INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    grade TEXT,
    homeroom TEXT,
    level TEXT,
    courses TEXT,
    teacher TEXT,
    availability TEXT,
    matched INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pairings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id INTEGER NOT NULL,
    tutee_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;