import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './state/AuthContext.jsx'

export default function App() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div>
      <header style={{display:'flex',gap:16,alignItems:'center',padding:12,borderBottom:'1px solid #eee'}}>
        <Link to="/">find(x)</Link>
        <nav style={{display:'flex',gap:12}}>
          <Link to="/offers">Find services</Link>
          {user?.role === 'provider' && <Link to="/dashboard">My dashboard</Link>}
        </nav>
        <div style={{marginLeft:'auto',display:'flex',gap:12}}>
          {user ? (
            <>
              <span>Hello, {user.name}</span>
              <button onClick={() => { logout(); navigate('/') }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>
      <main style={{padding:16}}>
        <Outlet />
      </main>
    </div>
  )
}
