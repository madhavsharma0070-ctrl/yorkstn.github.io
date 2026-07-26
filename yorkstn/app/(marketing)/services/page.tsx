'use client'
import { useState } from 'react'
import Footer from '@/components/Footer'
const problems = [
  {t:'Regulatory Complexity',p:"BIS certifications, CAROTAR customs rules, GST registration, DPIIT approvals — India's compliance stack is layered and unforgiving for foreign brands.",s:'We manage the complete regulatory roadmap before your first shipment arrives in India.'},
  {t:'Wrong Retail Location',p:'Premium real estate in Delhi NCR requires local relationships and negotiation fluency. International brands often overpay or sign unfavourable lease terms.',s:'We identify, evaluate, and negotiate retail spaces that align precisely to your brand tier.'},
  {t:'Store Identity Gets Lost',p:"Indian buildout vendors rarely understand artisanal brand aesthetics. Material compromises misrepresent your brand at its most critical first moment.",s:'We project-manage every detail of the store setup against your brand guidelines, end to end.'},
  {t:'No Ground-Level Intelligence',p:'Generic market reports cannot tell you whether your specific category and price point will resonate with the premium consumer segment in Gurugram.',s:'We deliver a tailored India feasibility report built specifically around your brand and category.'},
  {t:'Supply Chain Complexity',p:'Freight forwarding, customs clearance, GST-compliant invoicing, e-way bills — without a local expert this leads to stockouts, customs holds, and margin erosion.',s:'We operate your full India-side supply chain, from your origin country to the shelf in Gurugram.'},
  {t:'Speed Dilutes Craft',p:'Scaling too fast across multiple cities with a wide SKU range is the most common reason once-aspirational brands become commonplace within a few years.',s:'We build genuine community first. Geography and scale follow only once the foundation is real.'},
]
const services = [
  {n:'01',name:'India Feasibility & Market Intelligence',tag:'Research',desc:'We produce a tailored feasibility report covering consumer segment analysis, competitive landscape, pricing feasibility, and a recommended phased entry roadmap built for your specific category and brand tier in Delhi NCR.',items:['Consumer segment & spending profile for Delhi NCR','Competitive landscape & category white-space','Price positioning & import duty modelling','Recommended phased entry roadmap','Retail channel strategy (EBO vs. MBO)']},
  {n:'02',name:'Legal Entity Setup & Compliance',tag:'Regulatory',desc:'We handle the complete regulatory stack: entity incorporation, DPIIT approvals, BIS product certifications, CAROTAR customs documentation, import licensing, and GST registration.',items:['Indian entity incorporation (Pvt Ltd or LLP)','DPIIT single-brand retail FDI approval','BIS mandatory product certification','CAROTAR rules-of-origin documentation','GST registration & ongoing compliance','Import Export Code (IEC)']},
  {n:'03',name:'Retail Location & Lease Negotiation',tag:'Real Estate',desc:'We leverage our established retail network in Gurugram to identify spaces that align with your brand positioning, negotiate lease terms, and ensure brand standards are protected in the agreement.',items:['Shortlisted locations with scored comparison','Footfall & customer profile per site','Lease term negotiation & review','Brand standards written into lease','Mall and developer relationship management']},
  {n:'04',name:'Store Design, Buildout & Brand Fidelity',tag:'Retail Experience',desc:'We project-manage the entire store fit-out against your brand guidelines, sourcing vendors who can meet specification and ensuring every element reflects your identity precisely.',items:['Brand guideline interpretation for Indian buildout','Vendor identification & quality management','Fixtures, lighting & materials sourcing','Visual merchandising & layout','Soft launch event management']},
  {n:'05',name:'Supply Chain & Import Operations',tag:'Operations',desc:'We operate the full India-side supply chain: freight forwarding, customs clearance, warehousing, replenishment planning, and e-way bill compliance.',items:['Freight forwarding & customs clearance','Warehouse & storage management','GST-compliant invoicing & e-way bills','Inventory replenishment planning','Monthly inventory & sell-through reporting']},
  {n:'06',name:'Community Building & Brand Activation',tag:'Marketing',desc:'We identify early adopters and tastemakers in Delhi NCR, organise curated preview events, and deliberately seed the brand into the right lifestyle communities.',items:['Early adopter & tastemaker identification','Curated launch & preview events','Editorial & media relationship management','Community seeding strategy','Seasonal brand activation planning']},
]
export default function ServicesPage() {
  const [open, setOpen] = useState<number|null>(null)
  const openInq = () => document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))
  return (
    <>
      <div className="pgh"><div className="pgh-bg" aria-hidden="true">SOLUTIONS</div><span className="ey rv">What We Do</span><h1 className="pgh-h1 rv d1">The Problems<br/>We <em>Solve for You</em></h1><p className="pgh-s rv d2">India's premium retail market is full of opportunity — and full of friction. Yorkstn removes the friction.</p></div>
      <section style={{padding:'96px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'72px',marginBottom:'64px',alignItems:'end'}}>
          <h2 className="rv" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,58px)',fontWeight:300,lineHeight:1.05,color:'var(--b)'}}>Why brands struggle<br/>in India, and <em style={{fontStyle:'italic',color:'var(--bl)'}}>how we fix it</em></h2>
          <p className="rv d2" style={{fontSize:'15px',lineHeight:2.1,color:'var(--tx)',fontWeight:300}}>Every problem below is real and recurring. We've built Yorkstn's model around solving each one before they become your problem.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2px',background:'rgba(55,24,37,.08)'}}>
          {problems.map((p,i) => (
            <article key={i} className="rv" style={{background:'var(--c)',padding:'40px 34px',position:'relative',overflow:'hidden',transition:'background .4s'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--cd)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--c)')}>
              <span style={{fontFamily:'var(--fd)',fontSize:'76px',fontWeight:300,color:'rgba(55,24,37,.055)',lineHeight:1,position:'absolute',top:'14px',right:'18px'}} aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
              <h3 style={{fontFamily:'var(--fd)',fontSize:'22px',fontWeight:400,color:'var(--b)',marginBottom:'14px'}}>{p.t}</h3>
              <p style={{fontSize:'14px',lineHeight:2,color:'var(--tx)',fontWeight:300}}>{p.p}</p>
              <p style={{marginTop:'22px',paddingTop:'18px',borderTop:'1px solid rgba(55,24,37,.12)',fontSize:'13px',color:'var(--b)',fontWeight:400,display:'flex',gap:'10px',lineHeight:1.75}}><span style={{color:'var(--g)',flexShrink:0}}>→</span>{p.s}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="rule"/>
      <section style={{background:'var(--cd)',padding:'96px 60px'}}>
        <div style={{marginBottom:'56px'}}><span className="ey rv">Our Services</span><h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,58px)',fontWeight:300,color:'var(--b)',marginTop:'18px'}}>Six things we do.<br/>All of them completely.</h2></div>
        <div>
          {services.map((s,i) => (
            <div key={i} style={{borderTop:'1px solid rgba(55,24,37,.1)',...(i===services.length-1?{borderBottom:'1px solid rgba(55,24,37,.1)'}:{})}}>
              <button style={{width:'100%',display:'grid',gridTemplateColumns:'48px 1fr auto auto',alignItems:'center',gap:'24px',padding:'28px 0',textAlign:'left',background:'none',border:'none',minHeight:'44px'}} onClick={()=>setOpen(open===i?null:i)}>
                <span style={{fontFamily:'var(--fd)',fontSize:'14px',color:'var(--g)',fontWeight:300}}>{s.n}</span>
                <span style={{fontFamily:'var(--fd)',fontSize:'clamp(20px,2.5vw,30px)',fontWeight:300,color:'var(--b)'}}>{s.name}</span>
                <span style={{fontSize:'10px',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--mt)',fontWeight:400,whiteSpace:'nowrap'}}>{s.tag}</span>
                <span style={{width:'44px',height:'44px',border:'1px solid rgba(55,24,37,.18)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',color:'var(--b)',flexShrink:0,transition:'transform .4s,background .3s',...(open===i?{transform:'rotate(45deg)',background:'var(--b)',color:'var(--c)'}:{})}}>+</span>
              </button>
              <div style={{display:'grid',gridTemplateRows:open===i?'1fr':'0fr',transition:'grid-template-rows .45s var(--ease)'}}>
                <div style={{overflow:'hidden',paddingLeft:'72px'}}>
                  <div style={{paddingBottom:'36px',display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:'44px'}}>
                    <p style={{fontSize:'14px',lineHeight:2.1,color:'var(--tx)',fontWeight:300}}>{s.desc}</p>
                    <div><p style={{fontSize:'9px',letterSpacing:'.28em',textTransform:'uppercase',color:'var(--g)',marginBottom:'14px',fontWeight:400}}>What you receive</p><ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'8px'}}>{s.items.map((d,j)=><li key={j} style={{fontSize:'13px',color:'var(--tx)',fontWeight:300,display:'flex',gap:'9px',lineHeight:1.75}}><span style={{color:'var(--g)',opacity:.6,fontSize:'10px',flexShrink:0}}>—</span>{d}</li>)}</ul></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:'72px 60px',textAlign:'center',background:'var(--c)'}}><span className="ey rv" style={{justifyContent:'center',display:'inline-flex',marginBottom:'16px'}}>Get Started</span><h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(26px,4vw,50px)',fontWeight:300,color:'var(--b)',marginBottom:'24px',marginTop:'18px'}}>Not sure which services you need?<br/><em style={{fontStyle:'italic',color:'var(--bl)'}}>Tell us about your brand.</em></h2><button className="btn btn-d rv d2" onClick={openInq}>Submit Brand Enquiry →</button></section>
      <Footer/>
    </>
  )
}
