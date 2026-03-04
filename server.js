const express = require("express");
const db = require("./databases");
const runMatching = require("./assignPairs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Simple admin password check helper (no sessions)
function isValidAdminPassword(password) {
    return password === "CHARLIEBROWN";
}

app.post("/tutors", (req, res) => {
    const { firstname, lastname, email, phone, grade, homeroom, current_class, courses, availability } = req.body;

    const name = `${firstname} ${lastname}`;

    const coursesStr = courses.join(", ");
    const availabilityStr = availability.join(", ");

    try {
        db.prepare(`
            INSERT INTO tutors (name, email, phone, grade, homeroom, current_class, courses, availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, email, phone, grade, homeroom, current_class, coursesStr, availabilityStr);

        res.json({ message: "Tutor added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add tutor" });
    }
});

app.post("/admin/login", (req, res) => {
    const { password } = req.body;

    if (!isValidAdminPassword(password)) {
        return res.status(403).json({ error: "Unauthorized: wrong password" });
    }

    res.json({ ok: true });
});

app.post("/tutees", (req, res) => {
   const { firstname, lastname, email, phone, grade, homeroom, level, courses, teacher, availability } = req.body;

    const name = `${firstname} ${lastname}`;

    const availabilityStr = availability.join(", ");

    try {
        db.prepare(`
            INSERT INTO tutees (name, email, phone, grade, homeroom, level, courses, teacher, availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, email, phone, grade, homeroom, level, courses, teacher, availabilityStr);

        res.json({ message: "Tutee added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add tutee" });
    }
});

app.post("/match", (req, res) => {
    const { password } = req.body;

    if (!isValidAdminPassword(password)) {
        return res.status(403).json({ error: "Unauthorized: wrong password" });
    }

    const matches = runMatching();
    res.json(matches);
});

app.get("/pairings", (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT
                p.id,
                p.created_at,
                t.id AS tutor_id,
                t.name AS tutor_name,
                t.email AS tutor_email,
                t.phone AS tutor_phone,
                t.grade AS tutor_grade,
                t.courses AS tutor_courses,
                t.availability AS tutor_availability,
                u.id AS tutee_id,
                u.name AS tutee_name,
                u.email AS tutee_email,
                u.phone AS tutee_phone,
                u.grade AS tutee_grade,
                u.courses AS tutee_courses,
                u.level AS tutee_level,
                u.availability AS tutee_availability
            FROM pairings p
            JOIN tutors t ON t.id = p.tutor_id
            JOIN tutees u ON u.id = p.tutee_id
            ORDER BY datetime(p.created_at) DESC
        `).all();

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pairings" });
    }
});

app.post("/pairings/confirm", (req, res) => {
    const { tutorId, tuteeId } = req.body;

    if (!tutorId || !tuteeId) {
        return res.status(400).json({ error: "Missing tutorId or tuteeId" });
    }

    try {
        const insert = db.prepare(`
            INSERT INTO pairings (tutor_id, tutee_id)
            VALUES (?, ?)
        `);

        const result = insert.run(tutorId, tuteeId);

        const pairing = db.prepare(`
            SELECT
                p.id,
                p.created_at,
                t.id AS tutor_id,
                t.name AS tutor_name,
                u.id AS tutee_id,
                u.name AS tutee_name
            FROM pairings p
            JOIN tutors t ON t.id = p.tutor_id
            JOIN tutees u ON u.id = p.tutee_id
            WHERE p.id = ?
        `).get(result.lastInsertRowid);

        // Ensure they remain out of the non‑paired dataset
        db.prepare("UPDATE tutors SET matched = 1 WHERE id = ?").run(tutorId);
        db.prepare("UPDATE tutees SET matched = 1 WHERE id = ?").run(tuteeId);

        res.json(pairing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to confirm pairing" });
    }
});

app.post("/pairings/deny", (req, res) => {
    const { tutorId, tuteeId } = req.body;

    if (!tutorId || !tuteeId) {
        return res.status(400).json({ error: "Missing tutorId or tuteeId" });
    }

    try {
        // Return both to the non‑paired pool
        db.prepare("UPDATE tutors SET matched = 0 WHERE id = ?").run(tutorId);
        db.prepare("UPDATE tutees SET matched = 0 WHERE id = ?").run(tuteeId);

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to deny pairing" });
    }
});

app.post("/pairings/unpair", (req, res) => {
    const { pairingId } = req.body;

    if (!pairingId) {
        return res.status(400).json({ error: "Missing pairingId" });
    }

    try {
        const pairing = db.prepare(`
            SELECT tutor_id, tutee_id
            FROM pairings
            WHERE id = ?
        `).get(pairingId);

        if (!pairing) {
            return res.status(404).json({ error: "Pairing not found" });
        }

        const transaction = db.transaction(() => {
            db.prepare("DELETE FROM pairings WHERE id = ?").run(pairingId);
            db.prepare("UPDATE tutors SET matched = 0 WHERE id = ?").run(pairing.tutor_id);
            db.prepare("UPDATE tutees SET matched = 0 WHERE id = ?").run(pairing.tutee_id);
        });

        transaction();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to unpair" });
    }
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});