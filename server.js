const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/generate-plan", (req, res) => {

    const { userName, subjects, examDate, hoursPerDay } = req.body;

    if (!userName || !subjects || subjects.length === 0 || !examDate || !hoursPerDay) {
        return res.status(400).json({
            message: "Please provide all inputs properly."
        });
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const exam = new Date(examDate);
    exam.setHours(0,0,0,0);

    const totalDays = Math.ceil((exam - today) / (1000*60*60*24));

    if (totalDays <= 1) {
        return res.status(400).json({
            message: "Exam date must be at least 2 days in future."
        });
    }

    const weights = { hard:3, medium:2, easy:1 };

    const parsedSubjects = subjects.map(sub => {
        const [name, difficulty] = sub.split(":");
        return {
            name: name.trim(),
            difficulty,
            weight: weights[difficulty] || 2,
            allocatedHours: 0
        };
    });

    const totalWeight = parsedSubjects.reduce((sum,s)=> sum+s.weight,0);
    const totalStudyHours = (totalDays-1) * hoursPerDay;

    parsedSubjects.forEach(sub=>{
        sub.allocatedHours = Math.round(
            (sub.weight/totalWeight) * totalStudyHours
        );
    });

    const studyPlan = [];
    let day = 1;

    while(day <= totalDays-1){

        let remaining = hoursPerDay;

        parsedSubjects.forEach(sub=>{
            if(sub.allocatedHours > 0 && remaining > 0){
                const assign = Math.min(sub.allocatedHours, remaining);

                studyPlan.push({
                    day,
                    subject: sub.name,
                    hours: assign
                });

                sub.allocatedHours -= assign;
                remaining -= assign;
            }
        });

        day++;
    }

    studyPlan.push({
        day: totalDays,
        subject: "Revision",
        hours: hoursPerDay
    });

    const reasoning = `
Hi ${userName} 👋

You have ${totalDays} days until your exam.
Total study hours available: ${totalStudyHours}.

Hours were allocated proportionally based on difficulty.
Final day reserved for revision.

Strategy Used: Weighted intelligent hour allocation.
`;

    res.json({ reasoning, studyPlan });
});

module.exports = app;
// For local development
if (require.main === module) {
    const PORT = 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}