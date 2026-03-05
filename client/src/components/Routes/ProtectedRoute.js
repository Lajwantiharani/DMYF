import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../services/API";
import { Navigate, useLocation } from "react-router-dom";
import { setCurrentUser } from "../../redux/features/auth/authSlice";
import {
  isProfileComplete,
  isProfileVerificationApproved,
} from "../../utils/profileCompletion";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  //get user current
  const getUser = async () => {
    try {
      const { data } = await API.get("/auth/current-user");
      if (data?.success) {
        dispatch(setCurrentUser(data.user));
      }
    } catch (error) {
      localStorage.clear();
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    getUser();
  }, [dispatch, user]);

  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return null;
  }

  const allowedWhileLocked = ["/profile"];

  if (!isProfileComplete(user) && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  if (
    !isProfileVerificationApproved(user) &&
    !allowedWhileLocked.includes(location.pathname)
  ) {
    return <Navigate to="/profile" replace />;
  }

  if (location.pathname === "/analytics" && user?.role !== "admin") {
    return <Navigate to="/inventory" replace />;
  }

  return children;
};

export default ProtectedRoute;
