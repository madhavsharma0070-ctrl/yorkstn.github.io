'use client'
import Footer from '@/components/Footer'
export default function ContactPage() {
  const openInq = () => document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))
  return (
    <>
      <div style={{minHeight:'calc(100vh - 72px)',paddingTop:'72px',display:'grid',gridTemplateColumns:'1fr 1fr'}}>
        <div style={{background:'var(--b)',padding:'72px 60px',display:'flex',flexDirection:'column',justifyContent:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:'-20px',bottom:'-36px',fontSize:'240px',color:'rgba(255,255,255,.018)',fontWeight:100,lineHeight:1,pointerEvents:'none'}} aria-hidden="true">संपर्क</div>
          <span className="ey rv" style={{color:'var(--g)',marginBottom:'28px',display:'block'}}>Connect with Yorkstn</span>
          <h1 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(42px,5.5vw,76px)',fontWeight:300,lineHeight:.95,color:'var(--c)',marginBottom:'28px'}}>Ready to Enter<br/><em style={{fontStyle:'italic',color:'rgba(240,232,224,.42)'}}>India Right?</em></h1>
          <p className="rv d2" style={{fontSize:'14px',lineHeight:2.15,color:'rgba(240,232,224,.55)',maxWidth:'440px',fontWeight:300,marginBottom:'44px'}}>If you represent a brand that knows the value of its craft and wants to preserve and expand it with care, we'd like to hear from you.</p>
          <a className="rv d3" href="mailto:connect@yorkstn.com" style={{fontFamily:'var(--fd)',fontSize:'21px',fontWeight:300,color:'var(--g)',display:'flex',alignItems:'center',gap:'12px',textDecoration:'none'}}>connect@yorkstn.com →</a>
        </div>
        <div className="rv d1" style={{background:'var(--cd)',padding:'72px 60px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <h2 style={{fontFamily:'var(--fd)',fontSize:'28px',fontWeight:300,color:'var(--b)',marginBottom:'32px',paddingBottom:'22px',borderBottom:'1px solid rgba(55,24,37,.1)'}}>Yorkstn at a Glance</h2>
          {[{l:'Operational Base',v:'Gurugram, Delhi NCR, India'},{l:'Who We Work With',v:'Brands that know the value of their craft and want to preserve and expand it thoughtfully'},{l:'Partnership Models',v:'Master Franchise · Joint Venture · Distribution Partner'},{l:'Launch Market',v:'Gurugram, Delhi NCR'}].map((d,i)=>(
            <div key={i} style={{padding:'22px 0',borderBottom:'1px solid rgba(55,24,37,.07)',...(i===0?{borderTop:'1px solid rgba(55,24,37,.07)'}:{})}}>
              <p style={{fontSize:'9px',letterSpacing:'.3em',textTransform:'uppercase',color:'var(--g)',marginBottom:'7px',fontWeight:400}}>{d.l}</p>
              <p style={{fontFamily:'var(--fd)',fontSize:'20px',fontWeight:300,color:'var(--b)',lineHeight:1.5}}>{d.v}</p>
            </div>
          ))}
          <div style={{marginTop:'32px',padding:'20px 22px',background:'rgba(55,24,37,.05)',borderLeft:'2px solid rgba(192,154,98,.33)'}}><p style={{fontSize:'13px',lineHeight:2,color:'var(--mt)',fontStyle:'italic',fontWeight:300}}>"We are not a vendor. If we believe in a brand, we are willing to invest alongside it — capital, time, and presence on the ground."</p></div>
          <button className="btn btn-d" onClick={openInq} style={{marginTop:'28px',width:'100%',justifyContent:'center'}}>Submit Brand Enquiry →</button>
        </div>
      </div>
      <Footer/>
    </>
  )
}
