'use client'
import Footer from '@/components/Footer'
export default function AboutPage() {
  const founders = [
    {i:'V',role:'Co-Founder · Creative Direction & Brand Strategy',name:'Vedika\nBhardwaj',bio:"Fashion Design graduate from NIFT Delhi, where a garment she designed was selected for Bharat Tex. She worked with designers and export houses across India, gaining firsthand insight into production, branding, and the tension between creative vision and commercial reality.",creds:['NIFT Delhi — Fashion Design','Garment presented at Bharat Tex','Experience with designers & export houses']},
    {i:'M',role:'Co-Founder · Operations & Structural Systems',name:'Madhav\nSharma',bio:"Operational Research and Economics graduate from the University of Delhi. His foundation in statistics and systems optimisation gives him the ability to design backend structures built for long-term efficiency and scale.",creds:['University of Delhi — Operational Research & Economics','Systems optimisation & scalable infrastructure','Indian consumer economics & retail behaviour']},
  ]
  return (
    <>
      <div className="pgh"><div className="pgh-bg" aria-hidden="true">ABOUT</div><span className="ey rv">About Yorkstn</span><h1 className="pgh-h1 rv d1">Where Creativity<br/><em>Met Structure</em></h1><p className="pgh-s rv d1">Yorkstn was built on a shared frustration: watching brands with real identity enter India without the structural backing to protect it.</p></div>
      <div style={{padding:'96px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'72px',marginBottom:'72px',alignItems:'end',paddingBottom:'56px',borderBottom:'1px solid rgba(55,24,37,.1)'}}>
          <h2 className="rv" style={{fontFamily:'var(--fd)',fontSize:'clamp(34px,4.5vw,62px)',fontWeight:300,lineHeight:1.05,color:'var(--b)',marginTop:'18px'}}>The <em style={{fontStyle:'italic',color:'var(--bl)'}}>Founding</em><br/>Idea</h2>
          <p className="rv d2" style={{fontSize:'15px',lineHeight:2.2,color:'var(--tx)',fontWeight:300}}>India doesn't need more brands. It needs finer curation and a more disciplined approach to entry. Yorkstn was conceived as the answer to that problem — not a consulting firm, but an operational partner that steps in and executes.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px',background:'rgba(55,24,37,.08)'}}>
          {founders.map((f,i)=>(
            <article key={i} className={`rv${i===1?' d2':''}`} style={{background:'var(--c)',padding:'52px 44px',position:'relative'}}>
              <div style={{position:'absolute',top:'22px',right:'22px',fontFamily:'var(--fd)',fontSize:'130px',fontWeight:300,color:'rgba(55,24,37,.047)',lineHeight:1}} aria-hidden="true">{f.i}</div>
              <p style={{fontSize:'9px',letterSpacing:'.3em',textTransform:'uppercase',color:'var(--g)',marginBottom:'14px',fontWeight:400}}>{f.role}</p>
              <h2 style={{fontFamily:'var(--fd)',fontSize:'42px',fontWeight:300,color:'var(--b)',lineHeight:1.1,marginBottom:'24px',whiteSpace:'pre-line'}}>{f.name}</h2>
              <p style={{fontSize:'13px',lineHeight:2.15,color:'var(--tx)',fontWeight:300,marginBottom:'24px'}}>{f.bio}</p>
              <div style={{display:'flex',flexDirection:'column',gap:'9px',paddingTop:'22px',borderTop:'1px solid rgba(55,24,37,.1)'}}>
                {f.creds.map((c,j)=><p key={j} style={{fontSize:'12px',color:'var(--mt)',fontWeight:400,display:'flex',alignItems:'center',gap:'9px'}}><span style={{color:'var(--g)',opacity:.6,fontSize:'9px'}}>—</span>{c}</p>)}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div style={{background:'var(--b)',padding:'60px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'36px'}}>
        {[{n:'I',t:'Community Before Commerce',d:'We build trust and loyal community before pushing growth. Every partnership is taken seriously. Every launch is a statement.'},{n:'II',t:'Depth Before Scale',d:'We start with Gurugram, build something real, then grow. Scale follows a strong foundation — never the other way around.'},{n:'III',t:'Identity Is Non-Negotiable',d:"We don't alter brand identity for local convenience. We cultivate understanding and loyalty around what the brand truly is."}].map((p,i)=>(
          <div key={i} className={`rv d${i+1}`} style={{padding:'0 18px',...(i<2?{borderRight:'1px solid rgba(240,232,224,.06)'}:{})}}>
            <p style={{fontFamily:'var(--fd)',fontSize:'44px',fontWeight:300,color:'rgba(240,232,224,.1)',lineHeight:1,marginBottom:'10px'}} aria-hidden="true">{p.n}</p>
            <p style={{fontFamily:'var(--fd)',fontSize:'20px',fontWeight:400,color:'rgba(240,232,224,.78)',marginBottom:'10px'}}>{p.t}</p>
            <p style={{fontSize:'13px',lineHeight:2,color:'rgba(240,232,224,.42)',fontWeight:300}}>{p.d}</p>
          </div>
        ))}
      </div>
      <Footer/>
    </>
  )
}
