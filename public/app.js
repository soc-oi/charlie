const tutorForm = document.getElementById("tutorForm");
if (tutorForm) {
    tutorForm.addEventListener("submit", async e => {
        e.preventDefault();

        const first = tutorForm.firstname.value.trim();
        const last = tutorForm.lastname.value.trim();
        const email = tutorForm.email.value.trim();
        const phone = tutorForm.phone.value.trim();
        const grade = tutorForm.grade.value;
        const homeroom = tutorForm.homeroom.value.trim();
        const current_class = tutorForm.current_class.value.trim();
        const courses = Array.from(tutorForm.querySelectorAll('input[name="courses"]:checked')).map(c => c.value);
        const availability = Array.from(tutorForm.querySelectorAll('input[name="availability"]:checked')).map(a => a.value);

        // Validate
        const errors = [];
        if (!first) errors.push("First name is required.");
        if (!last) errors.push("Last name is required.");
        if (!email) errors.push("Email is required.");
        if (!phone) errors.push("Phone is required.");
        if (!grade) errors.push("Grade is required.");
        if (!homeroom) errors.push("Homeroom is required.");
        if (!current_class) errors.push("Current class is required.");
        if (courses.length === 0) errors.push("Select at least one course.");
        if (availability.length === 0) errors.push("Select at least one available time.");

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        const data = { firstname: first, lastname: last, email, phone, grade, homeroom, current_class, courses, availability };

        try {
            const res = await fetch("/tutors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Tutor added!");
                tutorForm.reset();
            } else {
                alert("Error adding tutor.");
            }
        } catch (err) {
            console.error(err);
            alert("Server error.");
        }
    });
}

const tuteeForm = document.getElementById("tuteeForm");
if (tuteeForm) {
    tuteeForm.addEventListener("submit", async e => {
        e.preventDefault();

        const first = tuteeForm.firstname.value.trim();
        const last = tuteeForm.lastname.value.trim();
        const email = tuteeForm.email.value.trim();
        const phone = tuteeForm.phone.value.trim();
        const grade = tuteeForm.grade.value;
        const homeroom = tuteeForm.homeroom.value.trim();
        const level = tuteeForm.level.value.trim();
        const courses = tuteeForm.courses.value.trim();
        const teacher = tuteeForm.teacher.value.trim();
        const availability = Array.from(tuteeForm.querySelectorAll('input[name="availability"]:checked')).map(a => a.value);

        // Validate
        const errors = [];
        if (!first) errors.push("First name is required.");
        if (!last) errors.push("Last name is required.");
        if (!email) errors.push("Email is required.");
        if (!phone) errors.push("Phone is required.");
        if (!grade) errors.push("Grade is required.");
        if (!homeroom) errors.push("Homeroom is required.");
        if (!level) errors.push("Class level is required.");
        if (!courses) errors.push("Class name is required.");
        if (!teacher) errors.push("Class teacher is required.");
        if (availability.length === 0) errors.push("Select at least one available time.");

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        const data = { firstname: first, lastname: last, email, phone, grade, homeroom, level, courses, teacher, availability };

        try {
            const res = await fetch("/tutees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Tutee added!");
                tuteeForm.reset();
            } else {
                alert("Error adding tutee.");
            }
        } catch (err) {
            console.error(err);
            alert("Server error.");
        }
    });
}

const runMatch = document.getElementById("runMatch");
if (runMatch) {
    runMatch.addEventListener("click", async () => {
        const password = document.getElementById("password").value;

        const res = await fetch("/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const resultsDiv = document.getElementById("results");

        if (!res.ok) {
            const data = await res.json();
            resultsDiv.innerHTML = `<p style="color:red">${data.error}</p>`;
            return;
        }

        const matches = await res.json();
        resultsDiv.innerHTML = "";

        matches.forEach(m => {
            resultsDiv.innerHTML += `
                <p>
                    <strong>${m.tutor.name}</strong> (${m.tutor.phone}) has been assigned to
                    <strong>${m.tutee.name}</strong> (${m.tutee.phone}), in grade ${m.tutee.grade} looking for help in ${m.tutee.level || ""}${m.tutee.courses}
                </p>
            `;
        });
    });
}