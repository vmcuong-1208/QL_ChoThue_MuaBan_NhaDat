const express = require("express")
const cors = require("cors")
require("dotenv").config()
const db = require("./config/db") 
const path = require("path")
const http = require("http")
const setupSocket = require("./socket") 

const app = express()

// Tạo HTTP server
const server = http.createServer(app)

// Khởi tạo socket.io
const io = setupSocket(server)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Cấu hình để phục vụ thư mục uploads làm thư mục tĩnh
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
const authRoutes = require("./routes/auth")
app.use("/api/auth", authRoutes)

const propertyRoutes = require("./routes/properties")
app.use("/api/properties", propertyRoutes)

const propertyTypesRoute = require("./routes/property-types")
app.use("/api/property-types", propertyTypesRoute)

const locationsRoute = require("./routes/locations")
app.use("/api/locations", locationsRoute)

const usersRoutes = require("./routes/users")
app.use("/api/users", usersRoutes)

const messagesRoutes = require("./routes/messages")
app.use("/api/messages", messagesRoutes)

const favoritesRoutes = require("./routes/favorites")
app.use("/api/favorites", favoritesRoutes)

const recommendationsRoutes = require("./routes/recommendations")
app.use("/api/recommendations", recommendationsRoutes)

const searchRoutes = require("./routes/search")
app.use("/api/properties/search", searchRoutes)

const adminRoutes = require("./routes/admin")
app.use("/api/admin", adminRoutes)
// Xử lý lỗi 404
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ message: "Không tìm thấy tài nguyên" })
})

// Xử lý lỗi server
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err)
  res.status(500).json({ message: "Lỗi server", error: err.message })
})

// Khởi động server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`)
})