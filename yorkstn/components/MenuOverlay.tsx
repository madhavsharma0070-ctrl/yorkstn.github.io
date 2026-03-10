'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
export default function MenuOverlay() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const o = () => { setOpen(true); document.body.style.overflow = 'hidden' }
    document.addEventListener('yorkstn:menu:open', o)
    return () => document.removeEventListener('yorkstn:menu:open', o)
  }, [])
  const close = () => { setOpen(false); document.body.style.overflow = '' }
  const openInq = () => { close(); setTimeout(() => document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open')), 100) }
  const links = [['/', 'Home'],['/services','What We Do'],['/india','India Market'],['/insights','Insights'],['/about','About'],['/contact','Contact']]
  return (
    <div className={`menu-overlay ${open ? 'open' : ''}`} role="dialog">
      <button className="mcls" onClick={close}>Close <span className="mcls-x">×</span></button>
      <div className="ml">
        <p className="ml-ey">Navigation</p>
        <ul className="mnav">{links.map(([href,label],i) => <li key={href}><Link href={href} onClick={close}><span className="mnum" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{label}</Link></li>)}</ul>
      </div>
      <div className="mr">
        <p className="mr-tag">"Great brands don't fail in India because of product. They fail because of entry."</p>
        <div className="mr-det">
          <div><p className="mr-lbl">Location</p><p className="mr-val">Gurugram, Delhi NCR<br/>India</p></div>
          <div><p className="mr-lbl">Contact</p><p className="mr-val">connect@yorkstn.com</p></div>
          <button className="btn btn-l" onClick={openInq}>Submit Brand Enquiry →</button>
        </div>
      </div>
    </div>
  )
}
