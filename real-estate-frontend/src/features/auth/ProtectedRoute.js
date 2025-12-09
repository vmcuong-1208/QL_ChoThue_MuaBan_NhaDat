"use client";
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredRole = null,
}) => {
  const { currentUser, loading, hasPermission } = useAuth();

  if (loading) {
    return <div className="loading-container">Đang tải...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const rawRoles = requiredRole
    ? Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]
    : Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  if (rawRoles.length > 0) {
    const userRole = (currentUser?.LoaiTaiKhoan || "").toLowerCase();
    const isAllowed = rawRoles.some((r) => {
      const target = (r || "").toLowerCase();
      if (
        target === "broker" ||
        target === "môi giới" ||
        target.includes("môi")
      ) {
        return (
          userRole.includes("môi") ||
          userRole.includes("broker") ||
          userRole === "admin" ||
          userRole.includes("đầu tư")
        );
      }
      if (target === "admin") {
        return userRole === "admin";
      }
      return userRole === target;
    });

    if (!isAllowed && !hasPermission(rawRoles)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
