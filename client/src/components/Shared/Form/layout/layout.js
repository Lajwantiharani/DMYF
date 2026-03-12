
import React, { useEffect, useRef, useState } from 'react';
import header from './header'; 
import Sidebar from './sidebar';
 


const Layout = ({ children }) => {
  const Header = header; 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const headerRef = useRef(null);
  const headerResizeFrameRef = useRef(null);
  const lastHeaderHeightRef = useRef(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const suppressResizeObserverOverlay = (event) => {
      const message = event?.message || "";
      if (message.includes("ResizeObserver loop completed") || message.includes("ResizeObserver loop limit exceeded")) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
      }
    };

    const updateHeaderHeight = () => {
      const rect = el.getBoundingClientRect();
      const nextHeight = Math.round(rect.height || 0);
      if (!nextHeight || nextHeight === lastHeaderHeightRef.current) return;
      lastHeaderHeightRef.current = nextHeight;
      document.documentElement.style.setProperty("--header-height", `${nextHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener("error", suppressResizeObserverOverlay);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (headerResizeFrameRef.current) {
          cancelAnimationFrame(headerResizeFrameRef.current);
        }
        headerResizeFrameRef.current = requestAnimationFrame(() => {
          headerResizeFrameRef.current = null;
          updateHeaderHeight();
        });
      });
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", updateHeaderHeight);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (headerResizeFrameRef.current) {
        cancelAnimationFrame(headerResizeFrameRef.current);
        headerResizeFrameRef.current = null;
      }
      window.removeEventListener("error", suppressResizeObserverOverlay);
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <>
      <div className='header' ref={headerRef}>
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
