const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");
const jwt = require("jsonwebtoken");

// Simple verify middleware (same pattern as auth.js)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

// CREATE TODO
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    const todo = new Todo({
      userId: req.user.id,
      title: title.trim(),
      priority: priority || "medium",
      dueDate: dueDate || null,
    });

    await todo.save();

    res.status(201).json({
      message: "Task created successfully",
      todo,
    });
  } catch (error) {
    console.error("Create Todo Error:", error);
    res.status(500).json({ message: "Server error while creating task." });
  }
});

// GET ALL TODOS OF LOGGED-IN USER
router.get("/", verifyToken, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json(todos);
  } catch (error) {
    console.error("Get Todos Error:", error);
    res.status(500).json({ message: "Server error while fetching tasks." });
  }
});

// UPDATE TODO
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, completed, priority, dueDate } = req.body;

    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (title !== undefined) todo.title = title.trim();
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate || null;

    await todo.save();

    res.status(200).json({
      message: "Task updated successfully",
      todo,
    });
  } catch (error) {
    console.error("Update Todo Error:", error);
    res.status(500).json({ message: "Server error while updating task." });
  }
});

// DELETE TODO
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!todo) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Todo Error:", error);
    res.status(500).json({ message: "Server error while deleting task." });
  }
});

module.exports = router;
