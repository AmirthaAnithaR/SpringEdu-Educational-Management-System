const express = require("express");
const router = express.Router();
console.log("✅ authRoutes.js loaded");
const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

router.post("/register", registerUser);

router.post("/login", loginUser);

// Friendly GET handlers to avoid "Cannot GET /api/auth/register" errors
router.get("/register", (req, res) => {
  res.status(200).json({ message: "This endpoint accepts POST. Send user data as JSON to register." });
});

router.get("/login", (req, res) => {
  res.status(200).json({ message: "This endpoint accepts POST. Send email and password as JSON to login." });
});

router.get("/test", (req, res) => {
  console.log("✅ /test route reached");
  res.status(200).json({
    success: true,
    message: "Authentication routes are working!"
  });
});
module.exports = router;