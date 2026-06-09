/* Control de Asistencia BIG - Firebase Ready */
const appEl = document.getElementById('app');
const badge = document.getElementById('connectionBadge');
const logoutBtn = document.getElementById('logoutBtn');
let fbApp, auth, db, currentUser=null, currentProfile=null;
let unsubscribeSession=null, unsubscribeRecords=null;

function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
function safe(s){ return String(s ?? '').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function today(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ return new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}); }
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function setBadge(text, cls=''){ badge.textContent=text; badge.className='badge '+cls; }
function statusByStart(startISO){ const start=new Date(startISO); const mins=(Date.now()-start.getTime())/60000; if(mins <= (window.APP_CONFIG.attendanceWindowMinutes||10)) return 'Asistencia'; if(mins <= (window.APP_CONFIG.lateWindowMinutes||20)) return 'Retardo'; return 'Falta'; }

function initFirebase(){
  if(!window.FIREBASE_CONFIG){ appEl.innerHTML='<div class="card error"><h2>Falta config.js</h2><p>No se encontró FIREBASE_CONFIG.</p></div>'; return; }
  fbApp=firebase.initializeApp(window.FIREBASE_CONFIG);
  auth=firebase.auth(); db=firebase.firestore();
  setBadge('Firebase activo');
  auth.onAuthStateChanged(async (user)=>{ currentUser=user; logoutBtn.classList.toggle('hidden',!user); if(!user){ renderLogin(); return; } await loadProfile(); });
}

async function loadProfile(){
  const ref=db.collection('profiles').doc(currentUser.uid);
  const snap=await ref.get();
  if(snap.exists){ currentProfile={id:snap.id,...snap.data()}; renderHome(); return; }
  const admins=await db.collection('profiles').where('role','==','admin').limit(1).get();
  if(admins.empty){ renderFirstAdmin(); } else { renderNoProfile(); }
}

function renderLogin(){
  appEl.innerHTML=`<section class="card"><h1>Ingreso</h1><p class="muted">Inicia sesión con el correo registrado en Firebase Authentication.</p>
  <label>Correo electrónico</label><input id="email" type="email" placeholder="maestro@correo.com" autocomplete="username">
  <label>Contraseña</label><input id="pass" type="password" placeholder="Contraseña" autocomplete="current-password">
  <div class="row" style="margin-top:16px"><button id="loginBtn">Iniciar sesión</button></div><div id="msg"></div></section>`;
  document.getElementById('loginBtn').onclick=async()=>{ const email=document.getElementById('email').value.trim(); const pass=document.getElementById('pass').value; const msg=document.getElementById('msg'); try{ await auth.signInWithEmailAndPassword(email,pass); }catch(e){ msg.innerHTML=`<p class="error">${safe(e.message)}</p>`; } };
}
function renderFirstAdmin(){
  appEl.innerHTML=`<section class="card"><h1>Activar administrador</h1><p class="notice">No existe ningún administrador. Como eres el primer usuario, puedes activar esta cuenta como administrador principal.</p><p><strong>${safe(currentUser.email)}</strong></p><label>Nombre</label><input id="adminName" value="Eduardo Chávez"><button id="makeAdmin">Activar como administrador</button></section>`;
  document.getElementById('makeAdmin').onclick=async()=>{ const name=document.getElementById('adminName').value.trim()||currentUser.email; await db.collection('profiles').doc(currentUser.uid).set({name,email:currentUser.email,role:'admin',groups:[],createdAt:firebase.firestore.FieldValue.serverTimestamp()}); await seedInitialData(); await loadProfile(); };
}
function renderNoProfile(){ appEl.innerHTML=`<section class="card"><h1>Usuario sin perfil</h1><p class="notice">Tu usuario existe en Firebase Authentication, pero aún no tiene perfil en la app. Pide al administrador que te registre como maestro y te asigne grupos.</p><p>${safe(currentUser.email)}</p></section>`; }
logoutBtn.onclick=()=>auth.signOut();

function nav(){ const isAdmin=currentProfile?.role==='admin'; return `<div class="card"><div class="row"><button data-view="dashboard">Inicio</button><button class="ghost" data-view="sessions">Sesiones / QR</button><button class="ghost" data-view="reports">Reportes</button>${isAdmin?'<button class="ghost" data-view="teachers">Maestros</button><button class="ghost" data-view="students">Alumnos</button><button class="ghost" data-view="settings">Configuración</button>':''}</div></div>`; }
function renderHome(view='dashboard'){ appEl.innerHTML=nav()+`<div id="view"></div>`; document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>renderHome(b.dataset.view)); if(view==='dashboard') renderDashboard(); if(view==='sessions') renderSessions(); if(view==='reports') renderReports(); if(view==='teachers') renderTeachers(); if(view==='students') renderStudents(); if(view==='settings') renderSettings(); }
function viewEl(){ return document.getElementById('view'); }
async function seedInitialData(){
  const batch=db.batch();
  for(const g of (window.SEED_GROUPS||[])){ batch.set(db.collection('groups').doc(g.name), {...g, name:g.name}, {merge:true}); }
  for(const s of (window.SEED_STUDENTS||[])){ batch.set(db.collection('students').doc(s.id), s, {merge:true}); }
  await batch.commit();
}
async function renderDashboard(){
  const groups=await getVisibleGroups(); const students=await getStudents(groups.map(g=>g.name));
  viewEl().innerHTML=`<section class="card"><h1>Panel principal</h1><p class="muted">Usuario: ${safe(currentProfile.name)} · Perfil: ${safe(currentProfile.role)}</p><div class="grid"><div class="card"><h2>${groups.length}</h2><p>Grupos visibles</p></div><div class="card"><h2>${students.length}</h2><p>Alumnos cargados</p></div><div class="card"><h2>${today()}</h2><p>Fecha actual</p></div></div></section>`;
}
async function getVisibleGroups(){ const snap=await db.collection('groups').get(); const all=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name)); if(currentProfile.role==='admin' || (currentProfile.groups||[]).includes('*')) return all; return all.filter(g=>(currentProfile.groups||[]).includes(g.name)); }
async function getStudents(groupNames){ if(!groupNames.length) return []; const snap=await db.collection('students').get(); return snap.docs.map(d=>({id:d.id,...d.data()})).filter(s=>groupNames.includes(s.grupo)).sort((a,b)=>a.grupo.localeCompare(b.grupo)||a.nombre.localeCompare(b.nombre)); }
async function renderSessions(){
  const groups=await getVisibleGroups();
  viewEl().innerHTML=`<section class="card"><h1>Sesiones y QR</h1><p class="muted">Selecciona grupo, materia y genera el QR que los estudiantes escanearán.</p><div class="grid"><div><label>Grupo</label><select id="grp">${groups.map(g=>`<option>${safe(g.name)}</option>`).join('')}</select><label>Materia</label><input id="subject" placeholder="Ej. Matemáticas" value="Matemáticas"><label>Hora de inicio de clase</label><input id="startTime" type="time" value="${new Date().toTimeString().slice(0,5)}"><label>Tolerancia asistencia (min)</label><input id="okmin" type="number" value="${window.APP_CONFIG.attendanceWindowMinutes||10}"><label>Límite retardo (min)</label><input id="latemin" type="number" value="${window.APP_CONFIG.lateWindowMinutes||20}"><button id="startSession">Generar QR</button></div><div><div id="sessionBox" class="qrbox"><p class="muted">Aquí aparecerá el QR</p></div></div></div><div id="live"></div></section>`;
  document.getElementById('startSession').onclick=async()=>{ const grupo=document.getElementById('grp').value; const subject=document.getElementById('subject').value.trim()||'Clase'; const ok=Number(document.getElementById('okmin').value||10); const late=Number(document.getElementById('latemin').value||20); const classStartTime=document.getElementById('startTime').value || new Date().toTimeString().slice(0,5); const id=uid(); const startISO=new Date(`${today()}T${classStartTime}:00`).toISOString(); const data={id,grupo,subject,teacherUid:currentUser.uid,teacherName:currentProfile.name,date:today(),classStartTime,startISO,attendanceWindowMinutes:ok,lateWindowMinutes:late,open:true,createdAt:firebase.firestore.FieldValue.serverTimestamp()}; await db.collection('sessions').doc(id).set(data); showSessionQR(data); listenRecords(id); };
}
function showSessionQR(s){ const url=new URL(location.href); url.search=''; url.hash=''; const link=url.toString().replace(/index\.html$/,'')+'?session='+encodeURIComponent(s.id); const box=document.getElementById('sessionBox'); box.innerHTML=`<div><h3>${safe(s.subject)} · ${safe(s.grupo)}</h3><p class="muted">Inicio de clase: ${safe(s.classStartTime||'')}</p><div id="qrcode"></div><p><a href="${link}" target="_blank">Abrir registro</a></p><button id="closeSession" class="danger">Cerrar sesión</button></div>`; new QRCode(document.getElementById('qrcode'), {text:link,width:230,height:230}); document.getElementById('closeSession').onclick=async()=>{ await db.collection('sessions').doc(s.id).update({open:false}); alert('Sesión cerrada'); }; }
function listenRecords(sessionId){ if(unsubscribeRecords) unsubscribeRecords(); unsubscribeRecords=db.collection('attendance').where('sessionId','==',sessionId).onSnapshot(snap=>{ const rows=snap.docs.map(d=>d.data()).sort((a,b)=>(a.studentName||'').localeCompare(b.studentName||'')); document.getElementById('live').innerHTML=`<h3>Registros en vivo: ${rows.length}</h3><table><thead><tr><th>Fecha</th><th>Grupo</th><th>Nombre</th><th>Hora de llegada</th><th>Estado</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.date)}</td><td>${safe(r.group)}</td><td>${safe(r.studentName)}</td><td>${safe(r.time)}</td><td class="status-${String(r.status).toLowerCase()}">${safe(r.status)}</td></tr>`).join('')}</tbody></table>`; }); }
async function renderTeachers(){
  const profiles=await db.collection('profiles').get(); const groups=await getVisibleGroups(); const rows=profiles.docs.map(d=>({id:d.id,...d.data()}));
  viewEl().innerHTML=`<section class="card"><h1>Maestros</h1><p class="notice">Primero crea el usuario en Firebase Authentication. Después crea aquí su perfil con el mismo correo.</p><div class="grid"><div><h3>Nuevo perfil</h3><label>Nombre</label><input id="tname"><label>Correo del usuario creado en Firebase</label><input id="temail" type="email"><label>Rol</label><select id="trole"><option value="teacher">Maestro</option><option value="admin">Administrador</option></select><label>Grupos asignados</label><div><label class="row"><input type="checkbox" class="gcheck" value="*" style="width:auto"> Todos los grupos / todos los estudiantes</label>${groups.map(g=>`<label class="row"><input type="checkbox" class="gcheck" value="${safe(g.name)}" style="width:auto"> ${safe(g.name)}</label>`).join('')}</div><button id="saveTeacher">Guardar perfil</button></div><div><h3>Registrados</h3><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Grupos</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.name)}</td><td>${safe(r.email)}</td><td>${safe(r.role)}</td><td>${(r.groups||[]).map(g=>`<span class="pill">${g==='*'?'Todos':safe(g)}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div></div></section>`;
  document.getElementById('saveTeacher').onclick=async()=>{ const email=document.getElementById('temail').value.trim().toLowerCase(); const name=document.getElementById('tname').value.trim(); const role=document.getElementById('trole').value; let gr=[...document.querySelectorAll('.gcheck:checked')].map(x=>x.value); if(gr.includes('*')) gr=['*']; if(!email||!name){alert('Falta nombre o correo');return;} const authUsers=await db.collection('profiles').where('email','==',email).limit(1).get(); if(!authUsers.empty){alert('Ya existe un perfil con ese correo');return;} await db.collection('pendingProfiles').doc(email).set({name,email,role,groups:gr}); alert('Perfil pendiente creado. Cuando el maestro inicie sesión, presiona Vincular perfil pendiente si aparece.'); renderHome('teachers'); };
}
async function renderStudents(){ const groups=await getVisibleGroups(); const students=await getStudents(groups.map(g=>g.name)); viewEl().innerHTML=`<section class="card"><h1>Alumnos</h1><p>${students.length} alumnos cargados.</p><button id="seed">Recargar listas base</button><table><thead><tr><th>Grupo</th><th>Matrícula</th><th>Nombre</th><th>Sexo</th></tr></thead><tbody>${students.map(s=>`<tr><td>${safe(s.grupo)}</td><td>${safe(s.matricula)}</td><td>${safe(s.nombre)}</td><td>${safe(s.sexo)}</td></tr>`).join('')}</tbody></table></section>`; document.getElementById('seed').onclick=async()=>{ await seedInitialData(); alert('Listas recargadas'); renderHome('students'); }; }
async function renderReports(){ const groups=await getVisibleGroups(); viewEl().innerHTML=`<section class="card"><h1>Reportes</h1><div class="row"><select id="rgrp"><option value="">Todos</option>${groups.map(g=>`<option>${safe(g.name)}</option>`).join('')}</select><input id="rdate" type="date" value="${today()}"><button id="loadReport">Consultar</button><button id="csv" class="ghost">Exportar CSV</button><button id="pdf" class="ghost">Exportar PDF</button></div><div id="reportOut"></div></section>`; let last=[]; const load=async()=>{ const g=document.getElementById('rgrp').value; const d=document.getElementById('rdate').value; let q=db.collection('attendance').where('date','==',d); const snap=await q.get(); last=snap.docs.map(x=>({docId:x.id,...x.data()})).filter(r=>!g||r.group===g).sort((a,b)=>(a.group||'').localeCompare(b.group||'')||(a.studentName||'').localeCompare(b.studentName||'')); document.getElementById('reportOut').innerHTML=`<table><thead><tr><th>Fecha</th><th>Grupo</th><th>Nombre</th><th>Hora de llegada</th><th>Acción</th></tr></thead><tbody>${last.map(r=>`<tr><td>${safe(r.date)}</td><td>${safe(r.group)}</td><td>${safe(r.studentName)}</td><td>${safe(r.time)}</td><td><button class="danger small delRec" data-id="${safe(r.docId)}">Borrar</button></td></tr>`).join('')}</tbody></table>`; document.querySelectorAll('.delRec').forEach(btn=>btn.onclick=async()=>{ if(confirm('¿Borrar este registro de asistencia?')){ await db.collection('attendance').doc(btn.dataset.id).delete(); await load(); } }); }; document.getElementById('loadReport').onclick=load; document.getElementById('csv').onclick=()=>downloadCSV(last); document.getElementById('pdf').onclick=()=>exportPDF(last); }
function downloadCSV(rows){ const headers=['fecha','grupo','nombre','hora_de_llegada']; const csv=[headers.join(',')].concat(rows.map(r=>[r.date,r.group,r.studentName,r.time].map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(','))).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='asistencia.csv'; a.click(); }
function pdfHoraClass(r){
  const status = String(r.status || '').toLowerCase();
  // Verde: llegó dentro del tiempo adecuado. Amarillo: rebasó tolerancia pero aún se permite registro. Rojo: retardo/fuera de tiempo.
  if(status.includes('asistencia')) return 'hora-ok';
  if(status.includes('retardo')) return 'hora-alerta';
  if(status.includes('falta')) return 'hora-retardo';
  return 'hora-normal';
}

function exportPDF(rows){
  const title='Reporte de asistencia';
  const body=rows.map(r=>`<tr><td>${safe(r.date)}</td><td>${safe(r.group)}</td><td>${safe(r.studentName)}</td><td class="hora ${pdfHoraClass(r)}">${safe(r.time)}</td></tr>`).join('');
  const w=window.open('', '_blank');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:22px;margin:0 0 14px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #999;padding:7px;text-align:left}th{background:#eee}.hora{font-weight:700}.hora-ok{color:#188038}.hora-alerta{color:#f9ab00}.hora-retardo{color:#d93025}.hora-normal{color:#111}@media print{button{display:none}}</style></head><body><h1>${title}</h1><table><thead><tr><th>Fecha</th><th>Grupo</th><th>Nombre</th><th>Hora de llegada</th></tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
}
function renderSettings(){ viewEl().innerHTML=`<section class="card"><h1>Configuración</h1><p class="muted">Reglas recomendadas de Firestore para prueba segura:</p><pre style="white-space:pre-wrap;background:#f5f8fb;padding:12px;border-radius:12px">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}</pre></section>`; }

async function renderStudentSession(sessionId){
  setBadge('Registro de estudiante');
  const doc=await db.collection('sessions').doc(sessionId).get();
  if(!doc.exists){ appEl.innerHTML='<section class="card error"><h1>Sesión no encontrada</h1></section>'; return; }
  const s={id:doc.id,...doc.data()};
  if(!s.open){ appEl.innerHTML='<section class="card error"><h1>Sesión cerrada</h1><p>Esta asistencia ya no acepta registros.</p></section>'; return; }
  const students=await getStudents([s.grupo]);
  appEl.innerHTML=`<section class="card"><h1>Registrar asistencia</h1><p><strong>${safe(s.subject)}</strong> · Grupo ${safe(s.grupo)}</p><p class="muted">Inicio de clase: ${safe(s.classStartTime||'')}</p><p class="muted">Selecciona tu nombre o escribe tu matrícula.</p><label>Alumno</label><select id="studentSel"><option value="">Selecciona...</option>${students.map(st=>`<option value="${safe(st.id)}">${safe(st.nombre)} · ${safe(st.matricula)}</option>`).join('')}</select><label>Matrícula</label><input id="mat" placeholder="También puedes escribir tu matrícula"><button id="register">Registrar asistencia</button><div id="msg"></div></section>`;
  document.getElementById('register').onclick=async()=>{ let st=null; const id=document.getElementById('studentSel').value; const mat=document.getElementById('mat').value.trim(); if(id) st=students.find(x=>x.id===id); else st=students.find(x=>String(x.matricula)===mat); if(!st){ document.getElementById('msg').innerHTML='<p class="error">No se encontró el alumno en este grupo.</p>'; return;} const recId=s.id+'_'+st.id; const recRef=db.collection('attendance').doc(recId); const existing=await recRef.get(); if(existing.exists){ const r=existing.data(); document.getElementById('msg').innerHTML=`<p class="error">Ya existe un registro para ${safe(st.nombre)} en esta sesión. Hora registrada: ${safe(r.time||'')}</p>`; return; } const status=statusBySession(s); const arrival=nowTime(); await recRef.set({sessionId:s.id,studentId:st.id,studentName:st.nombre,matricula:st.matricula,group:st.grupo,date:s.date,time:arrival,status,subject:s.subject,teacherUid:s.teacherUid,teacherName:s.teacherName,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); document.getElementById('msg').innerHTML=`<p class="success">Registro realizado: ${safe(status)} · ${arrival}</p>`; };
}
function statusBySession(s){ const start=new Date(s.startISO); const mins=(Date.now()-start.getTime())/60000; if(mins <= Number(s.attendanceWindowMinutes||10)) return 'Asistencia'; if(mins <= Number(s.lateWindowMinutes||20)) return 'Retardo'; return 'Falta'; }

async function checkPendingProfile(){
  if(!currentUser || currentProfile) return;
}

window.addEventListener('load',()=>{ initFirebase(); const params=new URLSearchParams(location.search); const sid=params.get('session'); if(sid){ auth.onAuthStateChanged(async()=>{ if(!auth.currentUser) { // allow anonymous for student registration
      try{ await auth.signInAnonymously(); }catch(e){ console.error(e); }
    }
    renderStudentSession(sid);
  }); }});
