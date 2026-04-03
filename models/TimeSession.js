const mongoose = require("mongoose");

const timeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["running", "completed"],
      default: "running",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TimeSession", timeSessionSchema);
