"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { currentUser, loading, hasPermission } = useAuth()

  if (loading) {
    return <div className="loading-container">Đang tải...</div>
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />
  }

  if (requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
