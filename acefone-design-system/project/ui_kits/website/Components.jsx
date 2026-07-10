const { useState } = React;

function Nav() {
  const links = ["Products", "Solutions", "Industries", "Pricing", "Resources", "Company"];
  return (
    <nav style={{position:'sticky',top:0,zIndex:10,background:'rgba(255,255,255,.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid #EEF0F5'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 32px',height:72,display:'flex',alignItems:'center',gap:32}}>
        <img src="../../assets/logo.svg" alt="Acefone" style={{height:36}}/>
        <div style={{display:'flex',gap:22,flex:1,marginLeft:16}}>
          {links.map(l => <a key={l} href="#" style={{color:'#051441',fontSize:14,fontWeight:500,textDecoration:'none'}}>{l} <span style={{opacity:.5,fontSize:10}}>▾</span></a>)}
        </div>
        <a href="#" style={{color:'#1338A4',fontSize:14,fontWeight:600,textDecoration:'none'}}>Sign In</a>
        <button style={{padding:'10px 18px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#1A4ADB,#1338A4)',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>Book a Demo</button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{background:'linear-gradient(180deg,#051441 0%,#0D2A7C 55%,#1338A4 100%)',color:'#fff',padding:'96px 32px 120px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.08) 1.5px,transparent 2px)',backgroundSize:'28px 28px',opacity:.6,pointerEvents:'none'}}/>
      <div style={{maxWidth:1200,margin:'0 auto',position:'relative'}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'#A8BCF5',marginBottom:20}}>The AceX platform · 2.5B engagements / year</div>
        <h1 style={{fontSize:'clamp(44px,5.2vw,76px)',fontWeight:700,lineHeight:1.05,letterSpacing:'-0.02em',margin:'0 0 20px',maxWidth:960}}>Your customers are waiting.<br/><span style={{color:'#A8BCF5'}}>They shouldn't have to.</span></h1>
        <p style={{fontSize:20,lineHeight:1.55,color:'rgba(255,255,255,.82)',maxWidth:680,margin:'0 0 36px'}}>Acefone handles routine calls 24/7 — cutting cost per call by up to 70% and resolving issues in seconds, not minutes. One platform. Voice, WhatsApp, chat, video.</p>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          <button style={{padding:'14px 26px',borderRadius:12,border:'none',background:'#fff',color:'#1338A4',fontSize:16,fontWeight:600,cursor:'pointer'}}>Book a Demo →</button>
          <button style={{padding:'14px 26px',borderRadius:12,border:'1.5px solid rgba(255,255,255,.35)',background:'transparent',color:'#fff',fontSize:16,fontWeight:600,cursor:'pointer'}}>Calculate Your Savings</button>
        </div>
        <div style={{marginTop:64,display:'flex',gap:48,flexWrap:'wrap'}}>
          {[['5,000+','Businesses'],['150+','Countries'],['0.05s','Voice latency'],['ISO/IEC 27001','Certified']].map(([a,b])=>(
            <div key={b}><div style={{fontSize:32,fontWeight:700,letterSpacing:'-.02em'}}>{a}</div><div style={{fontSize:13,color:'rgba(255,255,255,.7)'}}>{b}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientStrip() {
  const clients = ["Michelin","MakeMyTrip","Cipla","BCG","Cars24","Uber","Godrej","Honda","Jaguar","SAP"];
  return (
    <section style={{padding:'64px 32px',background:'#F7F8FB'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',fontSize:13,fontWeight:600,color:'#6E7690',letterSpacing:'.04em',marginBottom:28}}>CLOUD COMMUNICATIONS TRUSTED BY LEADING BRANDS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:32,alignItems:'center'}}>
          {clients.map(c => (
            <div key={c} style={{height:44,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Poppins',fontWeight:700,fontSize:18,color:'#9BA3B8',letterSpacing:'-.02em',filter:'grayscale(1)',opacity:.85}}>{c}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsTabs() {
  const products = [
    {name:"Interactions Hub", copy:"Interact with your customers through multichannel cloud communications and deliver a wholesome experience from a single platform.", bullets:["High quality inbound and outbound voice calls for every business operation.","WhatsApp messaging integration to foster personalized conversations.","Face-to-face interactions over video meetings for authentic communication."]},
    {name:"Contact Center Studio", copy:"Power packed cloud-based dialers designed to streamline customer interactions.", bullets:["Automated dialers for addressing outbound calling at larger scale.","Smart call routing for high call volumes without sacrificing service quality.","Real-time dashboards — catch queue issues before they escalate."]},
    {name:"API Connect", copy:"Embed voice, SMS and 2FA into your application with a single integration.", bullets:["Programmable voice APIs with sub-second latency.","Number masking for privacy-first customer communication.","SDKs and webhooks developers actually use."]},
    {name:"Campaigns", copy:"Provide an efficient and wide-reaching communication tool to engage your audience across multiple channels.", bullets:["Empower marketing teams to maximize ROI and achieve strategic goals.","Deliver consistent and impactful messaging across platforms.","Audience segmentation, real-time analytics and more."]}
  ];
  const [i, setI] = useState(0);
  const p = products[i];
  return (
    <section style={{padding:'96px 32px',background:'#fff'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'#1844C9',marginBottom:12}}>The AceX suite</div>
        <h2 style={{fontSize:'clamp(30px,3.6vw,48px)',fontWeight:600,color:'#051441',margin:'0 0 36px',letterSpacing:'-0.01em',maxWidth:720}}>Simplifying communication with AceX essentials</h2>
        <div style={{display:'flex',gap:8,marginBottom:36,flexWrap:'wrap',borderBottom:'1px solid #EEF0F5'}}>
          {products.map((pr, idx) => (
            <button key={pr.name} onClick={()=>setI(idx)} style={{padding:'14px 22px',border:'none',background:'transparent',fontFamily:'Poppins',fontSize:15,fontWeight:idx===i?600:500,color:idx===i?'#1338A4':'#4D5570',cursor:'pointer',borderBottom:idx===i?'2.5px solid #1844C9':'2.5px solid transparent',marginBottom:-1}}>{pr.name}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.1fr',gap:64,alignItems:'center'}}>
          <div>
            <h3 style={{fontSize:28,fontWeight:600,color:'#051441',margin:'0 0 14px'}}>{p.name}</h3>
            <p style={{fontSize:17,lineHeight:1.6,color:'#4D5570',margin:'0 0 22px'}}>{p.copy}</p>
            <ul style={{listStyle:'none',padding:0,margin:'0 0 28px'}}>
              {p.bullets.map(b => <li key={b} style={{display:'flex',gap:12,alignItems:'flex-start',fontSize:15,lineHeight:1.55,color:'#051441',marginBottom:10}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00894A" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,marginTop:3}}><path d="M20 6 9 17l-5-5"/></svg>{b}</li>)}
            </ul>
            <a href="#" style={{color:'#1338A4',fontWeight:600,fontSize:15,textDecoration:'none'}}>Explore {p.name} →</a>
          </div>
          <div style={{aspectRatio:'4/3',borderRadius:20,background:'linear-gradient(135deg,#EEF3FE,#D6E0FB)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 28px 60px rgba(5,20,65,.18)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:24,background:'#fff',borderRadius:12,padding:20,display:'flex',flexDirection:'column',gap:10,boxShadow:'0 6px 16px rgba(5,20,65,.08)'}}>
              <div style={{display:'flex',gap:6}}>{[0,1,2].map(x=><div key={x} style={{width:10,height:10,borderRadius:999,background:'#EEF0F5'}}/>)}</div>
              <div style={{height:8,background:'#EEF0F5',borderRadius:999,width:'60%'}}/>
              <div style={{flex:1,borderRadius:8,background:'#F7F8FB',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:8}}>
                <div style={{background:'#fff',borderRadius:6,padding:'8px',fontSize:10,color:'#4D5570'}}><div style={{color:'#1844C9',fontWeight:700,fontSize:20}}>128</div>Live calls</div>
                <div style={{background:'#fff',borderRadius:6,padding:'8px',fontSize:10,color:'#4D5570'}}><div style={{color:'#009C55',fontWeight:700,fontSize:20}}>94%</div>FCR</div>
                <div style={{gridColumn:'span 2',background:'#fff',borderRadius:6,padding:'8px',fontSize:10,color:'#4D5570'}}>Queue · {p.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MidCta() {
  return (
    <section style={{padding:'64px 32px',background:'linear-gradient(135deg,#1A4ADB,#1338A4)',color:'#fff',position:'relative',overflow:'hidden'}}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1.3fr auto',gap:40,alignItems:'center'}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'#A8BCF5',marginBottom:10}}>Beginning a new era</div>
          <h2 style={{fontSize:36,fontWeight:600,margin:'0 0 8px',letterSpacing:'-0.01em'}}>Most contact centers don't have a people problem.</h2>
          <p style={{fontSize:18,color:'rgba(255,255,255,.82)',margin:0}}>They have a system problem. When routing is intelligent, tier-1 queries are automated, and agents see the full customer picture — the team performs.</p>
        </div>
        <button style={{padding:'16px 28px',borderRadius:12,border:'none',background:'#fff',color:'#1338A4',fontSize:16,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>Talk to an Expert →</button>
      </div>
    </section>
  );
}

function Industries() {
  const items = [
    ["Professional","Cloud solutions built for professionals","#1A4ADB"],
    ["Education","Better learning, powered by the cloud","#00894A"],
    ["Finance","Communication you can bank upon","#1338A4"],
    ["Retail","Let's talk shop","#2454E5"]
  ];
  return (
    <section style={{padding:'96px 32px',background:'#F7F8FB'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'#1844C9',marginBottom:10}}>Industries we serve</div>
        <h2 style={{fontSize:38,fontWeight:600,color:'#051441',margin:'0 0 40px',letterSpacing:'-0.01em'}}>Solutions for every business, every scenario.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          {items.map(([name,copy,color])=>(
            <div key={name} style={{borderRadius:16,overflow:'hidden',background:'#fff',boxShadow:'0 6px 16px rgba(5,20,65,.08)'}}>
              <div style={{height:160,background:`linear-gradient(135deg,${color},#051441)`,position:'relative'}}>
                <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.1) 1px,transparent 1.5px)',backgroundSize:'18px 18px'}}/>
              </div>
              <div style={{padding:20}}>
                <div style={{fontSize:18,fontWeight:600,color:'#051441',marginBottom:6}}>{name}</div>
                <div style={{fontSize:14,color:'#4D5570',lineHeight:1.5}}>{copy}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ["Solutions",["Call Center Software","Click to Call","WhatsApp Business Calling","Auto Dialer","Business Phone System","AI Voice Bot"]],
    ["Industries",["Small Business","Enterprise","Healthcare","Retail","Travel"]],
    ["Company",["About Us","Why Acefone","Blog","Case Studies","Careers","Become a partner"]],
    ["Integrations",["Zoho","Salesforce","HubSpot","Dynamics 365","Zendesk","Freshdesk"]]
  ];
  return (
    <footer style={{background:'#051441',color:'rgba(255,255,255,.8)',padding:'80px 32px 32px'}}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1.2fr repeat(4,1fr)',gap:48}}>
        <div>
          <img src="../../assets/logo-white.svg" alt="Acefone" style={{height:40,marginBottom:16}}/>
          <div style={{fontSize:14,lineHeight:1.6,color:'rgba(255,255,255,.7)',marginBottom:20}}>Cloud communications for teams who can't afford a dropped call. 2.5B engagements handled annually.</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.6)'}}>contact@acefone.com<br/>1800-121-7777</div>
        </div>
        {cols.map(([title, links])=>(
          <div key={title}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:16,letterSpacing:'.04em',textTransform:'uppercase'}}>{title}</div>
            {links.map(l => <a key={l} href="#" style={{display:'block',fontSize:14,color:'rgba(255,255,255,.7)',textDecoration:'none',marginBottom:10}}>{l}</a>)}
          </div>
        ))}
      </div>
      <div style={{maxWidth:1200,margin:'48px auto 0',paddingTop:24,borderTop:'1px solid rgba(255,255,255,.12)',fontSize:12,color:'rgba(255,255,255,.5)',display:'flex',justifyContent:'space-between'}}>
        <div>© 2026 Acefone · All rights reserved</div>
        <div style={{display:'flex',gap:20}}><a href="#" style={{color:'inherit',textDecoration:'none'}}>Privacy</a><a href="#" style={{color:'inherit',textDecoration:'none'}}>Cookies</a><a href="#" style={{color:'inherit',textDecoration:'none'}}>T&amp;C</a></div>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Hero, ClientStrip, ProductsTabs, MidCta, Industries, Footer });
