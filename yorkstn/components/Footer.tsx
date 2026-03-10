import Link from 'next/link'
export default function Footer() {
  return (
    <footer>
      <div className="ft">
        <div><div className="fln">Yorkstn</div><div className="fls">Community Before Commerce</div><p className="fd2">A master franchise and distribution partner for global artisanal brands entering India. Gurugram, Delhi NCR.</p></div>
        <div><p className="fct">Navigate</p><ul className="fli"><li><Link href="/">Home</Link></li><li><Link href="/services">What We Do</Link></li><li><Link href="/india">India Market</Link></li><li><Link href="/insights">Insights</Link></li><li><Link href="/about">About</Link></li></ul></div>
        <div><p className="fct">Services</p><ul className="fli"><li><Link href="/services">Feasibility Report</Link></li><li><Link href="/services">Legal & Compliance</Link></li><li><Link href="/services">Retail & Store Setup</Link></li><li><Link href="/services">Operations</Link></li></ul></div>
        <div><p className="fct">Connect</p><ul className="fli"><li><a href="mailto:connect@yorkstn.com">connect@yorkstn.com</a></li><li><Link href="/contact">Contact Page</Link></li></ul></div>
      </div>
      <div className="fb"><p className="fcp">© 2025 Yorkstn. All rights reserved.</p><div className="flegal"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></div><p className="fcp">Founded by Madhav Sharma & Vedika Bhardwaj</p></div>
    </footer>
  )
}
