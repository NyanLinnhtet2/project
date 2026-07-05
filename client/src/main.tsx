import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './layout/Layout'
import "./index.css";
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import About from './pages/About'
import Login from './pages/Login'


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,

    children: [
      {
        index: true,
        element: <Home />,
      },

      {
        path: "/about",
        element: <About />
      },

      {
        path: "/login",
        element: <Login />
      },





    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
