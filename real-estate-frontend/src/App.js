import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"

import Home from "./components/Home"
import Properties from "./components/Properties"
import Contact from "./components/Contact"
import Profile from "./components/Profile"
import Footer from "./components/Footer"
import SearchBar from "./components/SearchBar"
import PropertyList from "./components/PropertyList"
import FloatingButton from "./components/FloatingButton"
import LoginRegister from "./components/LoginRegister"

// Import component mới
import Post from "./components/Post"
import PostForm from "./components/PostForm"
// Import component quản trị

import AdminPanel from "./components/AdminPanel"
const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <SearchBar />
              <PropertyList />
            </>
          }
        />
        <Route path="/bat-dong-san" element={<Properties />} />
        <Route path="/lien-he" element={<Contact />} />
        <Route path="/ho-so" element={<Profile />} />
        <Route path="/quan-ly-bai-dang" element={<Post />} />
        <Route path="/dang-tin" element={<PostForm />} />
        <Route path="/chinh-sua-tin/:id" element={<PostForm />} />
        <Route path="/auth" element={<LoginRegister />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
      </Routes>
      <FloatingButton />
      <Footer />
    </Router>
  )
}

export default App
