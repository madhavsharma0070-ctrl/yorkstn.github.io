'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
export default function CookieBanner() {
  const [show, setShow] = useState(false)
  useEffect(() => { if (!localStorage.getItem('yk_cookie')) setTimeout(() => setShow(true), 1800) }, [])
  const accept = () => { localStorage.setItem('yk_cookie','accepted'); setShow(false) }
  const decline = () => { localStorage.setItem('yk_cookie','declined'); setShow(false) }
  return (
    <div className={`cookie-banner ${show ? 'show' : ''}`} role="dialog">
      <p className="ck-txt">We use cookies and Google Analytics to understand how visitors use this site. No personal data is shared for advertising. <Link href="/privacy" style={{color:'var(--g)',textDecoration:'underline'}}>Privacy Policy</Link></p>
      <div className="ck-btns"><button className="ck-dec" onClick={decline}>Decline</button><button className="ck-acc" onClick={accept}>Accept</button></div>
    </div>
  )
}
