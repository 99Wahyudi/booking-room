import React from 'react';
import Navbar from './Navbar.jsx';

/**
 * Shell for the public content pages. It adds the documented sticky Navbar on
 * top of the page section; each faithful page carries its own <footer>.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      {children}
    </div>
  );
}