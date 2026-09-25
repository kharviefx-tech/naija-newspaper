const SUPABASE_URL="https://dprulohylwgzmetgrywj.supabase.co";
const SUPABASE_KEY="sb_publishable_gNWkc787SxA7U76No3A4kg_XHP0x2j4";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const date=v=>v?new Date(v).toLocaleDateString("en-NG",{year:"numeric",month:"short",day:"numeric"}):"";
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let people=[],posts=[],categories=[];

async function load(){
  try{
    const [p,n,c]=await Promise.all([
      db.from("people_profiles").select("*").eq("is_published",true).order("display_name"),
      db.from("posts").select("*").eq("is_published",true).order("published_at",{ascending:false}).limit(30),
      db.from("post_categories").select("*").eq("is_active",true).order("sort_order")
    ]);
    if(p.error||n.error||c.error) throw p.error||n.error||c.error;
    people=p.data||[]; posts=n.data||[]; categories=c.data||[];
    renderHero(posts); renderPeople(people); renderPosts(posts); renderTrending(posts); route();
  }catch(e){
    console.error(e);
    document.querySelectorAll(".loading").forEach(el=>el.outerHTML='<div class="empty">Content is temporarily unavailable. Please try again.</div>');
  }
}

function renderHero(items){
  const x=items[0];
  if(!x)return;
  const card=document.querySelector(".lead-card");
  if(!card)return;
  card.innerHTML=(x.featured_image_url?'<img class="hero-story-img" src="'+esc(x.featured_image_url)+'" alt="'+esc(x.title||"Lead story")+'">':'<div class="image-placeholder">NAIJA NEWSPAPER</div>')+
    '<div class="story-meta">'+esc(x.content_type||"NEWS")+' · '+esc(date(x.published_at))+'</div>'+
    '<h1>'+esc(x.title||"Latest story")+'</h1>'+
    '<p>'+esc(x.excerpt||x.meta_description||"The latest story from Naija Newspaper.")+'</p>'+
    '<a class="read-link" href="#story/'+encodeURIComponent(x.slug||x.id)+'">Read full story →</a>';
}
function storyCard(x){
  return '<article class="story-card">'+(x.featured_image_url?'<img class="story-img" src="'+esc(x.featured_image_url)+'" alt="'+esc(x.title||"Story")+'" loading="lazy">':'<div class="story-img"></div>')+
  '<div class="story-body"><div class="story-meta">'+esc(x.content_type||"NEWS")+' · '+esc(date(x.published_at))+'</div><h3>'+esc(x.title||"Untitled story")+'</h3><p>'+esc(x.excerpt||x.meta_description||"Read the latest story from Naija Newspaper.")+'</p><a class="read-link" href="#story/'+encodeURIComponent(x.slug||x.id)+'">Read story →</a></div></article>';
}
function renderPosts(items){
  const html=items.length?items.map(storyCard).join(""):'<div class="empty">No published stories yet. Your editorial desk can publish the first story.</div>';
  $("#newsGrid").innerHTML=html; $("#allNewsGrid").innerHTML=html;
}
function personCard(x){
  return '<a class="person-card" href="#person/'+encodeURIComponent(x.slug)+'">'+(x.profile_image_url?'<img src="'+esc(x.profile_image_url)+'" alt="'+esc(x.display_name)+'" loading="lazy">':'<div class="story-img"></div>')+
  '<h3>'+esc(x.display_name)+'</h3><p>'+esc(x.headline||x.category||x.person_type||"Public profile")+'</p>'+
  (x.is_verified?'<span class="verified">✓ Verified by Naija Newspaper</span>':"")+'</a>';
}
function renderPeople(items){
  const html=items.length?items.slice(0,12).map(personCard).join(""):'<div class="empty">No published profiles yet. Submit a person to start the directory.</div>';
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
  const x=people.find(p=>p.slug===slug);
  $("#profile").classList.remove("hidden");
  if(!x){$("#profile").innerHTML='<div class="empty">Profile not found.</div>';return;}
  const r=await db.from("people_links").select("*").eq("person_id",x.id).order("sort_order");
  const links=r.data||[];
  const canonical=location.href.split("#")[0]+"?person="+encodeURIComponent(x.slug);
  $("#profile").innerHTML='<div class="profile-layout"><aside>'+(x.profile_image_url?'<img src="'+esc(x.profile_image_url)+'" alt="'+esc(x.display_name)+'">':'<div class="story-img"></div>')+
    '<div class="infobox"><div><strong>Type</strong><span>'+esc(x.person_type||"—")+'</span></div><div><strong>Category</strong><span>'+esc(x.category||"—")+'</span></div><div><strong>Location</strong><span>'+esc(x.location||"—")+'</span></div></div></aside><article><div class="section-kicker">PEOPLE PROFILE</div><h1 class="profile-name">'+esc(x.display_name)+'</h1><p class="profile-headline">'+esc(x.headline||"")+'</p>'+
    (x.is_verified?'<span class="verified">✓ Verified by Naija Newspaper</span>':"")+'<hr><h2>Biography</h2><div class="bio">'+contentHtml(x.bio||x.short_bio||"This profile is being developed.")+'</div>'+
    '<h2>Official links</h2><div id="profileLinks" class="link-grid">'+(links.map(l=>'<a href="'+esc(l.url)+'" target="_blank" rel="noopener">'+esc(l.label||l.platform)+" →</a>").join("")||"<div class='empty'>Official links will appear here.</div>")+'</div>'+
    '<p class="claim-note">Is this your profile? <a class="read-link" href="#claim">Claim or request an update →</a></p></article></div>';
  setMeta((x.meta_title||x.display_name)+" — Naija Newspaper",x.meta_description||x.short_bio||x.headline||"People profile on Naija Newspaper",canonical,"Person",{name:x.display_name,description:x.bio||x.short_bio,image:x.profile_image_url,url:canonical,sameAs:Array.isArray(x.same_as)?x.same_as:[]});
  window.scrollTo({top:document.querySelector("#profile").offsetTop-90,behavior:"smooth"});
}
function route(){
  const h=location.hash;
  if(/^#story\//.test(h)){showStory(decodeURIComponent(h.slice(7)));return;}
  if(/^#person\//.test(h)){showPerson(decodeURIComponent(h.slice(8)));return;}
  $("#profile").classList.add("hidden");
  if(!h||h==="#home") setMeta("Naija Newspaper — News, People, Culture & Stories","Naija Newspaper is a Nigerian digital publication covering news, people, creators, entertainment, music, business, culture and events.","https://kharviefx-tech.github.io/naija-newspaper/","NewsMediaOrganization",{name:"Naija Newspaper",url:"https://kharviefx-tech.github.io/naija-newspaper/"});
}
function formValue(form,name){return (form.elements[name]?.value||"").trim();}
async function submitProfile(e){
  e.preventDefault();const f=e.currentTarget;const msg=$("#profileSubmitMsg");
  const payload={name:formValue(f,"name"),profession:formValue(f,"profession"),category:formValue(f,"category"),bio:formValue(f,"bio"),website_url:formValue(f,"website_url")||null,photo_url:formValue(f,"photo_url")||null,notes:formValue(f,"notes")||null,social_links:{}};
  if(!payload.name||!payload.bio){msg.textContent="Please provide the name and biography.";return;}
  const r=await db.from("profile_submissions").insert(payload);
  msg.textContent=r.error?"Submission could not be sent. Please try again.":"Submitted successfully. Our editorial team will review it.";
  if(!r.error)f.reset();
}
async function submitClaim(e){
  e.preventDefault();const f=e.currentTarget,msg=$("#claimMsg");
  const name=formValue(f,"claimant_name"),email=formValue(f,"claimant_email"),slug=formValue(f,"profile_slug");
  const p=people.find(x=>x.slug===slug);
  if(!p){msg.textContent="We could not find that published profile. Enter the exact profile slug.";return;}
  const r=await db.from("profile_claims").insert({person_id:p.id,claimant_name:name,claimant_email:email,relationship:formValue(f,"relationship"),proof_url:formValue(f,"proof_url")||null,proof_notes:formValue(f,"proof_notes")||null});
  msg.textContent=r.error?"Claim could not be sent. Please try again.":"Claim submitted. The editorial team will review the proof and contact you if needed.";
  if(!r.error)f.reset();
}
$("#peopleSearch").addEventListener("input",filterPeople);
$("#peopleType").addEventListener("change",filterPeople);
$("#menuBtn").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#searchBtn").addEventListener("click",()=>$("#searchPanel").classList.add("open"));
$("#closeSearch").addEventListener("click",()=>$("#searchPanel").classList.remove("open"));
$("#globalSearch").addEventListener("input",e=>{const q=e.target.value.toLowerCase().trim();const out=[...posts.map(x=>({type:"story",item:x})),...people.map(x=>({type:"person",item:x}))].filter(v=>{const x=v.item;return [x.title,x.display_name,x.headline,x.category,x.person_type].join(" ").toLowerCase().includes(q)}).slice(0,10).map(v=>v.type==="story"?'<div class="result"><div class="story-meta">STORY · '+esc(date(v.item.published_at))+'</div><h3>'+esc(v.item.title)+'</h3><a class="read-link" href="#story/'+encodeURIComponent(v.item.slug||v.item.id)+'">Open →</a></div>':'<div class="result"><div class="story-meta">PEOPLE PROFILE</div><h3>'+esc(v.item.display_name)+'</h3><a class="read-link" href="#person/'+encodeURIComponent(v.item.slug)+'">Open →</a></div>').join("");$("#searchResults").innerHTML=q?out||'<div class="empty">No matching results.</div>':""});
$("#profileForm").addEventListener("submit",submitProfile);
$("#claimForm").addEventListener("submit",submitClaim);
window.addEventListener("hashchange",route);
$("#dateLine").textContent=new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("#year").textContent=new Date().getFullYear();
load();