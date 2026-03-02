const db = require("./databases");
const { Munkres } = require("munkres-js");

function splitToList(value) {
    if (!value) return [];
    return value.split(",").map(x => x.trim()).filter(Boolean);
}

function runMatching() {
    const tutors = db.prepare(`
        SELECT * FROM tutors
        WHERE matched = 0
        ORDER BY datetime(created_at) ASC
    `).all();

    const tutees = db.prepare(`
        SELECT * FROM tutees
        WHERE matched = 0
    `).all();

    const numTutors = tutors.length;
    const numTutees = tutees.length;

    if (numTutors === 0 || numTutees === 0) return [];

    const weightMatrix = [];

    const earliestTime = Math.min(
        ...tutors.map(t => new Date(t.created_at).getTime())
    );

    for (let i = 0; i < numTutors; i++) {
        weightMatrix[i] = [];

        const tutorCourses = splitToList(tutors[i].courses);
        const tutorTimes = splitToList(tutors[i].availability);

        for (let j = 0; j < numTutees; j++) {
            const tuteeCourses = splitToList(tutees[j].courses);
            const tuteeTimes = splitToList(tutees[j].availability);

            const courseMatches =
                tutorCourses.filter(c => tuteeCourses.includes(c)).length;

            const timeMatches =
                tutorTimes.filter(t => tuteeTimes.includes(t)).length;

            if (courseMatches === 0 || timeMatches === 0) {
                weightMatrix[i][j] = -99999;
            } else {
                const signupTime = new Date(tutors[i].created_at).getTime();
                const fairnessBonus =
                    (1 / (signupTime - earliestTime + 1)) * 0.001;

                weightMatrix[i][j] =
                    timeMatches * 5 +
                    courseMatches * 50 +
                    fairnessBonus;
            }
        }
    }

    const size = Math.max(numTutors, numTutees);
    const padded = Array.from({ length: size }, () =>
        Array(size).fill(-99999)
    );

    for (let i = 0; i < numTutors; i++) {
        for (let j = 0; j < numTutees; j++) {
            padded[i][j] = weightMatrix[i][j];
        }
    }

    const costMatrix = padded.map(row => row.map(x => -x));
    const munkres = new Munkres();
    const assignments = munkres.compute(costMatrix);

    const matches = [];

    const transaction = db.transaction(() => {
        for (const [i, j] of assignments) {
            if (i >= numTutors || j >= numTutees) continue;

            const score = weightMatrix[i][j];
            if (score === -99999) continue;

            matches.push({
                tutor: tutors[i],
                tutee: tutees[j],
                score
            });

            db.prepare("UPDATE tutors SET matched = 1 WHERE id = ?")
                .run(tutors[i].id);

            db.prepare("UPDATE tutees SET matched = 1 WHERE id = ?")
                .run(tutees[j].id);
        }
    });

    transaction();
    return matches;
}

module.exports = runMatching;