const express = require("express");
const cors = require("cors");
require("dotenv").config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠ WARNING: CLOUDINARY_CLOUD_NAME is not defined in environment variables');
}

console.log("=== SERVER STARTING ===");
console.log("Environment variables loaded");
console.log(
  "MongoDB URI:",
  process.env.MONGODB_URI || "mongodb://localhost:27017/teamlead"
);
console.log("Port:", process.env.PORT || 5000);

const connectDB = require("./config/db");

// Create Express app
const app = express();

// Middleware - UPDATED CORS CONFIGURATION
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.FRONTEND_URL || "http://localhost:5173",
      "https://team-lead-gamma.vercel.app",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://gurukripaprojectmanagement.avanienterprises.in",
      // "https://www.gurukripaprojectmanagement.avanienterprises.in",
      "https://gaonseghartaprojectmanagement.avanienterprises.in",
      "https://dakshprojectmanagement.avanienterprises.in",
      "https://www.dakshprojectmanagement.avanienterprises.in",
      // "https://www.gaonseghartaprojectmanagement.avanienterprises.in",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

console.log("Middleware configured");

// Request logger - MUST be before routes
app.use((req, res, next) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.resolve(__dirname, '../request_debug.log');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}\n`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check FIRST
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ROOT route (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running successfully - VERSION 2.0 (Payment Implementation) 🚀",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "/health",
      "/api/auth",
      "/api/admin",
      "/api/users",
      "/api/teams",
      "/api/tasks",
      "/api/leads",
      "/api/meetings",
    ],
  });
});

// Connect to database and load routes
const startServer = async () => {
  try {
    console.log("\n--- Connecting to Database ---");
    await connectDB();
    console.log("✓ Database connected\n");

    // Initialize Notification Scheduler
    const initScheduler = require('./services/notificationScheduler');
    initScheduler();

    // Initialize Meeting Status Scheduler
    const initMeetingScheduler = require('./services/meetingScheduler');
    initMeetingScheduler();

    console.log("--- Loading Routes ---");

    // Load auth routes
    try {
      const authRoutes = require("./routes/authRoutes");
      console.log("✓ Auth routes file loaded");

      // Mount the routes
      app.use("/api/auth", authRoutes);
      console.log("✓ Auth routes mounted at /api/auth");

      // List all registered routes
      console.log("\nRegistered Auth Routes:");
      authRoutes.stack.forEach((r) => {
        if (r.route) {
          const methods = Object.keys(r.route.methods).join(", ").toUpperCase();
          console.log(`  ${methods} /api/auth${r.route.path}`);
        }
      });
    } catch (err) {
      console.error("✗ ERROR loading auth routes:", err.message);
      console.error("Full error:", err);
      throw err;
    }

    // Try loading other routes (with error handling)
    const otherRoutes = [
      { path: "/api/setup", file: "./routes/setupRoutes", name: "Setup" },
      { path: "/api/admin", file: "./routes/adminRoutes", name: "Admin" },
      { path: "/api/users", file: "./routes/userRoutes", name: "User" },
      { path: "/api/teams", file: "./routes/teamRoutes", name: "Team" },
      { path: "/api/tasks", file: "./routes/taskRoutes", name: "Task" },
      { path: "/api/leads", file: "./routes/leadRoutes", name: "Lead" },
      { path: "/api/follow-ups", file: "./routes/followUpRoutes", name: "FollowUp" },
      {
        path: "/api/notifications",
        file: "./routes/notificationRoutes",
        name: "Notification",
      },
      { path: "/api/calls", file: "./routes/callRoutes", name: "Call" },
      {
        path: "/api/activities",
        file: "./routes/activityRoutes",
        name: "Activity",
      },
      { path: "/api/reports", file: "./routes/reportRoutes", name: "Report" },
      {
        path: "/api/settings",
        file: "./routes/settingsRoutes",
        name: "Settings",
      },
      {
        path: "/api/messages",
        file: "./routes/messageRoutes",
        name: "Message",
      },
      {
        path: "/api/analytics",
        file: "./routes/analyticsRoutes",
        name: "Analytics",
      },
      {
        path: "/api/meetings",
        file: "./routes/meetingRoutes",
        name: "Meeting",
      },
      {
        path: "/api/files",
        file: "./routes/fileRoutes",
        name: "File",
      },
      {
        path: "/api/categories",
        file: "./routes/categoryRoutes",
        name: "Category",
      },
    ];

    otherRoutes.forEach((route) => {
      try {
        console.log(`Attempting to mount ${route.name} routes from ${route.file}...`);
        const routeModule = require(route.file);
        app.use(route.path, routeModule);
        console.log(`✓ ${route.name} routes mounted at ${route.path}`);
      } catch (err) {
        console.log(`✗ ERROR mounting ${route.name} routes:`, err.message);
        console.error(err.stack);
      }
    });

    console.log("\n--- All Routes Loaded ---\n");

    // Global Error Handler
    app.use((err, req, res, next) => {
      const fs = require('fs'); // Ensure fs is available
      const path = require('path'); // Ensure path is available
      const errorLog = path.join(__dirname, "../error_debug.log");
      const errorMsg = `[${new Date().toISOString()}] ${req.method} ${req.url} - Error: ${err.message}\nStack: ${err.stack}\n\n`;
      fs.appendFileSync(errorLog, errorMsg);
      
      console.error(`Error: ${err.message}`);
      // console.error(err.stack);
      res.status(500).json({
        success: false,
        message: "Server Error",
        error: err.message,
      });
    });

    // 404 handler - MUST BE LAST
    app.use((req, res) => {
      console.log(`404 - Route not found: ${req.method} ${req.url}`);
      res.status(404).json({
        success: false,
        message: "Route not found",
        requestedUrl: req.url,
        method: req.method,
      });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("=================================");
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Auth test: http://localhost:${PORT}/api/auth/test`);
      console.log("=================================\n");
    });
  } catch (error) {
    console.error("FATAL ERROR starting server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
