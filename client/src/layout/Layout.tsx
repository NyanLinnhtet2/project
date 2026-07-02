import { Outlet } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import Footer from "../components/common/Footer";

function Layout() {
    return (
        <div className="min-h-screen flex flex-col">

            <Navbar />
            <main className="flex-1 p-6">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Layout;