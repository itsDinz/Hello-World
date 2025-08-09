import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../state/AuthContext.jsx'

export default function Dashboard(){
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [mineOffers, setMineOffers] = useState([])
  const [form, setForm] = useState({ title:'', description:'', category:'', price_cents:0, unit:'hour', latitude:0, longitude:0, radius_km:30 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const b = await axios.get('/api/bookings/mine')
      setBookings(b.data.bookings || [])
      if (user.role === 'provider'){
        const o = await axios.get('/api/offers/mine')
        setMineOffers(o.data.offers || [])
      }
    }
    load()
  }, [user])

  function update(k,v){ setForm(s=>({ ...s, [k]: v })) }

  async function getLocation(){
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej('no geo')
      navigator.geolocation.getCurrentPosition(
        (pos)=>res({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => rej('geo failed')
      )
    })
  }

  async function createOffer(e){
    e.preventDefault()
    try {
      let lat = form.latitude, lon = form.longitude
      if (!lat || !lon){
        const c = await getLocation()
        lat = c.lat; lon = c.lon
      }
      const payload = { ...form, latitude: Number(lat), longitude: Number(lon), price_cents: Number(form.price_cents) }
      const { data } = await axios.post('/api/offers', payload)
      setMineOffers((s)=>[data.offer, ...s])
      setMessage('Offer created')
    } catch (e) {
      setMessage(e.response?.data?.error || 'Failed to create offer')
    }
  }

  async function updateStatus(id, status){
    await axios.patch(`/api/bookings/${id}/status`, { status })
    const { data } = await axios.get('/api/bookings/mine')
    setBookings(data.bookings)
  }

  if (!user) return <div>Please login</div>

  return (
    <div>
      <h2>Dashboard</h2>
      {message && <div>{message}</div>}
      {user.role === 'provider' && (
        <section style={{marginBottom:24}}>
          <h3>Create offer</h3>
          <form onSubmit={createOffer} style={{display:'grid',gap:8,maxWidth:480}}>
            <input placeholder="Title" value={form.title} onChange={e=>update('title',e.target.value)} />
            <input placeholder="Category" value={form.category} onChange={e=>update('category',e.target.value)} />
            <textarea placeholder="Description" value={form.description} onChange={e=>update('description',e.target.value)} />
            <input placeholder="Price (cents)" type="number" value={form.price_cents} onChange={e=>update('price_cents',e.target.value)} />
            <input placeholder="Unit (e.g. hour)" value={form.unit} onChange={e=>update('unit',e.target.value)} />
            <input placeholder="Latitude (optional)" value={form.latitude} onChange={e=>update('latitude',e.target.value)} />
            <input placeholder="Longitude (optional)" value={form.longitude} onChange={e=>update('longitude',e.target.value)} />
            <input placeholder="Radius km" type="number" value={form.radius_km} onChange={e=>update('radius_km',e.target.value)} />
            <button type="submit">Create</button>
          </form>
          <h3>My offers</h3>
          <ul>
            {mineOffers.map(o => (
              <li key={o.id}>{o.title} — {(o.price_cents/100).toFixed(2)} / {o.unit}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>My bookings</h3>
        <ul style={{display:'grid',gap:8,padding:0,listStyle:'none'}}>
          {bookings.map(b => (
            <li key={b.id} style={{border:'1px solid #ddd',padding:12}}>
              <div>{b.title}</div>
              <div>Status: {b.status}</div>
              {user.role === 'provider' && (
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  {['accepted','rejected','completed','cancelled'].map(s => (
                    <button key={s} onClick={()=>updateStatus(b.id, s)}>{s}</button>
                  ))}
                </div>
              )}
              {user.role === 'consumer' && b.status !== 'cancelled' && b.status !== 'completed' && (
                <button onClick={()=>updateStatus(b.id,'cancelled')} style={{marginTop:8}}>Cancel</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}