import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

export default function Offers(){
  const [offers, setOffers] = useState([])
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError('Unable to get location')
    )
  }, [])

  useEffect(() => {
    if (!coords) return
    const fetchNearby = async () => {
      try {
        const { data } = await axios.get('/api/offers/nearby', { params: { lat: coords.lat, lon: coords.lon, radiusKm: 30 } })
        setOffers(data.offers)
      } catch (e) {
        setError('Failed to load nearby offers')
      }
    }
    fetchNearby()
  }, [coords])

  return (
    <div>
      <h2>Nearby services</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul style={{display:'grid',gap:8,padding:0,listStyle:'none'}}>
        {offers.map(o => (
          <li key={o.id} style={{border:'1px solid #ddd',padding:12,borderRadius:8}}>
            <Link to={`/offers/${o.id}`}>{o.title}</Link>
            <div>{o.category} • {(o.price_cents/100).toFixed(2)} / {o.unit}</div>
            {'distance_km' in o && <small>{o.distance_km.toFixed(1)} km away</small>}
          </li>
        ))}
      </ul>
    </div>
  )
}