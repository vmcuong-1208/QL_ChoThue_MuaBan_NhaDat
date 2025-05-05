const express = require("express")
const cors = require("cors")
require("dotenv").config()
const db = require("./config/db") // Import file kết nối MySQL
const path = require("path") // Import thư viện path

const app = express()

app.use(cors())
app.use(express.json())

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`)
})
