'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const d = document.getElementById('cur-d')
    const r = document.getElementById('cur-r')
    if (!d || !r) return
    let mx=-300,my=-300,rx=-300,ry=-300
    document.addEventListener('mousemove',(e)=>{mx=e.clientX;my=e.clientY;d.style.left=mx+'px';d.style.top=my+'px'})
    const loop=()=>{rx+=(mx-rx)*.11;ry+=(my-ry)*.11;r.style.left=rx+'px';r.style.top=ry+'px';requestAnimationFrame(loop)}
    loop()
    const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.07})
    document.querySelectorAll('.rv').forEach(el=>io.observe(el))
  },[])

  const openInq=()=>document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))

  return (
    <>
      <nav className="nav sol">
        <Link href="/" className="logo"><span className="logo-n">Yorkstn</span><span className="logo-s">Community Before Commerce</span></Link>
        <div className="nav-r">
          <ul className="nav-links">
            <li><Link href="/" className="act">Home</Link></li>
            <li><Link href="/services">What We Do</Link></li>
            <li><Link href="/india">India Market</Link></li>
            <li><Link href="/insights">Insights</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          <button className="nav-enq" onClick={openInq}>Brand Enquiry</button>
        </div>
      </nav>
      <section style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1.1fr .9fr',paddingTop:'72px'}}>
        <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'80px 60px'}}>
          <span className="ey rv" style={{marginBottom:'32px'}}>Delhi NCR · Global Craft Brands · India Market Entry</span>
          <h1 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(54px,7vw,108px)',fontWeight:300,lineHeight:.93,letterSpacing:'-.02em',color:'var(--b)',marginBottom:'40px'}}>Your Brand.<br/><em style={{fontStyle:'italic',color:'var(--bl)',display:'block'}}>India, Done Right.</em></h1>
          <p className="rv d2" style={{fontSize:'15px',lineHeight:2.1,color:'var(--tx)',maxWidth:'400px',marginBottom:'44px',fontWeight:300}}>Yorkstn is the structured market entry partner global artisanal brands need to grow in India, handling every layer of compliance, operations, and retail so your identity stays intact.</p>
          <div className="rv d3" style={{display:'flex',alignItems:'center',gap:'24px',flexWrap:'wrap'}}>
            <Link href="/services" className="btn btn-d">See What We Do →</Link>
            <button className="btn btn-o" onClick={openInq}>Brand Enquiry</button>
          </div>
        </div>
        <div style={{background:'var(--b)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',bottom:'-40px',right:'-30px',fontFamily:'var(--fd)',fontSize:'230px',fontWeight:300,color:'rgba(255,255,255,.033)',lineHeight:1,pointerEvents:'none'}} aria-hidden="true">YORKSTN</div>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'60px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'32px',marginBottom:'44px'}}>
              {[{n:'3rd',l:"India's projected rank as global retail market by 2030"},{n:'Delhi NCR',l:"India's largest luxury goods market — over 35% national share"},{n:'13%+',l:'India retail market CAGR 2025–2033 (IMARC Group)'}].map(s=>(
                <div key={s.n} style={{borderTop:'1px solid rgba(240,232,224,.1)',paddingTop:'22px'}}>
                  <div style={{fontFamily:'var(--fd)',fontSize:'48px',fontWeight:300,color:'var(--c)',lineHeight:1,marginBottom:'5px'}}>{s.n}</div>
                  <div style={{fontSize:'11px',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--g)',fontWeight:400}}>{s.l}</div>
                </div>
              ))}
            </div>
            <blockquote style={{borderLeft:'2px solid rgba(192,154,98,.33)',paddingLeft:'20px'}}>
              <p style={{fontFamily:'var(--fd)',fontSize:'18px',fontStyle:'italic',fontWeight:300,color:'rgba(240,232,224,.52)',lineHeight:1.6}}>"Great brands don't fail in India because of product. They fail because of entry."</p>
              <cite style={{fontSize:'9px',letterSpacing:'.24em',textTransform:'uppercase',color:'rgba(240,232,224,.22)',marginTop:'8px',display:'block'}}>— Yorkstn, Founding Principle</cite>
            </blockquote>
          </div>
        </div>
      </section>
      <div className="mq" aria-hidden="true">
        <div className="mq-t">
          {['Community Before Commerce','Feasibility & Market Research','BIS · CAROTAR · GST Compliance','Master Franchise & Distribution','Global Artisanal Brands · Delhi NCR','Store Setup & Brand Aesthetics','Depth Before Scale','Community Before Commerce','Feasibility & Market Research','BIS · CAROTAR · GST Compliance','Master Franchise & Distribution','Global Artisanal Brands · Delhi NCR','Store Setup & Brand Aesthetics','Depth Before Scale'].map((t,i)=>(
            <span key={i} className="mq-i">{t} <span className="mq-d">✦</span></span>
          ))}
        </div>
      </div>
      <section style={{padding:'96px 60px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'80px',alignItems:'center'}}>
        <div>
          <span className="ey rv" style={{marginBottom:'20px',display:'block'}}>What Yorkstn Does</span>
          <h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,56px)',fontWeight:300,lineHeight:1.05,color:'var(--b)',marginBottom:'24px',marginTop:'18px'}}>We handle India.<br/><em style={{fontStyle:'italic',color:'var(--bl)'}}>You stay focused on your craft.</em></h2>
          <p className="rv d2" style={{fontSize:'15px',lineHeight:2.2,color:'var(--tx)',fontWeight:300,marginBottom:'32px'}}>From feasibility research to legal setup, retail location to store buildout, Yorkstn takes full operational responsibility so your brand can enter India without compromising its identity.</p>
          <Link href="/services" className="btn btn-d rv d3">Explore Our Services →</Link>
        </div>
        <div className="rv d2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px',background:'rgba(55,24,37,.08)'}}>
          {[{n:'01',l:'Feasibility\n& Research',dk:false},{n:'02',l:'Legal &\nCompliance',dk:false},{n:'03',l:'Retail &\nStore Setup',dk:true},{n:'04',l:'Operations\n& Community',dk:false}].map(b=>(
            <div key={b.n} style={{background:b.dk?'var(--b)':'var(--c)',padding:'34px 26px'}}>
              <p style={{fontFamily:'var(--fd)',fontSize:'40px',fontWeight:300,lineHeight:1,marginBottom:'7px',color:b.dk?'var(--c)':'var(--b)'}}>{b.n}</p>
              <p style={{fontSize:'11px',letterSpacing:'.17em',textTransform:'uppercase',color:b.dk?'var(--g)':'var(--mt)',fontWeight:400,lineHeight:1.7,whiteSpace:'pre-line'}}>{b.l}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="rule"/>
      <section style={{padding:'72px 60px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'40px',flexWrap:'wrap'}}>
        <div>
          <span className="ey rv" style={{marginBottom:'14px',display:'block'}}>Ready to explore?</span>
          <h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(26px,3.5vw,46px)',fontWeight:300,color:'var(--b)',lineHeight:1.1,marginTop:'10px'}}>Tell us about your brand.<br/><em style={{fontStyle:'italic',color:'var(--bl)'}}>We'll tell you what's possible.</em></h2>
        </div>
        <button className="btn btn-d rv d2" onClick={openInq} style={{whiteSpace:'nowrap'}}>Submit Brand Enquiry →</button>
      </section>
      <footer>
        <div className="ft">
          <div><div className="fln">Yorkstn</div><div className="fls">Community Before Commerce</div><p className="fd2">A master franchise and distribution partner for global artisanal brands entering India. Gurugram, Delhi NCR.</p></div>
          <div><p className="fct">Navigate</p><ul className="fli"><li><Link href="/">Home</Link></li><li><Link href="/services">What We Do</Link></li><li><Link href="/india">India Market</Link></li><li><Link href="/insights">Insights</Link></li><li><Link href="/about">About</Link></li></ul></div>
          <div><p className="fct">Services</p><ul className="fli"><li><Link href="/services">Feasibility Report</Link></li><li><Link href="/services">Legal & Compliance</Link></li><li><Link href="/services">Retail & Store Setup</Link></li><li><Link href="/services">Operations</Link></li></ul></div>
          <div><p className="fct">Connect</p><ul className="fli"><li><a href="mailto:connect@yorkstn.com">connect@yorkstn.com</a></li><li><Link href="/contact">Contact Page</Link></li></ul></div>
        </div>
        <div className="fb"><p className="fcp">© 2025 Yorkstn. All rights reserved.</p><div className="flegal"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></div><p className="fcp">Founded by Madhav Sharma & Vedika Bhardwaj</p></div>
      </footer>
    </>
  )
}
