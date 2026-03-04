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
        if (courses.length === 0) errors.push("Select at least one course you can tutor.");
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
        if (!courses) errors.push("Class name is required.");
        if (!teacher) errors.push("Class teacher is required.");
        if (availability.length === 0) errors.push("Select at least one available time.");

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        // Backend still expects `level`, so send an empty string.
        const data = { firstname: first, lastname: last, email, phone, grade, homeroom, level: "", courses, teacher, availability };

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

// Admin Tools behaviour
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginCard = document.getElementById("adminLoginCard");
const adminPanel = document.getElementById("adminPanel");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");
const adminStatus = document.getElementById("adminStatus");
const runMatchingBtn = document.getElementById("runMatchingBtn");
const viewPairingsBtn = document.getElementById("viewPairingsBtn");
const adminLogoutBtn = document.getElementById("adminLogout");
const proposedList = document.getElementById("proposedList");
const currentPairingsList = document.getElementById("currentPairings");

let adminPasswordCache = "";
let proposedMatches = [];

function setAdminStatus(message, isError = false) {
    if (!adminStatus) return;
    adminStatus.textContent = message || "";
    adminStatus.style.color = isError ? "#fecaca" : "#9ca3af";
}

function clearAdminLists() {
    if (proposedList) {
        proposedList.innerHTML = `<p class="muted">Run matching to see proposed pairings.</p>`;
        proposedList.classList.add("empty-state");
    }
    if (currentPairingsList) {
        currentPairingsList.innerHTML = `<p class="muted">No confirmed pairings yet.</p>`;
        currentPairingsList.classList.add("empty-state");
    }
}

function renderProposed(matches) {
    if (!proposedList) return;

    if (!matches || matches.length === 0) {
        proposedList.innerHTML = `<p class="muted">No proposed pairings. You may need more unmatched tutors and tutees.</p>`;
        proposedList.classList.add("empty-state");
        return;
    }

    proposedList.classList.remove("empty-state");
    proposedList.innerHTML = "";

    matches.forEach(m => {
        const tutor = m.tutor;
        const tutee = m.tutee;
        const score = m.score;

        const item = document.createElement("article");
        item.className = "pair-item";
        item.dataset.tutorId = tutor.id;
        item.dataset.tuteeId = tutee.id;

        const tutorCourses = tutor.courses || "";
        const tuteeCourses = tutee.courses || "";
        const tutorAvailability = tutor.availability || "";
        const tuteeAvailability = tutee.availability || "";

        item.innerHTML = `
            <div class="pair-header">
                <div class="pair-names">
                    <span>${tutor.name}</span>
                    <span style="opacity:0.7;">→</span>
                    <span>${tutee.name}</span>
                </div>
                <span class="badge badge--score">Score: ${score.toFixed ? score.toFixed(1) : score}</span>
            </div>
            <div class="pair-meta">
                <span>Tutor • Grade ${tutor.grade || "?"}</span>
                <span>Tutee • Grade ${tutee.grade || "?"}</span>
                ${tutorCourses ? `<span>Can tutor: ${tutorCourses}</span>` : ""}
                ${tuteeCourses ? `<span>Needs help in: ${tuteeCourses}</span>` : ""}
                ${tutorAvailability ? `<span>Tutor availability: ${tutorAvailability}</span>` : ""}
                ${tuteeAvailability ? `<span>Tutee availability: ${tuteeAvailability}</span>` : ""}
                ${tutor.phone ? `<span>Tutor phone: ${tutor.phone}</span>` : ""}
                ${tutee.phone ? `<span>Tutee phone: ${tutee.phone}</span>` : ""}
            </div>
            <div class="pair-actions">
                <button class="button button--confirm" data-action="confirm" data-tutor-id="${tutor.id}" data-tutee-id="${tutee.id}">Confirm</button>
                <button class="button button--deny" data-action="deny" data-tutor-id="${tutor.id}" data-tutee-id="${tutee.id}">Deny</button>
            </div>
        `;

        proposedList.appendChild(item);
    });
}

function renderCurrentPairings(rows) {
    if (!currentPairingsList) return;

    if (!rows || rows.length === 0) {
        currentPairingsList.innerHTML = `<p class="muted">No confirmed pairings yet.</p>`;
        currentPairingsList.classList.add("empty-state");
        return;
    }

    currentPairingsList.classList.remove("empty-state");
    currentPairingsList.innerHTML = "";

    rows.forEach(row => {
        const item = document.createElement("article");
        item.className = "pair-item";
        item.dataset.pairingId = row.id;
        item.dataset.tutorName = row.tutor_name;
        item.dataset.tuteeName = row.tutee_name;

        const tutorCourses = row.tutor_courses || "";
        const tuteeCourses = row.tutee_courses || "";

        item.innerHTML = `
            <div class="pair-header">
                <div class="pair-names">
                    <span>${row.tutor_name}</span>
                    <span style="opacity:0.7;">→</span>
                    <span>${row.tutee_name}</span>
                </div>
                <span class="badge">Confirmed</span>
            </div>
            <div class="pair-meta">
                <span>Tutor • Grade ${row.tutor_grade || "?"}</span>
                <span>Tutee • Grade ${row.tutee_grade || "?"}</span>
                ${tutorCourses ? `<span>Can tutor: ${tutorCourses}</span>` : ""}
                ${tuteeCourses ? `<span>Needs help in: ${tuteeCourses}</span>` : ""}
                ${row.tutor_phone ? `<span>Tutor phone: ${row.tutor_phone}</span>` : ""}
                ${row.tutee_phone ? `<span>Tutee phone: ${row.tutee_phone}</span>` : ""}
            </div>
        `;

        currentPairingsList.appendChild(item);
    });
}

async function loadCurrentPairings() {
    try {
        const res = await fetch("/pairings");
        if (!res.ok) {
            throw new Error("Failed to load pairings");
        }
        const rows = await res.json();
        renderCurrentPairings(rows);
    } catch (err) {
        console.error(err);
        setAdminStatus("Unable to load current pairings.", true);
    }
}

if (adminLoginForm && adminPanel && adminLoginCard) {
    clearAdminLists();

    adminLoginForm.addEventListener("submit", async e => {
        e.preventDefault();
        if (!adminPasswordInput) return;

        const password = adminPasswordInput.value;
        adminLoginError.textContent = "";
        setAdminStatus("");

        try {
            const res = await fetch("/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                adminLoginError.textContent = data.error || "Login failed.";
                return;
            }

            adminPasswordCache = password;
            adminLoginCard.hidden = true;
            adminPanel.hidden = false;

            await loadCurrentPairings();
            setAdminStatus("Signed in as admin.");
        } catch (err) {
            console.error(err);
            adminLoginError.textContent = "Server error. Please try again.";
        }
    });

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", () => {
            adminPasswordCache = "";
            if (adminPasswordInput) adminPasswordInput.value = "";
            proposedMatches = [];
            clearAdminLists();
            adminPanel.hidden = true;
            adminLoginCard.hidden = false;
            setAdminStatus("");
        });
    }

    if (runMatchingBtn) {
        runMatchingBtn.addEventListener("click", async () => {
            if (!adminPasswordCache) {
                setAdminStatus("Please log in as admin to run matching.", true);
                return;
            }

            runMatchingBtn.disabled = true;
            setAdminStatus("Running matching...");

            try {
                const res = await fetch("/match", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: adminPasswordCache })
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setAdminStatus(data.error || "Failed to run matching.", true);
                    runMatchingBtn.disabled = false;
                    return;
                }

                const matches = await res.json();
                proposedMatches = matches || [];
                renderProposed(proposedMatches);

                if (!matches || matches.length === 0) {
                    setAdminStatus("No new matches were found.");
                } else {
                    setAdminStatus(`Proposed ${matches.length} new pairing(s).`);
                }
            } catch (err) {
                console.error(err);
                setAdminStatus("Server error while running matching.", true);
            } finally {
                runMatchingBtn.disabled = false;
            }
        });
    }

    if (viewPairingsBtn) {
        viewPairingsBtn.addEventListener("click", async () => {
            await loadCurrentPairings();
            setAdminStatus("Current pairings refreshed.");
        });
    }

    if (proposedList) {
        proposedList.addEventListener("click", async e => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;

            const action = target.dataset.action;
            if (!action) return;

            const tutorId = Number(target.dataset.tutorId);
            const tuteeId = Number(target.dataset.tuteeId);
            if (!tutorId || !tuteeId) return;

            if (action === "confirm") {
                try {
                    target.disabled = true;
                    const res = await fetch("/pairings/confirm", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tutorId, tuteeId })
                    });

                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        setAdminStatus(data.error || "Failed to confirm pairing.", true);
                        target.disabled = false;
                        return;
                    }

                    proposedMatches = proposedMatches.filter(
                        m => m.tutor.id !== tutorId || m.tutee.id !== tuteeId
                    );
                    renderProposed(proposedMatches);
                    await loadCurrentPairings();
                    setAdminStatus("Pairing confirmed.");
                } catch (err) {
                    console.error(err);
                    setAdminStatus("Server error while confirming pairing.", true);
                }
            }

            if (action === "deny") {
                try {
                    target.disabled = true;
                    const res = await fetch("/pairings/deny", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tutorId, tuteeId })
                    });

                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        setAdminStatus(data.error || "Failed to deny pairing.", true);
                        target.disabled = false;
                        return;
                    }

                    proposedMatches = proposedMatches.filter(
                        m => m.tutor.id !== tutorId || m.tutee.id !== tuteeId
                    );
                    renderProposed(proposedMatches);
                    setAdminStatus("Pairing denied. Tutor and tutee remain unpaired.");
                } catch (err) {
                    console.error(err);
                    setAdminStatus("Server error while denying pairing.", true);
                }
            }
        });
    }

    const unpairModal = document.getElementById("unpairModal");
    const unpairText = document.getElementById("unpairText");
    const unpairConfirm = document.getElementById("unpairConfirm");
    const unpairCancel = document.getElementById("unpairCancel");
    let pendingUnpairId = null;

    if (currentPairingsList && unpairModal && unpairConfirm && unpairCancel) {
        currentPairingsList.addEventListener("click", e => {
            const card = e.target.closest(".pair-item");
            if (!card) return;

            const pairingId = Number(card.dataset.pairingId);
            if (!pairingId) return;

            pendingUnpairId = pairingId;
            if (unpairText) {
                const tutorName = card.dataset.tutorName || "this tutor";
                const tuteeName = card.dataset.tuteeName || "this tutee";
                unpairText.textContent = `Unpair ${tutorName} and ${tuteeName}? They will both return to the unmatched pool.`;
            }
            unpairModal.hidden = false;
        });

        const closeUnpairModal = () => {
            pendingUnpairId = null;
            unpairModal.hidden = true;
        };

        unpairCancel.addEventListener("click", () => {
            closeUnpairModal();
        });

        unpairConfirm.addEventListener("click", async () => {
            if (!pendingUnpairId) {
                closeUnpairModal();
                return;
            }

            try {
                unpairConfirm.disabled = true;
                const res = await fetch("/pairings/unpair", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pairingId: pendingUnpairId })
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setAdminStatus(data.error || "Failed to unpair.", true);
                } else {
                    await loadCurrentPairings();
                    setAdminStatus("Pairing removed. Tutor and tutee returned to the unmatched pool.");
                }
            } catch (err) {
                console.error(err);
                setAdminStatus("Server error while unpairing.", true);
            } finally {
                unpairConfirm.disabled = false;
                closeUnpairModal();
            }
        });
    }
}