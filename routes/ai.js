const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, file } = req.body;

    // Validation
    if (!message?.trim() && !file?.data) {
      return res.status(400).json({
        success: false,
        message: "Message or image is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is missing in .env file",
      });
    }

    const parts = [];

    // Add text message
    if (message?.trim()) {
      parts.push({ text: message.trim() });
    }

    // Add image file (base64)
    if (file?.data && file?.mime_type) {
      parts.push({
        inline_data: {
          mime_type: file.mime_type,
          data: file.data,
        },
      });
    }

    // Gemini API request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const data = await response.json();

    // Debug log (optional)
    console.log("Gemini API Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json({
        success: false,
        message: data.error?.message || "AI API request failed",
      });
    }

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    return res.status(200).json({
      success: true,
      reply: aiText,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating AI response",
      error: error.message,
    });
  }
});

module.exports = router;
