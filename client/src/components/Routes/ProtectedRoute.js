import React, { useCallback, useEffect, useState } from "react";
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
  const getUser = useCallback(async () => {
    try {
      const { data } = await API.get("/auth/current-user");
      if (data?.success) {
        dispatch(setCurrentUser(data.user));

        return true;
      }
      return false;
    } catch (error) {
      localStorage.clear();
      console.log(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {

    if (user) {
      setLoading(false);
      return;
    }

    getUser();
  }, [getUser, user]);

  useEffect(() => {
    if (!user) return undefined;

    let intervalId;

    const updateActivity = async () => {
      try {
        await API.post("/auth/activity");
      } catch (error) {
        console.log(error);
      }
    };

    updateActivity();

    const onFocus = () => {
      updateActivity();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity();
      }
    };

    intervalId = window.setInterval(() => {
      if (!document.hidden) {
        updateActivity();
      }
    }, 60000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user]);


  if (loading) {
    return null;
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedWhileLocked = ["/profile", "/inquiry"];
  const isAdmin = user?.role === "admin";

  if (!isAdmin && !isProfileComplete(user) && !allowedWhileLocked.includes(location.pathname)) {
    return <Navigate to="/profile" replace />;
  }

  if (
    !isAdmin &&
    !isProfileVerificationApproved(user) &&
    !allowedWhileLocked.includes(location.pathname)
  ) {
    return <Navigate to="/profile" replace />;
  }

  if (location.pathname === "/analytics" && user?.role !== "admin") {
    return <Navigate to="/inventory" replace />;
  }

  // Redirect admin users away from /profile (not needed for admins)
  if (user?.role === "admin" && location.pathname === "/profile") {
    return <Navigate to="/admin" replace />;
  }


  const path = location.pathname;
  const role = user?.role;

  const isAllowed = () => {
    if (!role) return false;
    if (path === "/profile" || path === "/settings") return true;

    if (path === "/user-inquiries") return role === "admin";
    if (path === "/inquiry") return role !== "admin";

    const adminOnlyPaths = new Set([
      "/admin",
      "/users",
      "/analytics",
      "/donor-list",
      "/org-list",
      "/verification-requests",
    ]);

    if (adminOnlyPaths.has(path)) return role === "admin";

    if (path === "/receiver-list") return role === "admin" || role === "organization";

    if (path === "/inventory" || path === "/blood-requests") {
      return role === "organization" || role === "donor";
    }

    if (path === "/receiver") return role === "receiver";


    if (path === "/donation") return role !== "receiver";

    return true;
  };

  if (!isAllowed()) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
