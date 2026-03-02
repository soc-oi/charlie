const express = require("express");
const db = require("./databases");
const runMatching = require("./assignPairs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

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

    if (password !== "CHARLIEBROWN") {
        return res.status(403).json({ error: "Unauthorized: wrong password" });
    }

    const matches = runMatching();
    res.json(matches);
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});