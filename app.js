const SUPABASE_URL="https://dprulohylwgzmetgrywj.supabase.co";
const SUPABASE_KEY="sb_publishable_gNWkc787SxA7U76No3A4kg_XHP0x2j4";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const date=v=>v?new Date(v).toLocaleDateString("en-NG",{year:"numeric",month:"short",day:"numeric"}):"";
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let people=[],posts=[],categories=[];


function bindNavigation(){
 document.querySelectorAll('a[href^="#"]').forEach(link=>{
   link.addEventListener("click",e=>{
    const id=link.getAttribute("href").slice(1), el=document.getElementById(id);
    if(el){e.preventDefault();el.scrollIntoView({behavior:"smooth",block:"start"});history.replaceState(null,"","#"+id);}
   });
 });
}

async function load(){
  try{
    const [p,n,c]=await Promise.all([
      db.from("people_profiles").select("*").eq("is_published",true).order("display_name"),
      db.from("posts").select("*").eq("is_published",true).order("published_at",{ascending:false}).limit(30),
      db.from("post_categories").select("*").eq("is_active",true).order("sort_order")
    ]);
    if(p.error||n.error||c.error) throw p.error||n.error||c.error;
    people=p.data||[]; posts=n.data||[]; categories=c.data||[];
    await hydratePostImages(posts);
    renderHero(posts); renderPeople(people); renderPosts(posts); renderTrending(posts); renderBusinessLegends(); bindNavigation(); route();
  }catch(e){
    console.error(e);
    document.querySelectorAll(".loading").forEach(el=>el.outerHTML='<div class="empty">Content is temporarily unavailable. Please try again.</div>');
  }
}

function renderHero(items){
 const x=items[0]; if(!x)return;
 const card=document.querySelector(".lead-card"); if(!card)return;
 card.innerHTML=storyImage(x,"hero-story-img")+
 '<div class="story-meta">'+esc(x.content_type||"NEWS")+" · "+esc(date(x.published_at))+"</div>"+
 '<h1>'+esc(x.title||"Latest story")+"</h1>"+
 '<p>'+esc(x.excerpt||x.meta_description||"The latest story from Naija Newspaper.")+"</p>"+
 '<a class="read-link" href="#story/'+encodeURIComponent(x.slug||x.id)+'">Read full story →</a>";
}
function storyCard(x){
 return '<article class="story-card">'+storyImage(x,"story-img")+
 '<div class="story-body"><div class="story-meta">'+esc(x.content_type||"NEWS")+" · "+esc(date(x.published_at))+"</div><h3>"+esc(x.title||"Untitled story")+"</h3><p>"+esc(x.excerpt||x.meta_description||"Read the latest story from Naija Newspaper.")+'</p><a class="read-link" href="#story/'+encodeURIComponent(x.slug||x.id)+'">Read story →</a></div></article>';
}

function renderBusinessLegends(){
  const grid=$("#businessLegendsGrid"); if(!grid)return;
  const businessPosts=posts.filter(x=>String(x.content_type||"").toLowerCase().includes("business")||String(x.title||"").toLowerCase().match(/business|investment|investor|entrepreneur|executive|company|ceo|founder|economy|funding|industry/));
  const leaders=people.filter(x=>["entrepreneur","professional","public_figure"].includes(String(x.person_type||"").toLowerCase())||String(x.category||"").toLowerCase().includes("business")).slice(0,4);
  const cards=businessPosts.slice(0,4).map(storyCard).join("");
  const leaderCards=leaders.map(personCard).join("");
  grid.innerHTML=(cards||leaderCards)?(cards+leaderCards):'<div class="empty">Business Legends stories and profiles will appear here as the editorial desk publishes them.</div>';
}

function renderPosts(items){
  const html=items.length?items.map(storyCard).join(""):'<div class="empty">No published stories yet. Your editorial desk can publish the first story.</div>';
  $("#newsGrid").innerHTML=html; $("#allNewsGrid").innerHTML=html;
}
function personCard(x){
  return '<a class="person-card" href="#person/'+encodeURIComponent(x.slug)+'"><div class="person-photo">'+(x.profile_image_url?'<img src="'+esc(x.profile_image_url)+'" alt="'+esc(x.display_name)+'" loading="lazy">':'<div class="person-placeholder">NN</div>')+'</div><div class="person-card-body"><div class="story-meta">PEOPLE · '+esc(x.person_type||"PROFILE")+'</div><h3>'+esc(x.display_name)+'</h3><p>'+esc(x.headline||x.category||"Public profile")+'</p>'+(x.is_verified?'<span class="verified">✓ Verified by Naija Newspaper</span>':"")+'<span class="profile-arrow">View profile →</span></div></a>';
}
function renderPeople(items){
  const html=items.length?items.slice(0,12).map(personCard).join(""):'<div class="empty">No published profiles yet. The editorial desk is building the directory.</div>';
  $("#peopleGrid").innerHTML=html; $("#allPeopleGrid").innerHTML=items.map(personCard).join("")||html;
}
function renderTrending(items){
  $("#trendingList").innerHTML=items.slice(0,5).map((x,i)=>'<article><div class="story-meta">0'+(i+1)+'</div><h4><a href="#story/'+encodeURIComponent(x.slug||x.id)+'">'+esc(x.title||"Latest story")+'</a></h4></article>').join("")||"<p>No stories published yet.</p>";
}
function filterPeople(){
  const q=($("#peopleSearch").value||"").toLowerCase().trim(),t=$("#peopleType").value;
  renderPeople(people.filter(x=>(!q||[x.display_name,x.headline,x.category,x.person_type].join(" ").toLowerCase().includes(q))&&(!t||x.person_type===t)));
}
function contentHtml(raw){
  const safe=esc(raw||"");
  return safe.split(/\n{2,}/).map(p=>'<p>'+p.replace(/\n/g,"<br>")+'</p>').join("");
}
function setMeta(title,description,canonical,type,data){
  document.title=title;
  let desc=document.querySelector('meta[name="description"]'); if(!desc){desc=document.createElement("meta");desc.name="description";document.head.appendChild(desc)}
  desc.content=description||"Naija Newspaper — News, people, culture and stories.";
  let can=document.querySelector('link[rel="canonical"]'); if(can) can.href=canonical;
  document.querySelectorAll('script[data-dynamic-schema]').forEach(x=>x.remove());
  const s=document.createElement("script");s.type="application/ld+json";s.dataset.dynamicSchema="1";s.textContent=JSON.stringify({"@context":"https://schema.org","@type":type,...data});document.head.appendChild(s);
}
async function showStory(slug){
  const x=posts.find(p=>String(p.slug||p.id)===slug);
  $("#profile").classList.remove("hidden");
  if(!x){$("#profile").innerHTML='<div class="empty">Story not found.</div>';return;}
  let linked=[];
  if(x.id){const r=await db.from("post_people").select("person_id,relationship,people_profiles(*)").eq("post_id",x.id);linked=(r.data||[]).map(v=>v.people_profiles).filter(Boolean);}
  const canonical=location.href.split("#")[0]+"?story="+encodeURIComponent(x.slug||x.id);
  $("#profile").innerHTML='<article class="article-view"><div class="section-kicker">'+esc(x.content_type||"NEWS")+'</div><h1>'+esc(x.title||"Untitled story")+'</h1><div class="article-meta">Published '+esc(date(x.published_at))+(x.updated_at&&x.updated_at!==x.published_at?" · Updated "+esc(date(x.updated_at)):"")+(x.sponsored?' · Sponsored':'')+'</div>'+
    (x.featured_image_url?'<img class="article-hero" src="'+esc(x.featured_image_url)+'" alt="'+esc(x.title||"Story")+'">':"")+
    (x.excerpt?'<p class="article-dek">'+esc(x.excerpt)+'</p>':"")+
    '<div class="article-content">'+contentHtml(x.content||x.body||x.article_body||"")+'</div>'+
    (linked.length?'<section class="related-people"><h2>People in this story</h2><div class="people-grid">'+linked.map(personCard).join("")+'</div></section>':"")+
    '<p><a class="read-link" href="./">← Back to Naija Newspaper</a></p></article>';
  setMeta((x.title||"Story")+" — Naija Newspaper",x.meta_description||x.excerpt||"Naija Newspaper story",canonical,"NewsArticle",{headline:x.title,datePublished:x.published_at,dateModified:x.updated_at||x.published_at,url:canonical});
  window.scrollTo({top:document.querySelector("#profile").offsetTop-90,behavior:"smooth"});
}
async function showPerson(slug){
  const x=people.find(p=>p.slug===slug); $("#profile").classList.remove("hidden");
  if(!x){$("#profile").innerHTML='<div class="empty">Profile not found.</div>';return;}
  const r=await db.from("people_links").select("*").eq("person_id",x.id).order("sort_order"), links=r.data||[];
  const sr=await db.from("post_people").select("post_id,relationship,posts(*)").eq("person_id",x.id), stories=(sr.data||[]).map(v=>v.posts).filter(Boolean).slice(0,6);
  const canonical=location.href.split("#")[0]+"?person="+encodeURIComponent(x.slug), sameAs=Array.isArray(x.same_as)?x.same_as:[];
  const linksHtml=links.map(l=>'<a href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">'+esc(l.label||l.platform)+' →</a>').join("")||"<div class='empty'>No official links added yet.</div>";
  const sameAsLinks=sameAs.slice(0,8).map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a>').join("");
  const facts=[
    ["Profession",x.headline||x.person_type],
    ["Type",x.person_type],
    ["Category",x.category],
    ["Location",x.location],
    ["Country",x.country],
    ["Born",x.birth_date?date(x.birth_date):null],
    ["Website",x.official_website_url]
  ].filter(v=>v[1]);
  $("#profile").innerHTML='<div class="wiki-profile"><div class="wiki-main"><div class="profile-breadcrumb">PEOPLE / '+esc(x.person_type||"PROFILE")+' / '+esc(x.category||"REFERENCE")+'</div><h1 class="profile-name">'+esc(x.display_name)+'</h1><div class="profile-rule"></div><p class="profile-headline">'+esc(x.headline||"Public figure profile")+'</p>'+(x.is_verified?'<span class="verified large">✓ Verified by Naija Newspaper</span>':"")+
  '<section class="profile-section"><h2>Biography</h2><div class="bio">'+contentHtml(x.bio||x.short_bio||"This profile is being developed.")+'</div></section>'+
  '<section class="profile-section"><h2>Career and work</h2><p>Naija Newspaper maintains this reference profile to document publicly available information, career milestones, notable work and published coverage.</p></section>'+
  (stories.length?'<section class="profile-section"><h2>Naija Newspaper coverage</h2><div class="profile-story-list">'+stories.map(s=>'<a href="#story/'+encodeURIComponent(s.slug||s.id)+'"><span class="story-meta">'+esc(s.content_type||"STORY")+' · '+esc(date(s.published_at))+'</span><strong>'+esc(s.title)+'</strong></a>').join("")+'</div></section>':"")+
  '<section class="profile-section"><h2>Official links</h2><div class="link-grid">'+linksHtml+'</div></section>'+
  '<section class="profile-section"><h2>References and updates</h2><p>This is an editorial reference page, not a Wikipedia page and not a platform verification badge. Information is maintained through the Naija Newspaper editorial desk.</p><p><a class="read-link" href="#claim">Claim or request an update →</a></p></section></div>'+
  '<aside class="wiki-infobox"><div class="infobox-title">'+esc(x.display_name)+'</div><div class="infobox-photo">'+(x.profile_image_url?'<img src="'+esc(x.profile_image_url)+'" alt="'+esc(x.display_name)+'">':'<div class="person-placeholder large">NN</div>')+'</div><div class="infobox-caption">'+esc(x.headline||x.category||"People profile")+'</div><dl>'+facts.map(v=>'<div><dt>'+esc(v[0])+'</dt><dd>'+esc(v[1])+'</dd></div>').join("")+'</dl>'+(sameAsLinks?'<div class="infobox-links"><strong>External profiles</strong>'+sameAsLinks+'</div>':"")+'</aside></div>';
  setMeta((x.meta_title||x.display_name)+" — Naija Newspaper",x.meta_description||x.short_bio||x.headline||"People profile on Naija Newspaper",canonical,"Person",{name:x.display_name,description:x.bio||x.short_bio,image:x.profile_image_url,url:canonical,sameAs:sameAs});
  window.scrollTo({top:document.querySelector("#profile").offsetTop-90,behavior:"smooth"});
}
function route(){
  const h=location.hash;
  if(/^#story\//.test(h)){showStory(decodeURIComponent(h.slice(7)));return;}
  if(/^#person\//.test(h)){showPerson(decodeURIComponent(h.slice(8)));return;}
  $("#profile").classList.add("hidden");
  if(!h||h==="#home") setMeta("Naija Newspaper — Business Legends, News, People & Stories","Naija Newspaper is an independent Nigerian digital publication led by Business Legends, business leaders, entrepreneurs, people and major stories.","https://kharviefx-tech.github.io/naija-newspaper/","NewsMediaOrganization",{name:"Naija Newspaper",url:"https://kharviefx-tech.github.io/naija-newspaper/"});
}
$("#peopleSearch").addEventListener("input",filterPeople);
// Mobile menu controls are initialized safely after the page is parsed.
const menuButton=document.getElementById("menuBtn"), closeMenuButton=document.getElementById("closeMenu"), drawerBackdrop=document.getElementById("drawerBackdrop");
if(menuButton) menuButton.addEventListener("click",()=>setMenu(true));
if(closeMenuButton) closeMenuButton.addEventListener("click",()=>setMenu(false));
if(drawerBackdrop) drawerBackdrop.addEventListener("click",()=>setMenu(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});

$("#peopleType").addEventListener("change",filterPeople);
function setMenu(open){$("#menuDrawer").classList.toggle("open",open);$("#drawerBackdrop").classList.toggle("open",open);$("#menuDrawer").setAttribute("aria-hidden",String(!open));$("#drawerBackdrop").setAttribute("aria-hidden",String(!open));$("#menuBtn").setAttribute("aria-expanded",String(open));document.body.classList.toggle("drawer-open",open)}
document.querySelectorAll("#menuDrawer a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
$("#searchBtn").addEventListener("click",()=>$("#searchPanel").classList.add("open"));
$("#closeSearch").addEventListener("click",()=>$("#searchPanel").classList.remove("open"));
$("#globalSearch").addEventListener("input",e=>{const q=e.target.value.toLowerCase().trim();const out=[...posts.map(x=>({type:"story",item:x})),...people.map(x=>({type:"person",item:x}))].filter(v=>{const x=v.item;return [x.title,x.display_name,x.headline,x.category,x.person_type].join(" ").toLowerCase().includes(q)}).slice(0,10).map(v=>v.type==="story"?'<div class="result"><div class="story-meta">STORY · '+esc(date(v.item.published_at))+'</div><h3>'+esc(v.item.title)+'</h3><a class="read-link" href="#story/'+encodeURIComponent(v.item.slug||v.item.id)+'">Open →</a></div>':'<div class="result"><div class="story-meta">PEOPLE PROFILE</div><h3>'+esc(v.item.display_name)+'</h3><a class="read-link" href="#person/'+encodeURIComponent(v.item.slug)+'">Open →</a></div>').join("");$("#searchResults").innerHTML=q?out||'<div class="empty">No matching results.</div>':""});
window.addEventListener("hashchange",route);
$("#dateLine").textContent=new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("#year").textContent=new Date().getFullYear();
const LIVE_FEEDS=[
{name:"PUNCH",url:"https://rss.punchng.com/v1/category/latest_news"},
{name:"Premium Times",url:"https://www.premiumtimesng.com/feed"},
{name:"The Guardian Nigeria",url:"https://guardian.ng/feed/"},
{name:"The Nation",url:"https://thenationonlineng.net/feed/"},
{name:"Daily Post Nigeria",url:"https://dailypost.ng/feed"},
{name:"Legit.ng",url:"https://www.legit.ng/rss/all.rss"},
{name:"BBC News",url:"https://feeds.bbci.co.uk/news/world/africa/rss.xml"}];
async function loadLiveNews(){
 const grid=$("#liveNewsGrid"),status=$("#liveNewsStatus");
 try{
  const results=await Promise.all(LIVE_FEEDS.map(async source=>{
   const r=await fetch("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(source.url),{cache:"no-store"});
   if(!r.ok) throw new Error(source.name);
   const data=await r.json();
   return (data.items||[]).slice(0,5).map(item=>({...item,source:source.name}));
  }));
  const items=results.flat().sort((a,b)=>new Date(b.pubDate||0)-new Date(a.pubDate||0)).slice(0,30);
  if(!items.length) throw new Error("No live headlines");
  grid.innerHTML=items.map(item=>'<article class="live-news-card"><div class="live-source">'+esc(item.source)+'</div><h3><a href="'+esc(item.link)+'" target="_blank" rel="noopener noreferrer nofollow">'+esc(item.title)+'</a></h3><div class="live-time">'+esc(item.pubDate?new Date(item.pubDate).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Latest")+'</div></article>').join("");
  status.textContent="Updated "+new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});
 }catch(e){
  console.warn("Live news feeds unavailable",e);
  grid.innerHTML='<div class="empty">Live feeds are temporarily unavailable. Published Naija Newspaper stories remain available above.</div>';
  status.textContent="Feed unavailable";
 }}
loadLiveNews();
setInterval(loadLiveNews,10*60*1000);