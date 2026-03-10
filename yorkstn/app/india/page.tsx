import Footer from '@/components/Footer'
export default function IndiaPage() {
  return (
    <>
      <div className="pgh"><div className="pgh-bg" aria-hidden="true">INDIA</div><span className="ey rv">India Market</span><h1 className="pgh-h1 rv d1">The Opportunity<br/>is <em>Right Now</em></h1><p className="pgh-s rv d2">India is set to become the world's third-largest retail market by 2030. Its premium consumer base is shifting toward quality, provenance, and long-term value.</p></div>
      <div style={{padding:'96px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'72px',marginBottom:'72px',alignItems:'start'}}>
          <div><span className="ey rv" style={{marginBottom:'18px',display:'block'}}>Why India, Why Now</span><h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,62px)',fontWeight:300,lineHeight:1.05,color:'var(--b)',marginTop:'18px'}}>India doesn't need<br/>more brands.<br/><em style={{fontStyle:'italic',color:'var(--bl)'}}>It needs the right ones.</em></h2></div>
          <div style={{paddingTop:'56px'}}><p className="rv d2" style={{fontSize:'15px',lineHeight:2.2,color:'var(--tx)',fontWeight:300,marginBottom:'18px'}}>India's retail market reached USD 993 billion in 2024 and is projected to grow at a 13% CAGR through 2033. India's affluent class now comprises around 12 million households, with North India holding over 35% of the national luxury goods market share.</p><p className="rv d3" style={{fontSize:'15px',lineHeight:2.2,color:'var(--tx)',fontWeight:300}}>The artisanal brand consumer in India is well-travelled, globally informed, and actively seeking products with genuine provenance and long-term value. The challenge isn't demand — it's the absence of a disciplined entry partner who protects brand identity while navigating India's structural complexity.</p></div>
        </div>
        <div className="rv" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'2px',background:'rgba(55,24,37,.08)',marginBottom:'72px'}}>
          {[{n:'3rd',l:'Projected global retail market rank by 2030',src:'IBEF, 2024'},{n:'13%+',l:'India retail market CAGR, 2025–2033',src:'IMARC Group, 2024'},{n:'35%+',l:"North India's share of national luxury goods market",src:'IMARC Group, 2024'}].map((s,i)=>(
            <div key={i} style={{background:'var(--c)',padding:'40px 32px',transition:'background .35s'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--cd)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--c)')}>
              <div style={{fontFamily:'var(--fd)',fontSize:'clamp(32px,4vw,52px)',fontWeight:300,color:'var(--b)',lineHeight:1,marginBottom:'7px'}}>{s.n}</div>
              <div style={{fontSize:'11px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--mt)',fontWeight:400,lineHeight:1.75}}>{s.l}</div>
              <div style={{fontSize:'10px',color:'var(--mt)',marginTop:'7px',fontStyle:'italic',fontWeight:300}}>{s.src}</div>
            </div>
          ))}
          <div style={{background:'var(--b)',padding:'40px 32px'}}><div style={{fontFamily:'var(--fd)',fontSize:'clamp(16px,1.8vw,24px)',fontWeight:300,color:'var(--c)',lineHeight:1,marginBottom:'7px'}}>NCR First</div><div style={{fontSize:'11px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--g)',fontWeight:400,lineHeight:1.75}}>India's highest premium consumer concentration</div><p style={{fontSize:'12px',color:'rgba(240,232,224,.42)',marginTop:'9px',lineHeight:1.8,fontWeight:300}}>Delhi-NCR retail leasing surged 65% YoY in Q3 2025.</p></div>
        </div>
      </div>
      <div style={{background:'var(--b)',padding:'72px 60px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'72px',alignItems:'center'}}>
        <div><span className="ey rv" style={{color:'var(--g)',marginBottom:'18px',display:'block'}}>Why Artisanal, Why Now</span><h2 className="rv d1" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,58px)',fontWeight:300,lineHeight:1.05,color:'var(--c)',marginTop:'18px'}}>A shared philosophy<br/>of <em style={{fontStyle:'italic',color:'rgba(240,232,224,.42)'}}>craft & patience</em></h2><p className="rv d2" style={{fontSize:'14px',lineHeight:2.2,color:'rgba(240,232,224,.58)',fontWeight:300,marginTop:'18px'}}>Artisanal brand-building is rooted in discipline, patience, and deep respect for craft. This philosophy connects meaningfully with India's premium consumers seeking products with authentic provenance.</p></div>
        <div className="rv d2">
          {[{n:'I',t:'Philosophical Alignment',d:"Artisanal brands build for longevity. India's premium consumer increasingly does the same."},{n:'II',t:'Category White Space',d:"Global craft categories have very limited authentic representation in India's premium retail landscape."},{n:'III',t:'First-Mover Advantage',d:'Artisanal brands that establish presence in India now will define what global craft means to the Indian consumer for years ahead.'}].map((p,i)=>(
            <div key={i} style={{padding:'26px 0',borderBottom:'1px solid rgba(240,232,224,.07)',display:'flex',gap:'22px',alignItems:'flex-start',...(i===0?{borderTop:'1px solid rgba(240,232,224,.07)'}:{})}}>
              <div style={{fontFamily:'var(--fd)',fontSize:'30px',fontWeight:300,color:'var(--g)',lineHeight:1,flexShrink:0,width:'34px'}}>{p.n}</div>
              <div><p style={{fontFamily:'var(--fd)',fontSize:'18px',fontWeight:400,color:'rgba(240,232,224,.78)',marginBottom:'5px'}}>{p.t}</p><p style={{fontSize:'13px',lineHeight:2,color:'rgba(240,232,224,.52)',fontWeight:300}}>{p.d}</p></div>
            </div>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  )
}
