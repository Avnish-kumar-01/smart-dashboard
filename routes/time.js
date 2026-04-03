const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const TimeSession = require("../models/TimeSession");

const router = express.Router();

// ================= START TIMER =================
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // check if already running
    const existingRunningSession = await TimeSession.findOne({
      userId,
      status: "running",
    });

    if (existingRunningSession) {
      return res.status(400).json({
        success: false,
        message: "A timer is already running",
      });
    }

    const newSession = await TimeSession.create({
      userId,
      startTime: new Date(),
      status: "running",
    });

    res.status(201).json({
      success: true,
      message: "Timer started successfully",
      session: newSession,
    });

  } catch (error) {
    console.error("Start Timer Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while starting timer",
    });
  }
});

// ================= STOP TIMER =================
router.post("/stop", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const runningSession = await TimeSession.findOne({
      userId,
      status: "running",
    });

    if (!runningSession) {
      return res.status(400).json({
        success: false,
        message: "No active timer found",
      });
    }

    const endTime = new Date();

    const durationMs = endTime - runningSession.startTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    let points = durationMinutes;

    // bonus logic
    if (durationMinutes >= 60) {
      points += 15;
    } else if (durationMinutes >= 25) {
      points += 5;
    }

    runningSession.endTime = endTime;
    runningSession.durationMinutes = durationMinutes;
    runningSession.pointsEarned = points;
    runningSession.status = "completed";

    await runningSession.save();

    res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      session: runningSession,
    });

  } catch (error) {
    console.error("Stop Timer Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while stopping timer",
    });
  }
});

// ================= GET ACTIVE / RUNNING SESSION =================
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const runningSession = await TimeSession.findOne({
      userId: req.user.id,
      status: "running",
    }).sort({ createdAt: -1 });

    if (!runningSession) {
      return res.status(200).json({
        success: true,
        running: false,
        session: null,
      });
    }

    return res.status(200).json({
      success: true,
      running: true,
      session: runningSession,
    });
  } catch (error) {
    console.error("Active Session Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking active session",
    });
  }
});

// ================= TODAY STATS =================
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await TimeSession.find({
      userId,
      status: "completed",
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const totalPoints = sessions.reduce((sum, session) => sum + session.pointsEarned, 0);

    res.status(200).json({
      success: true,
      message: "Today's stats fetched successfully",
      totalSessions: sessions.length,
      totalMinutes,
      totalPoints,
      sessions,
    });

  } catch (error) {
    console.error("Today Stats Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's stats",
    });
  }
});

module.exports = router;
