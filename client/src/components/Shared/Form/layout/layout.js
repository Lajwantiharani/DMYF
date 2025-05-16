import React, { useState } from "react";
import Header from "./header"; // Adjust the path as needed
import Sidebar from "./sidebar"; // Adjust the path as needed
import "./Sidebar.css"; // Adjust the path as needed

const Layout = ({ children }) => {
  // State to toggle sidebar on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <div className="header">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      </div>
      <div className="row g-0">
        <div className="col-md-3">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>
        <div className="col-md-9 main-content">{children}</div>
      </div>
    </>
  );
};

export default Layout;
