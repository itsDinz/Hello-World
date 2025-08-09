import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../state/AuthContext.jsx'

export default function OfferDetail(){
  const { id } = useParams()
  const [offer, setOffer] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/offers/${id}`)
        setOffer(data.offer)
      } catch (e) {
        setError('Failed to load offer')
      }
    }
    load()
  }, [id])

  async function book(){
    try {
      const res = await axios.post('/api/bookings', { offer_id: id, note })
      navigate(`/dashboard`)
    } catch (e) {
      setError(e.response?.data?.error || 'Booking failed')
    }
  }

  if (!offer) return <div>{error || 'Loading...'}</div>

  return (
    <div>
      <h2>{offer.title}</h2>
      <div>{offer.category}</div>
      <p>{offer.description}</p>
      <div>Price: {(offer.price_cents/100).toFixed(2)} / {offer.unit}</div>
      {user?.role === 'consumer' && (
        <div style={{marginTop:16,display:'grid',gap:8,maxWidth:420}}>
          <textarea placeholder="Add a note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
          <button onClick={book}>Request booking</button>
        </div>
      )}
    </div>
  )
}