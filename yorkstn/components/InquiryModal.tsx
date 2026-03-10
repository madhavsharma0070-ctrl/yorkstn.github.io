'use client'
import { useEffect, useState, useRef } from 'react'
export default function InquiryModal() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const o = () => { setOpen(true); document.body.style.overflow = 'hidden'; setTimeout(() => ref.current?.focus(), 100) }
    document.addEventListener('yorkstn:inquiry:open', o)
    return () => document.removeEventListener('yorkstn:inquiry:open', o)
  }, [])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  const close = () => { setOpen(false); document.body.style.overflow = '' }
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (fd.get('_gotcha')) return
    const name = (fd.get('name') as string)?.trim()
    const email = (fd.get('email') as string)?.trim()
    const brand = (fd.get('brand') as string)?.trim()
    if (!name || !email || !brand) { setErr('Please fill in name, email and brand name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Please enter a valid email address.'); return }
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, brand, category: fd.get('category'), stage: fd.get('stage'), country: fd.get('country'), message: fd.get('message') }) })
      if (res.ok) setDone(true)
      else throw new Error()
    } catch { setErr('Something went wrong. Please email connect@yorkstn.com directly.') }
    finally { setLoading(false) }
  }
  return (
    <div className={`inq-overlay ${open ? 'open' : ''}`} role="dialog" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="im">
        <div className="ih">
          <button className="icls" onClick={close}>×</button>
          <span className="ey" style={{color:'var(--g)',marginBottom:'14px',display:'block'}}>Brand Enquiry</span>
          <h2 className="ih-h">Tell us about<br/><em>your brand</em></h2>
          <p className="ih-s">Share some details and we'll come back to you within 3 business days.</p>
        </div>
        <div className="ib">
          {!done ? (
            <form onSubmit={submit} noValidate>
              <div style={{position:'absolute',left:'-9999px'}}><input type="text" name="_gotcha" tabIndex={-1} autoComplete="off"/></div>
              <div className="irow"><div className="ifield"><label className="ilbl" htmlFor="fn">Your Name *</label><input className="iinput" id="fn" name="name" type="text" placeholder="Your name" required ref={ref} autoComplete="name"/></div><div className="ifield"><label className="ilbl" htmlFor="fe">Email *</label><input className="iinput" id="fe" name="email" type="email" placeholder="your@email.com" required autoComplete="email"/></div></div>
              <div className="irow"><div className="ifield"><label className="ilbl" htmlFor="fb">Brand Name *</label><input className="iinput" id="fb" name="brand" type="text" placeholder="Brand name" required/></div><div className="ifield"><label className="ilbl" htmlFor="fc">Category</label><select className="isel" id="fc" name="category"><option value="">Select category</option><option>Fashion & Apparel</option><option>Home & Lifestyle</option><option>Beauty & Skincare</option><option>Food & Beverage</option><option>Stationery & Design</option><option>Ceramics & Craft</option><option>Other</option></select></div></div>
              <div className="irow"><div className="ifield"><label className="ilbl" htmlFor="fs">Entry Stage</label><select className="isel" id="fs" name="stage"><option value="">Where are you now?</option><option>Exploring — early research</option><option>Considering — evaluating partners</option><option>Ready — looking to move soon</option><option>Already in India — need support</option></select></div><div className="ifield"><label className="ilbl" htmlFor="fco">Country of Origin</label><input className="iinput" id="fco" name="country" type="text" placeholder="e.g. Japan, France"/></div></div>
              <div className="irow s1"><div className="ifield"><label className="ilbl" htmlFor="fm">Message</label><textarea className="ita" id="fm" name="message" placeholder="Tell us about your brand..."/></div></div>
              {err && <p className="ierr" role="alert">{err}</p>}
              <div className="ifoot"><p className="inote">We review every enquiry personally. You'll hear back within 3 business days.</p><button className="isub" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Enquiry →'}</button></div>
            </form>
          ) : (
            <div className="iok show"><div style={{fontSize:'44px',opacity:.6}}>✦</div><h3 className="iok-h">Thank you</h3><p className="iok-p">We've received your enquiry and will be in touch within 3 business days.</p></div>
          )}
        </div>
      </div>
    </div>
  )
}
