const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const timeRoutes = require("./routes/time");
const todoRoutes = require("./routes/todo");
const aiRoutes = require("./routes/ai"); // NEW

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // image + text chatbot support

app.get("/", (req, res) => {
  res.send("Smart Dashboard API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/ai", aiRoutes); // NEW

app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
