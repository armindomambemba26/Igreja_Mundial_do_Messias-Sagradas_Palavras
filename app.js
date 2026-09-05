const categories=[
 {id:"meishu",name:"Meishu-Sama",image:"imagem_meishu_sama.jpg",desc:"Sagradas Palavras de Meishu-Sama"},
 {id:"nidai",name:"Nidai-Sama",image:"imagem_nidai_sama.jpg",desc:"Sagradas Palavras de Nidai-Sama"},
 {id:"sandai",name:"Sandai-Sama",image:"imagem_sandai_sama.jpg",desc:"Sagradas Palavras de Sandai-Sama"},
 {id:"kyoshu",name:"Kyoshu-Sama",image:"imagem_kyoshu-Sama.jpg",desc:"Sagradas Palavras de Kyoshu-Sama"},
 {id:"masaaki",name:"Masaaki-Sama",image:"imagem_masaaki-sama.jpeg",desc:"Sagradas Palavras de Masaaki-Sama"}
];
let materials=JSON.parse(localStorage.getItem("sagradas_materials")||"[]");
let feedbacks=JSON.parse(localStorage.getItem("sagradas_feedbacks")||"[]");
let welcome=localStorage.getItem("sagradas_welcome")||document.getElementById("welcomeText").textContent;
let currentCat=null,currentYear=null;
document.getElementById("welcomeText").textContent=welcome;

function renderCategories(){
 document.getElementById("categories").innerHTML=categories.map(c=>`<article class="category card"><img src="${c.image}" alt="${c.name}"><div class="category-info"><h3>${c.desc}</h3><button onclick="openCategory('${c.id}')">Acessar →</button></div></article>`).join("");
 document.getElementById("mCategory").innerHTML=categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}
function openCategory(id){
 currentCat=id; currentYear=null;
 const c=categories.find(x=>x.id===id); document.getElementById("catalogTitle").textContent=c.desc;
 document.getElementById("catalog").classList.remove("hidden"); document.getElementById("categories").parentElement.classList.add("hidden");
 renderYears(); renderResults();
 window.scrollTo({top:document.getElementById("catalog").offsetTop-80,behavior:"smooth"});
}
function backCategories(){document.getElementById("catalog").classList.add("hidden");document.getElementById("categories").parentElement.classList.remove("hidden");currentCat=null;currentYear=null;}
function renderYears(){
 const ys=[...new Set(materials.filter(m=>m.cat===currentCat).map(m=>m.year))].sort((a,b)=>a-b);
 document.getElementById("years").innerHTML=ys.length?ys.map(y=>`<button class="year ${currentYear==y?"active":""}" onclick="selectYear(${y})">${y}</button>`).join(""):"<p style='color:#68716a'>Ainda não existem anos cadastrados nesta categoria.</p>";
}
function selectYear(y){currentYear=y;renderYears();renderResults();}
function renderResults(){
 const q=(document.getElementById("searchInput")?.value||"").toLowerCase();
 let arr=materials.filter(m=>(!currentCat||m.cat===currentCat)&&(!currentYear||m.year==currentYear)&&(!q||`${m.title} ${m.year} ${m.keywords}`.toLowerCase().includes(q)));
 const box=document.getElementById("materials");
 if(!box)return;
 box.innerHTML=arr.length?arr.map(m=>`<article class="material card"><div><h3>${esc(m.title)}</h3><p>${m.date||""} · ${m.year} · ${esc(m.keywords||"")}</p></div><div class="downloads">${m.pdf?`<a class="download" href="${m.pdf}" download>📄 PDF</a>`:""}${m.word?`<a class="download" href="${m.word}" download>📝 Word</a>`:""}</div></article>`).join(""):(currentCat?"<p style='color:#68716a'>Nenhum material encontrado.</p>":"");
}
function sendFeedback(){
 const name=document.getElementById("fbName").value.trim(), material=document.getElementById("fbMaterial").value.trim(), msg=document.getElementById("fbMessage").value.trim();
 if(!msg){alert("Escreva a mensagem antes de enviar.");return}
 feedbacks.unshift({id:Date.now(),name,material,msg,date:new Date().toLocaleString("pt-PT"),status:"Pendente"});
 localStorage.setItem("sagradas_feedbacks",JSON.stringify(feedbacks)); document.getElementById("fbMessage").value="";document.getElementById("fbMaterial").value="";
 alert("Feedback enviado com sucesso. Obrigado por nos ajudar a completar o arquivo. 🙏🏾");
}
function openLogin(){hideAll();document.getElementById("loginView").classList.remove("hidden");}
function login(){
 const u=document.getElementById("loginUser").value,p=document.getElementById("loginPass").value;
 if(u==="admin"&&p==="admin123"){localStorage.setItem("adminLogged","1");showAdmin()}else alert("Utilizador ou palavra-passe incorretos.");
}
function showAdmin(){hideAll();document.getElementById("adminView").classList.remove("hidden");document.getElementById("adminWelcome").value=welcome;renderAdmin();}
function logout(){localStorage.removeItem("adminLogged");showPublic();}
function showPublic(anchor){hideAll();document.getElementById("publicView").classList.remove("hidden"); if(anchor==="feedback")document.getElementById("feedback").scrollIntoView({behavior:"smooth"});}
function hideAll(){["publicView","loginView","adminView"].forEach(id=>document.getElementById(id).classList.add("hidden"))}
function addMaterial(){
 const cat=document.getElementById("mCategory").value,year=document.getElementById("mYear").value,date=document.getElementById("mDate").value,title=document.getElementById("mTitle").value.trim(),keywords=document.getElementById("mKeywords").value.trim(),pdf=document.getElementById("mPdf").files[0],word=document.getElementById("mWord").files[0];
 if(!year||!title){alert("Informe pelo menos o ano e o título.");return}
 // Local prototype: files are stored as browser data URLs, suitable for testing but not for a multi-user production deployment.
 const read=f=>new Promise(r=>{if(!f)r("");else{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)}});
 Promise.all([read(pdf),read(word)]).then(([pd,wo])=>{
   materials.unshift({id:Date.now(),cat,year,date,title,keywords,pdf:pd,word:wo});
   localStorage.setItem("sagradas_materials",JSON.stringify(materials)); document.getElementById("mTitle").value="";
   document.getElementById("mPdf").value="";document.getElementById("mWord").value="";renderAdmin();alert("Material publicado com sucesso.");
 });
}
function saveWelcome(){welcome=document.getElementById("adminWelcome").value.trim();localStorage.setItem("sagradas_welcome",welcome);document.getElementById("welcomeText").textContent=welcome;alert("Mensagem atualizada.");}
function renderAdmin(){
 const pdfs=materials.filter(m=>m.pdf).length,words=materials.filter(m=>m.word).length,years=new Set(materials.map(m=>m.year)).size;
 document.getElementById("stats").innerHTML=`<div class="stat card"><b>${materials.length}</b><span>Materiais</span></div><div class="stat card"><b>${pdfs}</b><span>PDFs</span></div><div class="stat card"><b>${words}</b><span>Word</span></div><div class="stat card"><b>${feedbacks.filter(f=>f.status==="Pendente").length}</b><span>Feedbacks pendentes</span></div>`;
 document.getElementById("adminMaterials").innerHTML=materials.length?materials.map(m=>`<div class="admin-row"><div><b>${esc(m.title)}</b><br><small>${categories.find(c=>c.id===m.cat)?.name} · ${m.year} · ${m.date||""}</small></div><button class="mini-danger" onclick="removeMaterial(${m.id})">Eliminar</button></div>`).join(""):"<p>Nenhum material publicado.</p>";
 document.getElementById("feedbackList").innerHTML=feedbacks.length?feedbacks.map(f=>`<div class="feedback-item"><b>${esc(f.material||"Material não especificado")}</b> <span class="status">${f.status}</span><br><small>${esc(f.name||"Visitante")} · ${f.date}</small><p>${esc(f.msg)}</p><button class="mini-danger" onclick="resolveFeedback(${f.id})">${f.status==="Resolvido"?"Resolvido":"Marcar como resolvido"}</button></div>`).join(""):"<p>Nenhum feedback recebido.</p>";
}
function removeMaterial(id){if(confirm("Eliminar este material?")){materials=materials.filter(m=>m.id!==id);localStorage.setItem("sagradas_materials",JSON.stringify(materials));renderAdmin();renderYears();renderResults();}}
function resolveFeedback(id){feedbacks=feedbacks.map(f=>f.id===id?{...f,status:"Resolvido"}:f);localStorage.setItem("sagradas_feedbacks",JSON.stringify(feedbacks));renderAdmin();}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
renderCategories(); if(localStorage.getItem("adminLogged")==="1")showAdmin(); else showPublic();
