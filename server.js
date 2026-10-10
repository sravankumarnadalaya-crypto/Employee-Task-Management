require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (_req, res) => res.json({ message: "Employee Task Management API is running" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/tasks", require("./routes/tasks"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing. Create backend/.env from .env.example.");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing. Add it to backend/.env.");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await User.create({
        name: process.env.ADMIN_NAME || "Project Admin",
        email, passwordHash, role: "admin"
      });
      console.log(`Initial admin created: ${email}`);
    }
  }
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
}

start().catch(err => { console.error("Startup failed:", err.message); process.exit(1); });
