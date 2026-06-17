import { useEffect, useState } from 'react'

export default function StatusBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes().toString().padStart(2, '0')
      setTime(`${h}:${m}`)
    }
    update()
    const id = setInterval(update, 15000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="ios-status-bar">
      <span>{time}</span>
      <div className="status-icons">
        <svg viewBox="0 0 18 12" fill="none">
          <path d="M1 4.5C3.5 1.5 7 0 9 0s5.5 1.5 8 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3.5 7C5.3 5.2 7 4.5 9 4.5s3.7.7 5.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="0" width="3" height="12" rx="1" opacity="0.3"/>
          <rect x="4.5" y="3" width="3" height="9" rx="1" opacity="0.5"/>
          <rect x="9" y="1.5" width="3" height="10.5" rx="1" opacity="0.7"/>
          <rect x="13.5" y="0" width="3" height="12" rx="1"/>
        </svg>
        <svg viewBox="0 0 28 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/>
          <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/>
          <path d="M25 5v3a1.5 1.5 0 000-3z" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}
