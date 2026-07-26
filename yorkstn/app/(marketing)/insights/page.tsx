'use client'
import Footer from '@/components/Footer'
const articles = [
  {ft:true,cat:'IBEF Case Study · March 2025',read:'3–4 min',title:'Affordable Luxury: Understanding Premiumisation and Evolving Consumer Preferences in India',excerpt:"Published by the India Brand Equity Foundation, this case study explains how India's shift toward premium consumption is structural and long-term.",src:'India Brand Equity Foundation · Free',url:'https://www.ibef.org/research/case-study/affordable-luxury-understanding-premiumisation-and-evolving-consumer-preferences'},
  {ft:false,cat:'IBEF Industry Report · Updated 2025',read:'3–4 min',title:'Retail Industry in India — Overview, Market Size & Growth',excerpt:"IBEF's continuously updated sector overview covers India's retail market size, key growth drivers, and regional dynamics. The most reliable public starting point.",src:'India Brand Equity Foundation · Free',url:'https://www.ibef.org/industry/retail-india'},
  {ft:false,cat:'IBEF Industry Blog · Dec 2024',read:'3 min',title:"India's Home Décor Industry: Growth, Trends and Opportunities — The Rise of Artisanal Products",excerpt:'How handmade and artisanal home décor is gaining ground among affluent Indian consumers. The market reached USD 25.5B in 2024.',src:'India Brand Equity Foundation · Free',url:'https://www.ibef.org/blogs/transforming-spaces-the-growth-and-opportunities-in-india-s-home-d-cor-industry'},
  {ft:false,cat:'Deloitte & FICCI Report · August 2025',read:'4 min',title:"Spotting India's PRIME Innovation Moment — Premiumisation as a Key Growth Driver",excerpt:"Premiumisation is one of four structural shifts reshaping Indian retail through 2030. India's retail sector is on track to nearly double to USD 1.93 trillion.",src:'Deloitte India · Free',url:'https://www.deloitte.com/in/en/about/press-room/india-s-us-1-06-trillion-retail-sector-is-set-to-reach-1-93-trillion-by-2030.html'},
]
export default function InsightsPage() {
  return (
    <>
      <div className="pgh"><div className="pgh-bg" aria-hidden="true">INSIGHTS</div><span className="ey rv">Market Intelligence</span><h1 className="pgh-h1 rv d1">India Retail<br/><em>Insights</em></h1><p className="pgh-s rv d2">Curated reading on India's premium retail landscape. All sources are free and publicly accessible.</p></div>
      <div style={{padding:'96px 60px'}}>
        <span className="ey rv" style={{marginBottom:'14px',display:'block'}}>Curated Resources</span>
        <h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,62px)',fontWeight:300,lineHeight:1.05,color:'var(--b)',marginTop:'18px'}}>What to read before<br/><em style={{fontStyle:'italic',color:'var(--bl)'}}>entering India</em></h2>
        <p className="rv d2" style={{fontSize:'15px',lineHeight:2,color:'var(--tx)',fontWeight:300,maxWidth:'540px',marginTop:'18px',marginBottom:'56px'}}>Each resource below is free, publicly available, and directly relevant to India's premium retail opportunity.</p>
        <div className="rv d2" style={{display:'grid',gap:'2px',background:'rgba(55,24,37,.08)'}}>
          {articles.map((a,i)=>(
            <article key={i} style={{background:a.ft?'var(--b)':'var(--c)',padding:'40px 44px',transition:'background .35s'}} onMouseEnter={e=>(e.currentTarget.style.background=a.ft?'var(--bm)':'var(--cd)')} onMouseLeave={e=>(e.currentTarget.style.background=a.ft?'var(--b)':'var(--c)')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'20px',marginBottom:'16px',flexWrap:'wrap'}}>
                <p style={{fontSize:'10px',letterSpacing:'.26em',textTransform:'uppercase',color:a.ft?'var(--g)':'var(--mt)',fontWeight:400}}>{a.cat}</p>
                <span style={{fontSize:'10px',letterSpacing:'.2em',textTransform:'uppercase',color:a.ft?'var(--g)':'var(--mt)',fontWeight:400,background:a.ft?'rgba(240,232,224,.07)':'rgba(55,24,37,.06)',padding:'5px 12px'}}>{a.read} read</span>
              </div>
              <h3 style={{fontFamily:'var(--fd)',fontSize:a.ft?'30px':'26px',fontWeight:400,color:a.ft?'var(--c)':'var(--b)',lineHeight:1.25,marginBottom:'12px'}}>{a.title}</h3>
              <p style={{fontSize:'14px',lineHeight:1.95,color:a.ft?'rgba(240,232,224,.52)':'var(--mt)',fontWeight:300,marginBottom:'18px'}}>{a.excerpt}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'10px',letterSpacing:'.18em',textTransform:'uppercase',color:a.ft?'rgba(240,232,224,.28)':'var(--mt)',fontWeight:400,borderTop:`1px solid ${a.ft?'rgba(240,232,224,.06)':'rgba(55,24,37,.08)'}`,paddingTop:'16px'}}>
                <span>{a.src}</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{color:'var(--g)',textDecoration:'none'}}>Read →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  )
}
