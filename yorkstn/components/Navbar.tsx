'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const openInq = () => document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))
  const openMenu = () => document.dispatchEvent(new CustomEvent('yorkstn:menu:open'))
  const links = [['/', 'Home'],['/services','What We Do'],['/india','India Market'],['/insights','Insights'],['/about','About'],['/contact','Contact']]
  return (
    <nav className={`nav ${scrolled || pathname !== '/' ? 'sol' : ''}`}>
      <Link href="/" className="logo"><span className="logo-n">Yorkstn</span><span className="logo-s">Community Before Commerce</span></Link>
      <div className="nav-r">
        <ul className="nav-links">{links.map(([href,label]) => <li key={href}><Link href={href} className={pathname === href ? 'act' : ''}>{label}</Link></li>)}</ul>
        <button className="nav-enq" onClick={openInq}>Brand Enquiry</button>
        <button className="nav-menu" onClick={openMenu}><div className="hbg"><span/><span/><span/></div>Menu</button>
      </div>
    </nav>
  )
}
