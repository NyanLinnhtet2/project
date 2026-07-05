import { Outlet } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import Footer from "../components/common/Footer";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <Outlet />

      <Footer />
    </div>
  );
}

export default Layout;
