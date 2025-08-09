import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import Home from './routes/Home.jsx'
import Login from './routes/Login.jsx'
import Register from './routes/Register.jsx'
import Offers from './routes/Offers.jsx'
import OfferDetail from './routes/OfferDetail.jsx'
import Dashboard from './routes/Dashboard.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'offers', element: <Offers /> },
      { path: 'offers/:id', element: <OfferDetail /> },
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
