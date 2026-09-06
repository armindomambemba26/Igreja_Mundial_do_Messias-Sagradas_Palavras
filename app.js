import { auth, db } from './firebase-config.js';
import { DRIVE_UPLOAD_URL, DRIVE_UPLOAD_TOKEN } from './drive-config.js';
import {
  collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const DEFAULT_CATEGORIES = [
 {id:'meishu',name:'Meishu-Sama',image:'imagem_meishu_sama.jpg',desc:'Sagradas Palavras de Meishu-Sama',order:1},
 {id:'nidai',name:'Nidai-Sama',image:'imagem_nidai_sama.jpg',desc:'Sagradas Palavras de Nidai-Sama',order:2},
 {id:'sandai',name:'Sandai-Sama',image:'imagem_sandai-sama.jpg',desc:'Sagradas Palavras de Sandai-Sama',order:3},
 {id:'kyoshu',name:'Kyoshu-Sama',image:'imagem_kyoshu-Sama.jpg',desc:'Sagradas Palavras de Kyoshu-Sama',order:4},
 {id:'masaaki',name:'Masaaki-Sama',image:'imagem_masaaki-sama.jpeg',desc:'Sagradas Palavras de Masaaki-Sama',order:5}
];
const DEFAULT_WELCOME = 'Este espaço foi criado para facilitar o acesso às Sagradas Palavras e preservar, de forma organizada, este precioso conteúdo espiritual. Se não encontrares a Sagrada Palavra que procuras, envia-nos uma mensagem através do formulário de feedback e faremos o possível para disponibilizá-la o mais breve possível.';
let categories=[], materials=[], feedbacks=[], currentCat=null, currentYear=null, editingId=null, isAdmin=false;
const $=id=>document.getElementById(id);

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function dateLabel(v){ if(!v)return ''; if(typeof v==='string') return v; return v?.toDate? v.toDate().toLocaleDateString('pt-PT'):''; }
function showError(e){ console.error(e); alert('Ocorreu um erro: '+(e?.message||e)); }

async function loadCategories(){
  const snap=await getDocs(query(collection(db,'categories'),orderBy('order')));
  categories=snap.docs.map(d=>({id:d.id,...d.data()}));
  if(!categories.length){ categories=DEFAULT_CATEGORIES.slice(); }
  renderCategories();
}
async function loadMaterials(){
  const snap=await getDocs(collection(db,'materials'));
  materials=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  renderYears(); renderResults(); renderAdmin();
}
async function loadFeedbacks(){
  const snap=await getDocs(collection(db,'feedbacks'));
  feedbacks=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt?.seconds||0)-String(a.createdAt?.seconds||0));
  renderAdmin();
}
async function loadSettings(){
  const s=await getDoc(doc(db,'settings','site'));
  const welcome=s.exists()?s.data().welcome:DEFAULT_WELCOME;
  $('welcomeText').textContent=welcome;
  $('adminWelcome').value=welcome;
}

function renderCategories(){
  $('categories').innerHTML=categories.map(c=>`<article class="category card"><img src="${esc(c.image||'imagem_painel.jpg')}" alt="${esc(c.name)}"><div class="category-info"><h3>${esc(c.desc||c.name)}</h3><button onclick="openCategory('${esc(c.id)}')">Acessar →</button></div></article>`).join('');
  $('mCategory').innerHTML=categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  $('catManager').innerHTML=categories.map(c=>`<div class="admin-row"><div><b>${esc(c.name)}</b><br><small>${esc(c.desc||'')} · ${esc(c.image||'')}</small></div><div class="row-actions"><button class="mini" onclick="editCategory('${esc(c.id)}')">Editar</button><button class="mini-danger" onclick="removeCategory('${esc(c.id)}')">Eliminar</button></div></div>`).join('');
}
function openCategory(id){ currentCat=id; currentYear=null; const c=categories.find(x=>x.id===id); $('catalogTitle').textContent=c?.desc||c?.name||''; $('catalog').classList.remove('hidden'); $('categoriesSection').classList.add('hidden'); renderYears(); renderResults(); $('catalog').scrollIntoView({behavior:'smooth',block:'start'}); }
function backCategories(){ $('catalog').classList.add('hidden'); $('categoriesSection').classList.remove('hidden'); currentCat=null; currentYear=null; renderResults(); }
function renderYears(){
  const ys=[...new Set(materials.filter(m=>m.cat===currentCat).map(m=>Number(m.year)).filter(Boolean))].sort((a,b)=>a-b);
  $('years').innerHTML=ys.length?ys.map(y=>`<button class="year ${currentYear==y?'active':''}" onclick="selectYear(${y})">${y}</button>`).join(''):'<p class="muted">Ainda não existem anos cadastrados nesta categoria.</p>';
}
function selectYear(y){currentYear=y;renderYears();renderResults();}
function renderResults(){
  const q=($('searchInput')?.value||'').trim().toLowerCase();
  let arr=materials.filter(m=>(!currentCat||m.cat===currentCat)&&(!currentYear||Number(m.year)===Number(currentYear))&&(!q||`${m.title} ${m.year} ${m.keywords||''} ${dateLabel(m.date)}`.toLowerCase().includes(q)));
  $('materials').innerHTML=arr.length?arr.map(m=>`<article class="material card"><div><h3>${esc(m.title)}</h3><p>${esc(dateLabel(m.date))} · ${esc(m.year)} · ${esc(m.keywords||'')}</p></div><div class="downloads">${m.pdfUrl?`<a class="download" href="${esc(m.pdfUrl)}" target="_blank" rel="noopener">📄 PDF</a>`:''}${m.wordUrl?`<a class="download" href="${esc(m.wordUrl)}" target="_blank" rel="noopener">📝 Word</a>`:''}<button class="download share" onclick="shareMaterial('${esc(m.id)}')">↗ Partilhar</button></div></article>`).join(''):(currentCat||q?'<p class="muted">Nenhum material encontrado.</p>':'');
}
async function shareMaterial(id){const m=materials.find(x=>x.id===id);if(!m)return;const url=location.href.split('#')[0]+'#material='+encodeURIComponent(id);if(navigator.share){try{await navigator.share({title:m.title,text:`Sagrada Palavra: ${m.title}`,url});}catch{}}else{await navigator.clipboard?.writeText(url);alert('Link copiado.');}}

async function sendFeedback(){
  const name=$('fbName').value.trim(), material=$('fbMaterial').value.trim(), msg=$('fbMessage').value.trim();
  if(!msg){alert('Escreva a mensagem antes de enviar.');return;}
  try{await addDoc(collection(db,'feedbacks'),{name,material,msg,status:'Pendente',createdAt:serverTimestamp()});$('fbMessage').value='';$('fbMaterial').value='';alert('Feedback enviado com sucesso. Obrigado por nos ajudar a completar o arquivo. 🙏🏾');}
  catch(e){showError(e)}
}
function openLogin(){hideAll();$('loginView').classList.remove('hidden');$('loginEmail').focus();}
async function login(){
  const email=$('loginEmail').value.trim(), pass=$('loginPass').value;
  if(!email||!pass){alert('Informe o e-mail e a palavra-passe.');return;}
  try{await signInWithEmailAndPassword(auth,email,pass);}catch(e){alert('Não foi possível entrar. Verifique o e-mail e a palavra-passe e confirme se a conta existe no Firebase Authentication.');}
}
async function logout(){try{await signOut(auth);}catch(e){showError(e)} }
function showAdmin(){hideAll();$('adminView').classList.remove('hidden');$('adminWelcome').value=$('welcomeText').textContent;renderAdmin();}
function showPublic(anchor){hideAll();$('publicView').classList.remove('hidden');if(anchor==='feedback')setTimeout(()=>$('feedback').scrollIntoView({behavior:'smooth'}),50);}
function hideAll(){['publicView','loginView','adminView'].forEach(id=>$(id).classList.add('hidden'));}

async function ensureDefaultCategories(){
  const snap=await getDocs(collection(db,'categories')); if(!snap.empty)return;
  for(const c of DEFAULT_CATEGORIES){await setDoc(doc(db,'categories',c.id),c);}
  categories=DEFAULT_CATEGORIES.slice(); renderCategories();
}
async function driveRequest(action, file, materialId, oldFileId){
  if(!DRIVE_UPLOAD_URL || DRIVE_UPLOAD_URL.includes('COLE_AQUI')) throw new Error('A integração com o Google Drive ainda não foi configurada. Abra drive-config.js e cole o URL do Web App do Google Apps Script.');
  const data = await fileToBase64(file);
  const payload = {
    token: DRIVE_UPLOAD_TOKEN,
    action,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64: data,
    materialId: materialId || '',
    oldFileId: oldFileId || ''
  };
  const res = await fetch(DRIVE_UPLOAD_URL, {method:'POST', body: JSON.stringify(payload)});
  const text = await res.text();
  let out; try { out=JSON.parse(text); } catch { throw new Error('Resposta inválida do Google Drive: '+text.slice(0,200)); }
  if(!out.ok) throw new Error(out.error || 'Falha no envio para o Google Drive.');
  return out;
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(r.error||new Error('Não foi possível ler o ficheiro.'));r.readAsDataURL(file);});
}
async function deleteDriveFile(fileId){
  if(!fileId || !DRIVE_UPLOAD_URL || DRIVE_UPLOAD_URL.includes('COLE_AQUI')) return;
  try{await fetch(DRIVE_UPLOAD_URL,{method:'POST',body:JSON.stringify({token:DRIVE_UPLOAD_TOKEN,action:'delete',fileId})});}catch(e){console.warn('Ficheiro antigo não eliminado do Drive:',e.message)}
}
async function addMaterial(){
  const cat=$('mCategory').value, year=$('mYear').value, date=$('mDate').value, title=$('mTitle').value.trim(), keywords=$('mKeywords').value.trim(), pdf=$('mPdf').files[0], word=$('mWord').files[0];
  if(!year||!title){alert('Informe pelo menos o ano e o título.');return}
  if(!pdf&&!word&&!editingId){alert('Selecione pelo menos um ficheiro PDF ou Word.');return}
  if(pdf && pdf.size>15*1024*1024){alert('O PDF não pode ultrapassar 15 MB.');return}
  if(word && word.size>15*1024*1024){alert('O Word não pode ultrapassar 15 MB.');return}
  const btn=document.querySelector('[onclick="addMaterial()"]'); if(btn)btn.disabled=true;
  try{
    const data={cat,year:Number(year),date,title,keywords,updatedAt:serverTimestamp()};
    if(editingId){
      const old=materials.find(m=>m.id===editingId)||{};
      if(pdf){const r=await driveRequest('upload',pdf,editingId,old.pdfFileId);data.pdfUrl=r.url;data.pdfFileId=r.fileId;await deleteDriveFile(old.pdfFileId);}
      else {data.pdfUrl=old.pdfUrl||'';data.pdfFileId=old.pdfFileId||'';}
      if(word){const r=await driveRequest('upload',word,editingId,old.wordFileId);data.wordUrl=r.url;data.wordFileId=r.fileId;await deleteDriveFile(old.wordFileId);}
      else {data.wordUrl=old.wordUrl||'';data.wordFileId=old.wordFileId||'';}
      await updateDoc(doc(db,'materials',editingId),data); alert('Material atualizado com sucesso.');
    }else{
      const created=await addDoc(collection(db,'materials'),{...data,createdAt:serverTimestamp()});
      const patch={};
      if(pdf){const r=await driveRequest('upload',pdf,created.id);patch.pdfUrl=r.url;patch.pdfFileId=r.fileId;}
      if(word){const r=await driveRequest('upload',word,created.id);patch.wordUrl=r.url;patch.wordFileId=r.fileId;}
      if(Object.keys(patch).length)await updateDoc(doc(db,'materials',created.id),patch); alert('Material publicado com sucesso no arquivo.');
    }
    resetMaterialForm(); await loadMaterials();
  }catch(e){showError(e)}finally{if(btn)btn.disabled=false;}
}
function resetMaterialForm(){editingId=null;$('mYear').value='';$('mDate').value='';$('mTitle').value='';$('mKeywords').value='';$('mPdf').value='';$('mWord').value='';$('materialFormTitle').textContent='Adicionar material';$('materialSubmit').textContent='Publicar material';}
async function safeDelete(path){try{if(path)await deleteObject(ref(storage,path));}catch(e){console.warn('Ficheiro antigo não eliminado:',e.message)}}
function editMaterial(id){const m=materials.find(x=>x.id===id);if(!m)return;editingId=id;$('mCategory').value=m.cat;$('mYear').value=m.year;$('mDate').value=m.date||'';$('mTitle').value=m.title||'';$('mKeywords').value=m.keywords||'';$('materialFormTitle').textContent='Editar material';$('materialSubmit').textContent='Guardar alterações';window.scrollTo({top:$('materialForm').offsetTop-80,behavior:'smooth'});}
async function removeMaterial(id){if(!confirm('Eliminar este material e os respetivos ficheiros?'))return;try{const m=materials.find(x=>x.id===id);await deleteDoc(doc(db,'materials',id));await deleteDriveFile(m?.pdfFileId);await deleteDriveFile(m?.wordFileId);await loadMaterials();}catch(e){showError(e)}}

async function saveWelcome(){const text=$('adminWelcome').value.trim();if(!text){alert('A mensagem não pode ficar vazia.');return}try{await setDoc(doc(db,'settings','site'),{welcome:text,updatedAt:serverTimestamp()},{merge:true});$('welcomeText').textContent=text;alert('Mensagem atualizada.');}catch(e){showError(e)}}
async function updateFeedback(id,status){try{await updateDoc(doc(db,'feedbacks',id),{status,updatedAt:serverTimestamp()});await loadFeedbacks();}catch(e){showError(e)}}
async function removeFeedback(id){if(!confirm('Eliminar este feedback?'))return;try{await deleteDoc(doc(db,'feedbacks',id));await loadFeedbacks();}catch(e){showError(e)}}

function openCategoryManager(){resetCategoryForm();}
function resetCategoryForm(){ $('catId').value='';$('catName').value='';$('catDesc').value='';$('catImage').value='';$('catFormTitle').textContent='Adicionar categoria';$('catSave').textContent='Adicionar categoria'; }
function editCategory(id){const c=categories.find(x=>x.id===id);if(!c)return;$('catId').value=id;$('catName').value=c.name||'';$('catDesc').value=c.desc||'';$('catImage').value=c.image||'';$('catFormTitle').textContent='Editar categoria';$('catSave').textContent='Guardar alterações';$('catManagerForm').scrollIntoView({behavior:'smooth',block:'center'});}
async function saveCategory(){const id=$('catId').value.trim(),name=$('catName').value.trim(),desc=$('catDesc').value.trim(),image=$('catImage').value.trim()||'imagem_painel.jpg';if(!name){alert('Informe o nome da categoria.');return}try{const payload={name,desc:desc||`Sagradas Palavras de ${name}`,image,order:id?(categories.find(c=>c.id===id)?.order||99):categories.length+1,updatedAt:serverTimestamp()};if(id)await updateDoc(doc(db,'categories',id),payload);else await addDoc(collection(db,'categories'),payload);resetCategoryForm();await loadCategories();alert('Categoria guardada.');}catch(e){showError(e)}}
async function removeCategory(id){if(materials.some(m=>m.cat===id)){alert('Não é possível eliminar uma categoria que ainda possui materiais.');return}if(!confirm('Eliminar esta categoria?'))return;try{await deleteDoc(doc(db,'categories',id));await loadCategories();}catch(e){showError(e)}}

function renderAdmin(){
  if(!$('stats'))return;
  const pdfs=materials.filter(m=>m.pdfUrl).length,words=materials.filter(m=>m.wordUrl).length,years=new Set(materials.map(m=>m.year)).size,pending=feedbacks.filter(f=>f.status==='Pendente').length;
  $('stats').innerHTML=`<div class="stat card"><b>${materials.length}</b><span>Materiais</span></div><div class="stat card"><b>${pdfs}</b><span>PDFs</span></div><div class="stat card"><b>${words}</b><span>Word</span></div><div class="stat card"><b>${years}</b><span>Anos</span></div><div class="stat card"><b>${pending}</b><span>Feedbacks pendentes</span></div>`;
  $('adminMaterials').innerHTML=materials.length?materials.map(m=>`<div class="admin-row"><div><b>${esc(m.title)}</b><br><small>${esc(categories.find(c=>c.id===m.cat)?.name||'Categoria')} · ${esc(m.year)} · ${esc(m.date||'')}</small></div><div class="row-actions"><button class="mini" onclick="editMaterial('${esc(m.id)}')">Editar</button><button class="mini-danger" onclick="removeMaterial('${esc(m.id)}')">Eliminar</button></div></div>`).join(''):'<p class="muted">Nenhum material publicado.</p>';
  $('feedbackList').innerHTML=feedbacks.length?feedbacks.map(f=>`<div class="feedback-item"><div><b>${esc(f.material||'Material não especificado')}</b> <span class="status ${String(f.status).toLowerCase().replaceAll(' ','-')}">${esc(f.status)}</span></div><small>${esc(f.name||'Visitante')} · ${esc(dateLabel(f.createdAt))}</small><p>${esc(f.msg)}</p><div class="row-actions"><button class="mini" onclick="updateFeedback('${esc(f.id)}','Em análise')">Em análise</button><button class="mini" onclick="updateFeedback('${esc(f.id)}','Resolvido')">Resolvido</button><button class="mini-danger" onclick="removeFeedback('${esc(f.id)}')">Eliminar</button></div></div>`).join(''):'<p class="muted">Nenhum feedback recebido.</p>';
}

onAuthStateChanged(auth,async user=>{
  isAdmin=false;
  if(user){
    try{const a=await getDoc(doc(db,'admins',user.uid));isAdmin=a.exists()&&(a.data().active!==false);}
    catch(e){console.error(e)}
  }
  if(user&&isAdmin){showAdmin();await ensureDefaultCategories();await Promise.all([loadCategories(),loadMaterials(),loadFeedbacks(),loadSettings()]);}
  else if(user&&!isAdmin){await signOut(auth);alert('A conta entrou no Firebase, mas ainda não foi autorizada como administrador. Crie o documento admins/UID no Firestore conforme o README.');showPublic();}
  else{showPublic();}
});

(async()=>{try{await loadCategories();await loadMaterials();await loadSettings();}catch(e){console.error('Falha ao carregar dados públicos:',e);}})();

Object.assign(window,{openCategory,backCategories,selectYear,renderResults,sendFeedback,openLogin,login,logout,showAdmin,showPublic,addMaterial,saveWelcome,updateFeedback,removeFeedback,editMaterial,removeMaterial,editCategory,saveCategory,removeCategory,resetMaterialForm,openCategoryManager,shareMaterial});
