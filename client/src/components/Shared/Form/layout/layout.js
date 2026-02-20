import React, { useState, useEffect } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import "./Sidebar.css";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    // Open sidebar if user is logged in and not on auth pages
    if (
      user &&
      !["/login", "/register", "/verify-otp"].some((path) =>
        location.pathname.startsWith(path)
      )
    ) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [user, location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="main-content">{children}</main>
      </div>
    </>
  );
};

export default Layout;
