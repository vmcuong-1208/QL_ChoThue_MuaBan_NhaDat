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
        <Route path="/auth" element={<LoginRegister />} />
      </Routes>
      <FloatingButton />
      <Footer />
    </Router>
  )
}

export default App
