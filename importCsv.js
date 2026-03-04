const fs = require("fs");
const { parse } = require("csv-parse/sync");
const db = require("./databases");

function importCSV(filePath, type) {
    const file = fs.readFileSync(filePath);

    const records = parse(file, {
        columns: true,
        skip_empty_lines: true
    });

    const transaction = db.transaction(() => {
        for (const row of records) {
            const matched = row["Matched"] === "TRUE" ? 1 : 0;
            const createdAt = new Date(row["Timestamp"]).toISOString();

            if (type === "tutors") {
                db.prepare(`
                    INSERT INTO tutors
                    (name, email, phone, grade, homeroom, current_class,
                     courses, availability, matched, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    row['name (first, last)'],
                    row['Email Address*'],
                    row['Phone Number'],
                    row['Grade'],
                    row['Homeroom (Last name, Room #)'],
                    row['Current Math Class'],
                    row['Classes you feel comfortable tutoring:'],
                    row['Availability '],
                    matched,
                    createdAt
                );
            }

            if (type === "tutees") {
                db.prepare(`
                    INSERT INTO tutees
                    (name, email, phone, grade, homeroom,
                     teacher,
                     courses, availability, matched, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    row['student name Last, First'],
                    row['student email'],
                    row['student cell'],
                    row['Grade'],
                    row['Homeroom'],
                    row['Math teacher last name'],
                    row['Math class'],
                    row['Availability'],
                    matched,
                    createdAt
                );
            }
        }
    });

    transaction();
}

module.exports = importCSV;

if (require.main === module) {
    const importCSV = require("./importCsv");

    importCSV("./tutormatch.csv", "tutors");
    importCSV("./tuteematch.csv", "tutees");

    console.log("Import complete.");
}