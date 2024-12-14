import React from 'react';
import { userMenu } from './Menus.js/userMenu';
import { useLocation, Link } from 'react-router-dom';
import '../../../../Styles/layout.css'; // Importing the CSS file

const Sidebar = () => {
  const location = useLocation();

  return (
    <div>
      <div className='sidebar'>
        <div className='menu'>
          {userMenu.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div className={`menu-item ${isActive ? 'active' : ''}`} key={menu.path}>
                <i className={menu.icon}></i>
                <Link to={menu.path}> {menu.name} </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
