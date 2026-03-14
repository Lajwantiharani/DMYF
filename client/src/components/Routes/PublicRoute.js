import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PublicRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  if (localStorage.getItem("token") || token) {
    return <Navigate to="/profile" />;
  } else {
    return children;
  }
};

export default PublicRoute;
