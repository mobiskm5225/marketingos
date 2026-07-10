const { useState } = React;

/* ---------------- icons (lucide-style strokes) ---------------- */
const I = (d, w = 18, extra = {}) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...extra}>{d}</svg>
);
const Ico = {
  inbox:   I(<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>),
  voice:   I(<><path d="M3 10v4"/><path d="M7 6v12"/><path d="M11 3v18"/><path d="M15 7v10"/><path d="M19 10v4"/></>),
  flow:    I(<><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><path d="M9 6h3a3 3 0 0 1 3 3v9"/></>),
  notes:   I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h4"/></>),
  help:    I(<><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>),
  bell:    I(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),
  chev:    I(<path d="m6 9 6 6 6-6"/>, 16),
  plus:    I(<><path d="M12 5v14"/><path d="M5 12h14"/></>, 16),
  dots:    I(<><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/></>, 16),
  search:  I(<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>, 16),
  filter:  I(<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>, 16),
  grid:    I(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>, 18),
  user:    I(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, 16),
  phoneIn: I(<><polyline points="16 2 16 8 22 8"/><line x1="22" y1="2" x2="16" y2="8"/><path d="M22 16.92V20a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2 4.18 2 2 0 0 1 4 2h3.08a2 2 0 0 1 2 1.72 13 13 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 13 13 0 0 0 2.81.7 2 2 0 0 1 1.72 2z"/></>, 16),
  chat:    I(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>, 16),
  close:   I(<><path d="M18 6 6 18"/><path d="M6 6l12 12"/></>, 16),
  edit:    I(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>, 14),
  globe:   I(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>, 14),
  phone:   I(<path d="M22 16.92V20a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2 4.18 2 2 0 0 1 4 2h3.08a2 2 0 0 1 2 1.72 13 13 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 13 13 0 0 0 2.81.7 2 2 0 0 1 1.72 2z"/>, 14),
  mail:    I(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>, 14),
  monitor: I(<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>, 14),
  chrome:  I(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></>, 14),
  clock:   I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 14),
  smile:   I(<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>, 16),
  paperclip: I(<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 17.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>, 16),
  zap:     I(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>, 14),
  send:    I(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>, 16),
  mic:     I(<><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v4"/></>, 16),
  check:   I(<polyline points="20 6 9 17 4 12"/>, 14),
  cornerUpLeft: I(<><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></>, 14),
  triangle: I(<path d="M4.93 19h14.14a2 2 0 0 0 1.73-3L13.73 4.5a2 2 0 0 0-3.46 0L3.2 16a2 2 0 0 0 1.73 3z"/>, 12),
};

/* channel glyphs (brand colors, small) */
const Ch = {
  whatsapp: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.3.2-.6.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.3 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>),
  gmail:    (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" fill="#fff" stroke="#E0E0E0"/><path d="M2 7l10 7 10-7v-1c0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1z" fill="#EA4335"/><path d="M2 7v10c0 1.1.9 2 2 2h2V9.2z" fill="#4285F4"/><path d="M22 7v10c0 1.1-.9 2-2 2h-2V9.2z" fill="#34A853"/><path d="M6 9.2 12 14l6-4.8V19H6z" fill="#FBBC04"/></svg>),
  insta:    (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F58529"/><stop offset="50%" stopColor="#DD2A7B"/><stop offset="100%" stopColor="#8134AF"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig)"/><rect x="6" y="6" width="12" height="12" rx="4" fill="none" stroke="#fff" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.6"/><circle cx="17" cy="7" r=".9" fill="#fff"/></svg>),
  fb:       (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.6a23 23 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3v2.1H7.4V14h2.7v8z" fill="#fff"/></svg>),
  msgr:     (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><defs><radialGradient id="mg" cx="30%" cy="100%" r="100%"><stop offset="0%" stopColor="#0078FF"/><stop offset="60%" stopColor="#A033FF"/><stop offset="100%" stopColor="#FF5C8D"/></radialGradient></defs><circle cx="12" cy="12" r="12" fill="url(#mg)"/><path d="M12 5C7.8 5 4.5 8 4.5 12c0 2.1.9 3.9 2.5 5.2V20l2.4-1.3c.8.2 1.7.4 2.6.4 4.2 0 7.5-3 7.5-7s-3.3-7-7.5-7zm.8 9.5-2-2.1-3.8 2.1 4.2-4.5 2 2.1 3.8-2.1z" fill="#fff"/></svg>),
  slack:    (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><rect x="10" y="3" width="4" height="12" rx="2" fill="#36C5F0"/><rect x="10" y="9" width="12" height="4" rx="2" fill="#2EB67D"/><rect x="3" y="9" width="8" height="4" rx="2" fill="#ECB22E"/><rect x="9" y="3" width="4" height="8" rx="2" fill="#E01E5A"/></svg>),
  web:      (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#6E7690"/><path d="M12 1v22M1 12h22M12 1a15 15 0 0 1 0 22M12 1a15 15 0 0 0 0 22" fill="none" stroke="#fff" strokeWidth="1.5"/></svg>),
};

/* ---------------- Acefone logo mark ---------------- */
function AceXMark() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <svg width="22" height="22" viewBox="0 0 32 32">
        <path d="M10 6l-7 16h4l1.4-3.5h7.2L17 22h4L14 6z" fill="#083DDE"/>
        <path d="M10 15l2-5 2 5z" fill="#fff"/>
        <path d="M22 13l3 4-3 4h3.5l1.5-2 1.5 2H32l-3-4 3-4h-3.5L27 15l-1.5-2z" fill="#00AB40"/>
      </svg>
      <div style={{fontWeight:700,fontSize:15,color:'#051441',letterSpacing:'-.01em'}}>Ace<span style={{color:'#00AB40'}}>X</span></div>
    </div>
  );
}

/* ---------------- Top header ---------------- */
function Header() {
  return (
    <header style={{height:56,background:'#fff',borderBottom:'1px solid #EEF0F5',display:'flex',alignItems:'center',padding:'0 16px',gap:16,flexShrink:0}}>
      <button style={{width:32,height:32,display:'grid',placeItems:'center',border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',borderRadius:6}}>{Ico.grid}</button>
      <AceXMark/>
      <div style={{width:1,height:22,background:'#EEF0F5',margin:'0 4px'}}/>
      <div style={{fontSize:14,fontWeight:500,color:'#051441'}}>Interactions Hub</div>
      <div style={{flex:1}}/>
      <button style={{width:34,height:34,display:'grid',placeItems:'center',border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',borderRadius:999}}>{Ico.help}</button>
      <button style={{width:34,height:34,display:'grid',placeItems:'center',border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',borderRadius:999,position:'relative'}}>
        {Ico.bell}
        <span style={{position:'absolute',top:6,right:7,width:7,height:7,borderRadius:999,background:'#E5484D',border:'2px solid #fff'}}/>
      </button>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 8px 4px 12px',borderRadius:999}}>
        <div style={{textAlign:'right',lineHeight:1.2}}>
          <div style={{fontSize:12,fontWeight:600,color:'#051441'}}>Olivia Wilson</div>
          <div style={{fontSize:10,color:'#6E7690',fontFamily:'var(--ace-font-mono)'}}>CW1722</div>
        </div>
        <div style={{width:34,height:34,borderRadius:999,background:'linear-gradient(135deg,#F5B27A,#E08A4E)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:12,border:'2px solid #fff',boxShadow:'0 0 0 1px #EEF0F5'}}>OW</div>
        <span style={{color:'#6E7690'}}>{Ico.chev}</span>
      </div>
    </header>
  );
}

/* ---------------- Left nav rail ---------------- */
function Rail() {
  const items = [
    {k:'inbox', label:'Inbox', active:true},
    {k:'voice', label:'Voice'},
    {k:'flow', label:'Flow'},
    {k:'notes', label:'Notes'},
  ];
  return (
    <nav style={{width:64,background:'#fff',borderRight:'1px solid #EEF0F5',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:4,flexShrink:0}}>
      {items.map(it=>(
        <button key={it.k} style={{width:48,height:52,border:'none',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,cursor:'pointer',color:it.active?'#083DDE':'#6E7690',borderRadius:8,position:'relative'}}>
          {it.active && <span style={{position:'absolute',left:-1,top:10,bottom:10,width:3,borderRadius:'0 3px 3px 0',background:'#083DDE'}}/>}
          {Ico[it.k]}
          <span style={{fontSize:9.5,fontWeight:500,letterSpacing:'.01em'}}>{it.label.slice(0,5) + (it.label.length>5?'.':'')}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Inbox list ---------------- */
function Inbox({sel,onSel}){
  const [tab, setTab] = useState('active');
  const tabs = [{k:'active',n:'Active'},{k:'queue',n:'Queue'},{k:'internal',n:'Internal'},{k:'consult',n:'Consult'},{k:'all',n:'All'}];
  const rows = [
    {id:'jr', name:'Jessica Reed',   snippet:'Hi there! Let\'s solve this together.', time:'11:20 AM', badge:'Internal', ch:'whatsapp', bold:true, initials:'JR', av:'JR', online:true},
    {id:'dm', name:'Daniel Miller',  snippet:'Welcome! Let\'s get started.',           time:'11:20 AM', ch:'insta',    closed:true,  av:'DM', online:true},
    {id:'ow', name:'Olivia Wilson',  snippet:'Meeting with new Investors',             time:'11:20 AM', badge:'New',   ch:'gmail',   sub:'+2 Hello Smartflo team, please let me kno…', av:'OW'},
    {id:'mj', name:'Michael Johnson',snippet:'Hello! Ready when you are.',             time:'11:20 AM', ch:'insta',    av:'MJ', online:true},
    {id:'sw', name:'Sarah Wilson',   snippet:'You: @sam Can you send over that ship…',time:'11:20 AM', ch:'whatsapp', av:'SW', online:true},
    {id:'cb', name:'Christopher Brown',snippet:'What do you need help with?',          time:'11:20 AM', ch:'slack',    closed:true, av:'CT', avBg:'#F0E6FF', avFg:'#6B3FA0'},
    {id:'la', name:'Laura Anderson', snippet:'You: @sam Can you send over that ship…',time:'11:20 AM', ch:'whatsapp', av:'LA', online:true},
    {id:'ab', name:'Aaron Baker',    snippet:'Hi there! How can I help?',              time:'11:20 AM', ch:'fb',       av:'AB', online:true},
  ];
  const pill = (n,k) => {
    const active = tab===k;
    return (
      <button key={k} onClick={()=>setTab(k)} style={{padding:'4px 12px',borderRadius:999,border:'none',fontFamily:'inherit',fontSize:11.5,fontWeight:500,cursor:'pointer',background:active?'#EEF3FE':'transparent',color:active?'#083DDE':'#6E7690'}}>{n}</button>
    );
  };
  return (
    <section style={{width:300,background:'#fff',borderRight:'1px solid #EEF0F5',display:'flex',flexDirection:'column',flexShrink:0}}>
      {/* header */}
      <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontSize:17,fontWeight:600,color:'#051441'}}>Inbox</div>
        <div style={{flex:1}}/>
        <button style={{width:28,height:28,borderRadius:8,border:'1px solid #EEF0F5',background:'#fff',color:'#083DDE',cursor:'pointer',display:'grid',placeItems:'center'}}>{Ico.plus}</button>
        <button style={{width:28,height:28,borderRadius:8,border:'1px solid #EEF0F5',background:'#fff',color:'#6E7690',cursor:'pointer',display:'grid',placeItems:'center'}}>{Ico.dots}</button>
      </div>
      {/* search */}
      <div style={{padding:'0 16px 10px',position:'relative'}}>
        <span style={{position:'absolute',left:28,top:8,color:'#9BA3B8'}}>{Ico.search}</span>
        <input placeholder="Search by agent, department" style={{width:'100%',padding:'8px 34px 8px 34px',borderRadius:8,border:'1px solid #EEF0F5',background:'#F7F8FB',fontFamily:'inherit',fontSize:12,color:'#051441',outline:'none',boxSizing:'border-box'}}/>
        <span style={{position:'absolute',right:24,top:8,color:'#9BA3B8'}}>{Ico.filter}</span>
      </div>
      {/* tabs */}
      <div style={{padding:'0 12px 10px',display:'flex',gap:2,borderBottom:'1px solid #F3F5FA'}}>
        {tabs.map(t=>pill(t.n,t.k))}
      </div>
      {/* rows */}
      <div style={{flex:1,overflow:'auto'}}>
        {rows.map(r=>{
          const active = sel===r.id;
          return (
            <div key={r.id} onClick={()=>onSel(r.id)} style={{padding:'12px 16px',borderBottom:'1px solid #F7F8FB',cursor:'pointer',background:active?'#EEF3FE':'transparent',display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{width:36,height:36,borderRadius:999,background:r.avBg||'#E6F3FF',color:r.avFg||'#0A5EC4',display:'grid',placeItems:'center',fontWeight:600,fontSize:12}}>{r.av}</div>
                {r.online && <span style={{position:'absolute',bottom:0,left:25,width:10,height:10,borderRadius:999,background:'#00AB40',border:'2px solid #fff'}}/>}
                <span style={{position:'absolute',bottom:-2,right:-4}}>{Ch[r.ch](14)}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:'#051441',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
                  {r.badge==='Internal' && <span style={{fontSize:9,fontWeight:600,background:'#FFEAD5',color:'#C2570B',padding:'1px 6px',borderRadius:4}}>Internal</span>}
                  {r.badge==='New' && <span style={{fontSize:9,fontWeight:600,background:'#E6F7ED',color:'#00894A',padding:'1px 6px',borderRadius:4}}>New</span>}
                  <div style={{fontSize:10,color:'#9BA3B8',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>{r.time}</div>
                </div>
                <div style={{fontSize:11.5,color:r.bold?'#051441':'#6E7690',fontWeight:r.bold?500:400,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.snippet}</div>
                {r.sub && <div style={{fontSize:10.5,color:'#9BA3B8',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.sub}</div>}
                {r.closed && <div style={{marginTop:4}}><span style={{fontSize:9,fontWeight:600,background:'#FDECEE',color:'#B42318',padding:'1px 6px',borderRadius:4}}>Closed</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Conversation column ---------------- */
function Conversation(){
  return (
    <section style={{flex:1,display:'flex',flexDirection:'column',background:'#fff',minWidth:0}}>
      {/* conv header */}
      <div style={{padding:'10px 20px',borderBottom:'1px solid #EEF0F5',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:32,height:32,borderRadius:999,background:'#E6F3FF',color:'#0A5EC4',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>UN</div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'#051441',fontFamily:'var(--ace-font-mono)',letterSpacing:'.02em'}}>88 5959 8181</div>
          <div style={{fontSize:11,color:'#6E7690',display:'flex',alignItems:'center',gap:4}}>Typing<span style={{display:'inline-flex',gap:2,marginLeft:2}}>{[0,1,2].map(i=><span key={i} style={{width:3,height:3,borderRadius:999,background:'#6E7690',animation:`b 1s ${i*.15}s infinite`}}/>)}</span></div>
        </div>
        <div style={{flex:1}}/>
        {/* participant avatars */}
        <div style={{display:'flex'}}>
          {['#F5B27A','#9BA3B8','#083DDE'].map((bg,i)=>(
            <div key={i} style={{width:26,height:26,borderRadius:999,background:bg,color:'#fff',display:'grid',placeItems:'center',fontWeight:600,fontSize:10,border:'2px solid #fff',marginLeft:i?-8:0}}>{['MJ','JR','AP'][i]}</div>
          ))}
          <button style={{width:26,height:26,borderRadius:999,background:'#EEF3FE',color:'#083DDE',border:'2px solid #fff',marginLeft:-8,cursor:'pointer',display:'grid',placeItems:'center',fontSize:11,fontWeight:700}}>+</button>
        </div>
        {[Ico.phoneIn, Ico.chat, Ico.dots].map((ic,i)=>(
          <button key={i} style={{width:30,height:30,borderRadius:8,border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',display:'grid',placeItems:'center'}}>{ic}</button>
        ))}
        <button style={{width:30,height:30,borderRadius:8,border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',display:'grid',placeItems:'center'}}>{Ico.close}</button>
      </div>

      {/* transcript */}
      <div style={{flex:1,overflow:'auto',padding:'18px 24px',display:'flex',flexDirection:'column',gap:14,background:'#fff'}}>
        {/* inbound bubble */}
        <Msg who="them" name="Michael Joh." av="MJ" avBg="#F5B27A" meta="Yesterday, 2:49 PM" star>
          Hi, 👋 I'm interested in toll-free numbers. Can you help?
        </Msg>

        {/* outbound rich card */}
        <Msg who="me" name="You" meta="Yesterday, 2:49 PM" read>
          <span style={{fontWeight:600}}>Hi <span style={{color:'#083DDE'}}>@Jessica Reed</span>!</span> Absolutely!
          <br/>Toll-free numbers allow your customers to call you for free and come with features like IVR and call analytics.
          <br/>Would you like to know more?
        </Msg>

        {/* inbound with reactions */}
        <Msg who="them" name="Michael Joh." av="MJ" avBg="#F5B27A" meta="" reactions={['👍','❤️','😊','😮']}>
          Sounds good. Can it work with messaging apps?
        </Msg>

        {/* system call record */}
        <div style={{alignSelf:'flex-end',maxWidth:'70%',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
          <div style={{fontSize:10.5,color:'#9BA3B8',display:'flex',alignItems:'center',gap:5}}>
            <span style={{color:'#9BA3B8'}}>{Ico.clock}</span>
            Yesterday, 2:49 PM &nbsp;·&nbsp; <span style={{color:'#6E7690',fontWeight:600}}>You</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#F7F8FB',border:'1px solid #EEF0F5',borderRadius:'12px 12px 4px 12px'}}>
            <div style={{width:30,height:30,borderRadius:999,background:'#083DDE',color:'#fff',display:'grid',placeItems:'center'}}>{Ico.phone}</div>
            <div>
              <div style={{fontSize:12.5,fontWeight:600,color:'#051441'}}>Voice Call <span style={{color:'#6E7690',fontWeight:400}}>(Outbound)</span></div>
              <div style={{fontSize:11,color:'#6E7690'}}>2 mins · Answered</div>
            </div>
          </div>
        </div>
      </div>

      {/* composer */}
      <Composer/>
    </section>
  );
}

function Msg({who, name, av, avBg='#E6F3FF', meta, star, read, reactions, children}){
  const mine = who==='me';
  return (
    <div style={{display:'flex',gap:10,alignItems:'flex-start',alignSelf:mine?'flex-end':'flex-start',maxWidth:'72%',flexDirection:mine?'row-reverse':'row'}}>
      {!mine && <div style={{width:30,height:30,borderRadius:999,background:avBg,color:'#0A5EC4',display:'grid',placeItems:'center',fontWeight:700,fontSize:10,flexShrink:0}}>{av}</div>}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:mine?'flex-end':'flex-start',gap:4,minWidth:0}}>
        <div style={{fontSize:11,color:'#6E7690',display:'flex',alignItems:'center',gap:6}}>
          {!mine && <span style={{fontWeight:600,color:'#051441'}}>{name}</span>}
          {!mine && star && <span style={{color:'#9BA3B8'}}>{Ico.smile}</span>}
          {!mine && meta && <><span style={{color:'#C3C9D8'}}>{Ico.clock}</span><span>{meta}</span></>}
          {mine && read && <><span style={{color:'#00AB40'}}>{Ico.check}</span><span style={{color:'#C3C9D8'}}>{Ico.clock}</span><span>{meta}</span><span style={{fontWeight:600,color:'#051441'}}>{name}</span></>}
        </div>
        <div style={{background:mine?'#EEF3FE':'#F7F8FB',border:mine?'1px solid #D6E0FB':'1px solid #EEF0F5',borderRadius:mine?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'10px 14px',fontSize:12.5,color:'#051441',lineHeight:1.55}}>
          {children}
        </div>
        {reactions && (
          <div style={{display:'flex',gap:4,padding:'3px 8px',background:'#fff',border:'1px solid #EEF0F5',borderRadius:999,fontSize:11}}>
            {reactions.map((r,i)=><span key={i}>{r}</span>)}
            <span style={{color:'#6E7690',paddingLeft:2,fontSize:10}}>⟳</span>
            <span style={{color:'#6E7690',paddingLeft:2,fontSize:10}}>⋯</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Composer(){
  const fmt = ['B','I','U','S'];
  return (
    <div style={{borderTop:'1px solid #EEF0F5',padding:'10px 20px 14px',display:'flex',flexDirection:'column',gap:8}}>
      {/* tabs */}
      <div style={{display:'flex',alignItems:'center',gap:18,fontSize:12.5,fontWeight:500}}>
        <div style={{color:'#083DDE',paddingBottom:6,borderBottom:'2px solid #083DDE',display:'flex',alignItems:'center',gap:6}}><span style={{color:'#083DDE'}}>{Ico.cornerUpLeft}</span>Reply</div>
        <div style={{color:'#6E7690',paddingBottom:6,display:'flex',alignItems:'center',gap:6}}>{Ico.edit}Notes</div>
        <div style={{flex:1}}/>
        <div style={{color:'#083DDE',fontWeight:600,display:'flex',alignItems:'center',gap:5}}>{Ico.zap}Gen AI</div>
        <div style={{color:'#6E7690',display:'flex',alignItems:'center',gap:5}}>{Ico.user}Consult</div>
      </div>

      {/* formatting row */}
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 0',borderBottom:'1px solid #F3F5FA',color:'#6E7690',fontSize:11.5}}>
        <select style={{border:'none',background:'transparent',fontFamily:'inherit',fontSize:11.5,color:'#051441',outline:'none'}}><option>14</option></select>
        <span style={{color:'#C3C9D8'}}>{Ico.chev}</span>
        <div style={{width:1,height:16,background:'#EEF0F5',margin:'0 4px'}}/>
        <span style={{fontFamily:'serif',fontSize:14,color:'#051441',padding:'0 4px'}}>T</span>
        <span style={{width:12,height:12,borderRadius:3,background:'#051441',marginLeft:2}}/>
        <span style={{color:'#C3C9D8'}}>{Ico.chev}</span>
        <div style={{width:1,height:16,background:'#EEF0F5',margin:'0 4px'}}/>
        {fmt.map(f=>(<span key={f} style={{width:22,height:22,display:'grid',placeItems:'center',fontWeight:f==='B'?700:500,fontStyle:f==='I'?'italic':'normal',textDecoration:f==='U'?'underline':f==='S'?'line-through':'none',color:'#051441',fontSize:12}}>{f}</span>))}
        <div style={{width:1,height:16,background:'#EEF0F5',margin:'0 4px'}}/>
        {/* align + list + link placeholders */}
        {[0,1,2,3].map(i=>(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E7690" strokeWidth="1.75"><line x1="3" y1="6" x2={17+i*1} y2="6"/><line x1="3" y1="12" x2={21-i} y2="12"/><line x1="3" y1="18" x2={15+i*2} y2="18"/></svg>))}
        <div style={{width:1,height:16,background:'#EEF0F5',margin:'0 4px'}}/>
        {[Ico.paperclip, Ico.chat].map((ic,i)=>(<span key={i} style={{padding:'0 2px'}}>{ic}</span>))}
      </div>

      {/* textarea */}
      <div style={{padding:'10px 2px',fontSize:12.5,color:'#9BA3B8'}}>Type a message…</div>

      {/* footer actions */}
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{display:'flex',gap:12,color:'#6E7690'}}>
          {Ico.mic}{Ico.smile}{Ico.chat}{Ico.paperclip}<span style={{color:'#083DDE'}}>{Ico.zap}</span>
        </div>
        <div style={{flex:1}}/>
        <button style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:'1px solid #EEF0F5',background:'#fff',fontFamily:'inherit',fontSize:12,color:'#051441',cursor:'pointer'}}>
          {Ch.whatsapp(13)} WhatsApp <span style={{color:'#9BA3B8'}}>{Ico.chev}</span>
        </button>
        <button style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:999,border:'none',background:'#083DDE',color:'#fff',fontFamily:'inherit',fontSize:12.5,fontWeight:600,cursor:'pointer'}}>
          Send <span style={{display:'grid',placeItems:'center'}}>{Ico.send}</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Contact panel (right) ---------------- */
function ContactPanel(){
  return (
    <aside style={{width:300,background:'#fff',borderLeft:'1px solid #EEF0F5',display:'flex',flexDirection:'column',flexShrink:0,overflow:'auto'}}>
      {/* tabs */}
      <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:4,borderBottom:'1px solid #EEF0F5'}}>
        <button style={{width:32,height:32,borderRadius:8,border:'none',background:'#EEF3FE',color:'#083DDE',display:'grid',placeItems:'center',cursor:'pointer',position:'relative'}}>
          {Ico.user}
          <span style={{position:'absolute',bottom:-6,left:6,right:6,height:2,background:'#083DDE',borderRadius:2}}/>
        </button>
        {[{c:'#FF8040',l:'A'},{c:'#EA4335',l:'M'},{c:'#2A75F3',l:'H'},{c:'#00AB40',l:'W'}].map((x,i)=>(
          <button key={i} style={{width:32,height:32,borderRadius:8,border:'none',background:'transparent',color:x.c,display:'grid',placeItems:'center',cursor:'pointer',fontSize:13,fontWeight:700}}>
            {i===0 && <span style={{color:'#FF8040'}}>{Ico.phone}</span>}
            {i===1 && Ch.gmail(16)}
            {i===2 && Ch.slack(16)}
            {i===3 && Ch.whatsapp(16)}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button style={{width:28,height:28,borderRadius:8,border:'none',background:'transparent',color:'#083DDE',cursor:'pointer',display:'grid',placeItems:'center',fontWeight:700}}>+</button>
        <button style={{width:28,height:28,borderRadius:8,border:'none',background:'transparent',color:'#6E7690',cursor:'pointer',display:'grid',placeItems:'center'}}>{Ico.close}</button>
      </div>

      {/* General Information */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid #EEF0F5'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,color:'#051441',flex:1}}>General Information</div>
          <span style={{color:'#6E7690'}}>{Ico.edit}</span>
          <span style={{color:'#6E7690'}}>{Ico.dots}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:999,background:'linear-gradient(135deg,#F5B27A,#E08A4E)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:12}}>OW</div>
          <div style={{lineHeight:1.25}}>
            <div style={{fontSize:12.5,fontWeight:600,color:'#051441'}}>Olivia Wilson</div>
            <div style={{fontSize:11,color:'#083DDE'}}>shakeel.ahamad@acefone.com</div>
          </div>
        </div>
        <InfoRow icon={Ico.chat} label="Acefone Chat Bot" link/>
        <InfoRow icon={Ico.globe} label="Web"/>
        <InfoRow icon={Ico.mail} label="shakeel.ahamad@acefone.com"/>
        <InfoRow icon={Ico.phone} label="+91 8859596181"/>
        <InfoRow icon={Ico.phone} label="106.197.219.253"/>
        <InfoRow icon={Ico.monitor} label="Mac OS 10.15.7"/>
        <InfoRow icon={Ico.chrome} label="Chrome 107.0.0.0"/>
        <div style={{display:'flex',justifyContent:'center',paddingTop:4}}><span style={{color:'#9BA3B8'}}>{Ico.chev}</span></div>
      </div>

      {/* Conversational Time */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid #EEF0F5'}}>
        <div style={{fontSize:13,fontWeight:600,color:'#051441',marginBottom:10}}>Conversational Time</div>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#051441'}}>
          <span style={{color:'#6E7690'}}>{Ico.clock}</span>
          <span style={{color:'#6E7690'}}>Total Conversation time :</span>
          <span style={{fontWeight:700,fontFamily:'var(--ace-font-mono)',marginLeft:'auto'}}>08:00</span>
        </div>
      </div>

      {/* Conversation tags */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid #EEF0F5'}}>
        <div style={{fontSize:13,fontWeight:600,color:'#051441',marginBottom:10}}>Conversation tags</div>
        <input placeholder="Search Tags" style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #EEF0F5',background:'#F7F8FB',fontFamily:'inherit',fontSize:11.5,color:'#051441',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
        <div style={{fontSize:11,color:'#6E7690',marginBottom:6}}>Suggested tags</div>
        <button style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,border:'1px dashed #D6E0FB',background:'#EEF3FE',color:'#083DDE',fontSize:11,fontWeight:500,cursor:'pointer'}}>
          <span>+</span> Cloud leads
        </button>
      </div>

      {/* Recipe variables */}
      <div style={{padding:'14px 16px 12px',flex:1}}>
        <div style={{display:'flex',gap:18,marginBottom:12,borderBottom:'1px solid #EEF0F5'}}>
          <div style={{fontSize:12,fontWeight:600,color:'#083DDE',paddingBottom:8,borderBottom:'2px solid #083DDE',marginBottom:-1}}>Recipe variables</div>
          <div style={{fontSize:12,fontWeight:500,color:'#6E7690',paddingBottom:8}}>Custom field</div>
        </div>
        <VarRow icon={Ico.user} label="Name" value="Shakeel Rajput"/>
        <VarRow icon={Ico.mail} label="Email" value="shakeel.ahamad@acefone.com" mono/>
      </div>
    </aside>
  );
}

function InfoRow({icon,label,link}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0',fontSize:11.5,color:link?'#083DDE':'#051441'}}>
      <span style={{color:'#6E7690'}}>{icon}</span>
      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    </div>
  );
}
function VarRow({icon,label,value,mono}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',fontSize:11.5}}>
      <span style={{color:'#6E7690'}}>{icon}</span>
      <span style={{color:'#6E7690',width:50}}>{label}</span>
      <span style={{color:'#051441',fontWeight:500,fontFamily:mono?'var(--ace-font-mono)':'inherit',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</span>
    </div>
  );
}

Object.assign(window, { Header, Rail, Inbox, Conversation, ContactPanel });
