const SUPABASE_URL="https://dprulohylwgzmetgrywj.supabase.co";
const SUPABASE_KEY="sb_publishable_gNWkc787SxA7U76No3A4kg_XHP0x2j4";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const date=v=>v?new Date(v).toLocaleDateString("en-NG",{year:"numeric",month:"short",day:"numeric"}):"";
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let people=[],posts=[],categories=[];
async function loadLiveNews(){
 const grid=$("#liveNewsGrid"),status=$("#liveNewsStatus");
 try{
  const items=(await fetchLiveFeedItems()).sort((a,b)=>new Date(b.pubDate||0)-new Date(a.pubDate||0)).slice(0,30);
  if(!items.length)throw new Error("No live headlines");
  grid.innerHTML=items.map(item=>{
   const img=item.thumbnail||item.enclosure?.link||item.enclosure?.url||item.image;
   return '<article class="live-news-card">'+(img?'<img class="live-news-img" src="'+esc(img)+'" alt="'+esc(item.title||"News image")+'" loading="lazy">':'<div class="live-news-img image-fallback" role="img" aria-label="'+esc(item.title||"News story")+'"><span>NAIJA NEWSPAPER</span><small>'+esc(item.source)+'</small></div>')+'<div class="live-news-card-body"><div class="live-source">'+esc(item.source)+'</div><h3><a href="'+esc(item.link)+'" target="_blank" rel="noopener noreferrer nofollow">'+esc(item.title)+'</a></h3><div class="live-time">'+esc(item.pubDate?new Date(item.pubDate).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest")+'</div></div></article>';
  }).join("");
  status.textContent="Updated "+new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});
 }catch(e){
  console.warn("Live news feeds unavailable",e);
  grid.innerHTML='<div class="empty">Live feeds are temporarily unavailable. Published Naija Newspaper stories remain available above.</div>';
  status.textContent="Feed unavailable";
 }}
load();
loadLiveNews();
setInterval(loadLiveNews,10*60*1000);
