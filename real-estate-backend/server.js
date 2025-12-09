const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
const db = require("./config/db");
const path = require("path");
const http = require("http");
const setupSocket = require("./socket");

// Import passport config
require("./config/passport");

const app = express();

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo socket.io
const io = setupSocket(server);
app.set("io", io);

// Middleware cơ bản
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (cần thiết cho Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "HUTECH",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true nếu dùng HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Cấu hình để phục vụ thư mục uploads làm thư mục tĩnh
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const propertyRoutes = require("./routes/properties");
app.use("/api/properties", propertyRoutes);

const propertyTypesRoute = require("./routes/property-types");
app.use("/api/property-types", propertyTypesRoute);

const categoriesRoute = require("./routes/categories");
app.use("/api/categories", categoriesRoute);

const locationsRoute = require("./routes/locations");
app.use("/api/locations", locationsRoute);

const usersRoutes = require("./routes/users");
app.use("/api/users", usersRoutes);

const messagesRoutes = require("./routes/messages");
app.use("/api/messages", messagesRoutes);

const favoritesRoutes = require("./routes/favorites");
app.use("/api/favorites", favoritesRoutes);

const recommendationsRoutes = require("./routes/recommendations");
app.use("/api/recommendations", recommendationsRoutes);

const searchRoutes = require("./routes/search");
app.use("/api/properties/search", searchRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const verificationRoutes = require("./routes/verification");
app.use("/api/verification", verificationRoutes);

const brokerVerificationRoutes = require("./routes/brokerVerification");
app.use("/api/broker-verification", brokerVerificationRoutes);

const contentRoutes = require("./routes/content");
app.use("/api/content", contentRoutes);

const contactRequestRoutes = require("./routes/contactRequests");
app.use("/api/contact-requests", contactRequestRoutes);

const notificationRoutes = require("./routes/notifications");
app.use("/api/notifications", notificationRoutes);

const brokerReviewRoutes = require("./routes/brokerReviews");
app.use("/api/broker-reviews", brokerReviewRoutes);

const propertyReportRoutes = require("./routes/propertyReports");
app.use("/api/property-reports", propertyReportRoutes);

const brokerAnalyticsRoutes = require("./routes/brokerAnalytics");
app.use("/api/broker-analytics", brokerAnalyticsRoutes);

const momoPaymentRoutes = require("./routes/momo-payment");
app.use("/api/momo-payment", momoPaymentRoutes);

const sepayRoutes = require("./routes/sepay");
app.use("/api/sepay", sepayRoutes);

const revenueRoutes = require("./routes/revenue");
app.use("/api/admin/revenue", revenueRoutes);

const chatbotRoutes = require("./routes/chatbot");
app.use("/api/chatbot", chatbotRoutes);

// Xử lý lỗi 404
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Không tìm thấy tài nguyên" });
});

// Xử lý lỗi server
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);
  res.status(500).json({ message: "Lỗi server", error: err.message });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
