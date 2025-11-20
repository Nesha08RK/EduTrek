// Layout.jsx
import React from "react";
import Navbar from "./Navbar"; 
import Footer from "./Footer";

const Layout = ({ children, fullWidth = false }) => {
  return (
    <div className="w-full">
  <Navbar />
  <main className="flex-1 w-full py-6">
    {children}
  </main>
  <Footer />
</div>

  );
};

export default Layout;
