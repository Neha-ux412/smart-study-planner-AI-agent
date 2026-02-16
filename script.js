let subjects = [];

/* Splash transition */
window.addEventListener("load", () => {
    setTimeout(() => {
        const splash = document.querySelector(".splash");
        const main = document.querySelector(".overlay");

        if (splash) splash.classList.add("fade-out");
        if (main) main.classList.add("show-main");
    }, 3000);
});

function addSubject() {
    const name = document.getElementById("subjectName").value.trim();
    const difficulty = document.getElementById("difficulty").value;

    if (!name || !difficulty) {
        alert("Please enter subject and select level");
        return;
    }

    subjects.push(`${name}:${difficulty}`);

    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = `${name} • ${difficulty}`;

    document.getElementById("subjectTags").appendChild(tag);

    document.getElementById("subjectName").value = "";
    document.getElementById("difficulty").selectedIndex = 0;
}

async function generatePlan() {

    const userName = document.getElementById("userName").value.trim();
    const examDate = document.getElementById("examDate").value;
    const hoursPerDay = document.getElementById("hoursPerDay").value;

    if (!userName || subjects.length === 0 || !examDate || !hoursPerDay) {
        alert("Please fill all inputs properly.");
        return;
    }

    const response = await fetch("/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userName,
            subjects,
            examDate,
            hoursPerDay: Number(hoursPerDay)
        })
    });

    const data = await response.json();

    if (data.reasoning) {
        formatReasoning(data.reasoning);
    }

    if (data.studyPlan) {
        displayPlan(data.studyPlan);
    }
}

/* ===== Proper Reasoning Formatter ===== */

function formatReasoning(text) {

    // Split into sentences
    const sentences = text.split(". ");

    let formattedHTML = `
        <div class="agent-box">
            <strong>🤖 AI Study Analysis</strong><br><br>
    `;

    sentences.forEach(sentence => {

        if (sentence.toLowerCase().includes("strategy used")) {
            formattedHTML += `
                <div style="
                    margin-top:12px;
                    padding:10px 14px;
                    background: rgba(110,79,58,0.15);
                    border-radius:12px;
                    font-weight:500;
                ">
                    ${sentence.trim()}.
                </div>
            `;
        } else {
            formattedHTML += `
                <div style="margin-bottom:10px;">
                    ${sentence.trim()}.
                </div>
            `;
        }
    });

    formattedHTML += `</div>`;

    document.getElementById("agentResponse").innerHTML = formattedHTML;
}

/* ===== Schedule Display ===== */

function displayPlan(plan) {

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let grouped = {};

    plan.forEach(item => {
        if (!grouped[item.day]) {
            grouped[item.day] = [];
        }
        grouped[item.day].push(item);
    });

    let output = "<div class='schedule-grid'>";

    Object.keys(grouped).forEach(day => {

        let currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (day - 1));

        output += `
            <div class="day-column">
                <div class="column-header">
                    ${currentDate.toDateString()}
                </div>
        `;

        grouped[day].forEach(item => {
            output += `
                <div class="task-box">
                    ${item.subject} - ${item.hours}h
                </div>
            `;
        });

        output += `</div>`;
    });

    output += "</div>";

    document.getElementById("result").innerHTML = output;
}
