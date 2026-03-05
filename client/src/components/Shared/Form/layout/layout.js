import React, { useState } from 'react';
import header from './header'; 
import Sidebar from './sidebar';



const Layout = ({ children }) => {
  const Header = header; 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <div className='header'>
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      </div>
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
      <div className='row g-0'>
        <div className={`col-md-3 ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>
        <div className='col-md-9'>{children} </div>
      </div>
      
    </>
  );
};

export default Layout;
