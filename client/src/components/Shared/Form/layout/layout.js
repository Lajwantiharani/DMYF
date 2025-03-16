import React from 'react';
import header from './header'; 
import Sidebar from './sidebar';

const Layout = ({ children }) => {
  const Header = header; 

  return (
    <>
      <div className='header'>
        <Header />
      </div>
      <div className='row g-0'>
        <div className='col-md-3'>
            <Sidebar/>
        </div>
        <div className='col-md-9'>{children} </div>
      </div>
      
    </>
  );
};

export default Layout;
