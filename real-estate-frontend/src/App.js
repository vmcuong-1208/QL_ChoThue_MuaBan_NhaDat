import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./components/Home"
import LoginRegister from "./components/LoginRegister"
import Profile from "./components/Profile"
import Post from "./components/Post"
import PostForm from "./components/PostForm"
import PropertyDetail from "./components/PropertyDetail"
import Contact from "./components/Contact"
import AdminPanel from "./components/AdminPanel"
import ProtectedRoute from "./components/ProtectedRoute"
import MessageCenter from "./components/MessageCenter"
import Favorites from "./components/Favorites"
import SearchResults from "./components/SearchResults"
import Footer from "./components/Footer"
import ChatBot from "./components/ChatBot"
import MoMoCallback from "./components/MoMoCallback"
import PaymentSuccess from "./components/PaymentSuccess"
import GoogleAuthSuccess from "./components/GoogleAuthSuccess"
import MapPage from "./components/MapPage"
import PriceReference from "./components/PriceReference"
import BrokerProfile from "./components/BrokerProfile"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<LoginRegister />} />
              <Route path="/lien-he" element={<Contact />} />
              <Route path="/tim-kiem" element={<SearchResults />} />
              <Route path="/ban-do" element={<MapPage />} />
              <Route path="/tham-khao-gia" element={<PriceReference />} />
              <Route path="/bat-dong-san/:id" element={<PropertyDetail />} />
              <Route path="/payment/momo/callback" element={<MoMoCallback />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route
                path="/ho-so"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quan-ly-bai-dang"
                element={
                  <ProtectedRoute>
                    <Post />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dang-bai"
                element={
                  <ProtectedRoute>
                    <PostForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sua-bai/:id"
                element={
                  <ProtectedRoute>
                    <PostForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tin-nhan"
                element={
                  <ProtectedRoute>
                    <MessageCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/yeu-thich"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-panel"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:id" element={<BrokerProfile />} />
            </Routes>
          </main>
          <Footer />
          <ChatBot />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
