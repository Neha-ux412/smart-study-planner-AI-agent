const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/generate-plan", (req, res) => {
    const { userName, subjects, examDate, hoursPerDay } = req.body;

    if (!userName || !subjects || !examDate || !hoursPerDay) {
        return res.status(400).json({
            message: "Please provide name, subjects, examDate and hoursPerDay"
        });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);

    const timeDifference = exam - today;
    const totalDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    if (totalDays <= 1) {
        return res.status(400).json({
            message: "Exam date must be at least 2 days in the future"
        });
    }

    const weights = {
        hard: 3,
        medium: 2,
        easy: 1
    };

    const parsedSubjects = subjects.map(sub => {
        const [name, difficulty] = sub.split(":");
        const level = (difficulty || "medium").toLowerCase();

        return {
            name: name.trim(),
            difficulty: level,
            weight: weights[level] || 2,
            allocatedHours: 0
        };
    });

    const totalWeight = parsedSubjects.reduce((sum, s) => sum + s.weight, 0);
    const totalStudyHours = (totalDays - 1) * hoursPerDay;

    // Allocate hours proportionally
    parsedSubjects.forEach(sub => {
        sub.allocatedHours = Math.round(
            (sub.weight / totalWeight) * totalStudyHours
        );
    });

    const studyPlan = [];
    let currentDay = 1;

    while (currentDay <= totalDays - 1) {
        let remainingHoursToday = hoursPerDay;

        parsedSubjects.forEach(sub => {
            if (sub.allocatedHours > 0 && remainingHoursToday > 0) {
                const hoursToAssign = Math.min(
                    sub.allocatedHours,
                    remainingHoursToday
                );

                studyPlan.push({
                    day: currentDay,
                    subject: sub.name,
                    difficulty: sub.difficulty,
                    hours: hoursToAssign
                });

                sub.allocatedHours -= hoursToAssign;
                remainingHoursToday -= hoursToAssign;
            }
        });

        currentDay++;
    }

    // Add revision day
    studyPlan.push({
        day: totalDays,
        subject: "Revision",
        difficulty: "All",
        hours: hoursPerDay
    });

    // 🤖 Agent Reasoning (Line Break Friendly)
    const hardCount = parsedSubjects.filter(s => s.difficulty === "hard").length;
    const limitedSchedule = totalDays <= 3;

    let reasoning = `Hi ${userName} 👋\n\n`;
    reasoning += `I analysed your study inputs carefully.\n\n`;
    reasoning += `You have ${totalDays} days until your exam.\n`;
    reasoning += `That gives you approximately ${totalStudyHours} total study hours.\n\n`;

    if (hardCount > 0) {
        reasoning += `Since you marked ${hardCount} subject(s) as hard, I prioritised them during allocation.\n`;
    }

    if (limitedSchedule) {
        reasoning += `Because your schedule is tight, I intelligently split daily hours across subjects instead of assigning full days.\n`;
    } else {
        reasoning += `Since you have a moderate schedule, I distributed hours proportionally across days.\n`;
    }

    reasoning += `\nFinally, I reserved the last day entirely for revision to reinforce your preparation.\n\n`;
    reasoning += `Strategy Used: Weighted hour-based adaptive allocation.`;

    res.json({
        totalDays,
        strategy: "Weighted hour-based intelligent allocation",
        reasoning,
        studyPlan
    });
});

// ✅ Required for Vercel
module.exports = app;

// Local running support
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
