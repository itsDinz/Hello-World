import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'consumer' })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()

  function update(k, v){ setForm(s=>({ ...s, [k]: v })) }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post('/api/auth/register', form)
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <form onSubmit={onSubmit} style={{display:'grid',gap:12,maxWidth:400}}>
      <h2>Register</h2>
      {error && <div style={{color:'red'}}>{String(error)}</div>}
      <input placeholder="Name" value={form.name} onChange={e=>update('name', e.target.value)} />
      <input placeholder="Email" value={form.email} onChange={e=>update('email', e.target.value)} />
      <input placeholder="Password" type="password" value={form.password} onChange={e=>update('password', e.target.value)} />
      <select value={form.role} onChange={e=>update('role', e.target.value)}>
        <option value="consumer">Consumer</option>
        <option value="provider">Provider</option>
      </select>
      <button type="submit">Create account</button>
    </form>
  )
}