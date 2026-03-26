import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PublicRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  const redirectPath = user?.role === "admin" ? "/admin" : "/profile";

  if (localStorage.getItem("token") || token) {
    // If admin is logged in, redirect to admin dashboard
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={redirectPath} replace />;
  } else {
    return children;
  }
};

export default PublicRoute;
