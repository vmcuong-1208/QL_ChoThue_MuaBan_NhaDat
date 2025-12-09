import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import {
  // Common & Layout
  Navbar,
  Home,
  Footer,
  ChatBot,

  // Auth & Profile
  LoginRegister,
  Profile,
  BrokerProfile,
  BrokerRegistration,
  ProtectedRoute,
  GoogleAuthSuccess,

  // Reviews & Reports
  ReviewHistory,
  ReportHistory,

  // Properties & Listings
  Post,
  PostForm,
  PropertyDetail,
  Favorites,
  SearchResults,
  PriceReference,
  ContactRequestManager,
  BrokerAnalytics,

  // Map & GIS
  MapPage,

  // Communication & Chat
  Contact,
  MessageCenter,

  // Admin & Payment
  AdminPanel,
  MoMoCallback,
  PaymentSuccess,
} from "./features";

import "./App.css";

// ========================================
// COMPONENT PHỤ – Handle navbar, footer, chatbot
// ========================================
function AppContent() {
  const location = useLocation();

  const pagesWithoutNavbar = ["/auth", "/admin-panel"];
  const shouldHideNavbar = pagesWithoutNavbar.includes(location.pathname);

  const isHomePage = location.pathname === "/";

  return (
    <div className="App">
      {/* NAVBAR – Ẩn ở 1 số trang */}
      {!shouldHideNavbar && <Navbar />}

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
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
                <Post />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dang-bai"
            element={
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
                <PostForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sua-bai/:id"
            element={
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
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
            path="/tin-nhan/:conversationId"
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
            path="/yeu-cau-lien-he"
            element={
              <ProtectedRoute>
                <ContactRequestManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lich-su-danh-gia"
            element={
              <ProtectedRoute>
                <ReviewHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lich-su-bao-cao"
            element={
              <ProtectedRoute>
                <ReportHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dang-ky-moi-gioi"
            element={
              <ProtectedRoute>
                <BrokerRegistration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quan-ly-khach-hang"
            element={
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
                <ContactRequestManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/thong-ke"
            element={
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
                <BrokerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/thong-ke-moi-gioi"
            element={
              <ProtectedRoute requiredRoles={["môi giới", "broker", "admin"]}>
                <BrokerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="/profile/:id" element={<BrokerProfile />} />
        </Routes>
      </main>

      {/* FOOTER + CHATBOT chỉ xuất hiện ở Trang chủ */}
      {isHomePage && <Footer />}
      {isHomePage && <ChatBot />}
    </div>
  );
}

// ========================================
// APP CHÍNH
// ========================================
function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
