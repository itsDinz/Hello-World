import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <form onSubmit={onSubmit} style={{display:'grid',gap:12,maxWidth:360}}>
      <h2>Login</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  )
}