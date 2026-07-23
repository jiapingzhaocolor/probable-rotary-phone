(() => {
  'use strict';

  const STORAGE_KEY = 'shotlist-studio-replica-v2';
  const LEGACY_STORAGE_KEY = 'shotlist-studio-replica-v1';
  const DEFAULT_COLUMNS = ['select','status','image','scene','shot','description','shotSize','shotType','movement','equipment','lens','time','notes','menu'];
  const COLUMN_DEFS = {
    select:{label:'',className:'select-col',fixed:true},status:{label:'Status',className:'status-col'},image:{label:'Image',className:'image-col'},scene:{label:'Scene',className:'scene-col'},shot:{label:'Shot',className:'shot-col'},description:{label:'Description',className:'description-col'},shotSize:{label:'Shot Size',className:'shotSize-col'},shotType:{label:'Shot Type',className:'shotType-col'},movement:{label:'Movement',className:'movement-col'},equipment:{label:'Equipment',className:'equipment-col'},lens:{label:'Lens',className:'lens-col'},time:{label:'Est.',className:'time-col'},notes:{label:'Notes',className:'notes-col'},frameRate:{label:'Frame Rate',className:'frameRate-col'},subject:{label:'Subject',className:'subject-col'},menu:{label:'',className:'menu-col',fixed:true}
  };
  const OPTIONS = {
    shotSize:['ECU — Extreme Close-Up','CU — Close-Up','MCU — Medium Close-Up','MS — Medium Shot','MFS — Medium Full Shot','FS — Full Shot','WS — Wide Shot','EWS — Extreme Wide Shot','OTS — Over-the-Shoulder','POV — Point of View','2S — Two Shot','Insert'],
    shotType:['Single','Two Shot','Three Shot','Group Shot','Over-the-Shoulder','Point of View','Insert','Cutaway','Reaction','Master','Deep Focus','Shallow Focus'],
    movement:['Static','Pan','Tilt','Dolly','Push In','Pull Out','Tracking','Crane','Handheld','Steadicam','Zoom','Rack Focus','Whip Pan','Arc'],
    equipment:['Tripod','Sticks','Shoulder Rig','Gimbal','Steadicam','Handheld','Dolly','Slider','Jib','Crane','Drone','Car Mount']
  };
  const AVATAR_COLORS = ['#4c8ed7','#dc754c','#45a579','#8c68d8','#d36291','#b78032'];

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const deepClone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const svgFrame = (label, colors=['#829cc2','#d6b087','#465767']) => {
    const [a,b,c] = colors; const clean = String(label).replace(/[&<>]/g,'').slice(0,52);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="n"><feTurbulence baseFrequency=".75" numOctaves="3" seed="4" type="fractalNoise"/><feBlend mode="soft-light" in2="SourceGraphic"/></filter></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="480" cy="104" r="52" fill="#fff" opacity=".68"/><path d="M0 270 Q115 205 235 260 T470 252 T640 225 V360H0Z" fill="#152b35" opacity=".78"/><path d="M0 295 Q145 252 320 305 T640 268 V360H0Z" fill="#091a22" opacity=".68"/><rect width="640" height="360" filter="url(#n)" opacity=".16"/><text x="28" y="42" fill="#fff" font-family="Arial" font-size="18" font-weight="700">${clean}</text><text x="28" y="66" fill="#fff" opacity=".75" font-family="Arial" font-size="11">REFERENCE FRAME</text></svg>`)}`;
  };
  const formatTime = time => { if(!time)return''; const [h,m]=String(time).split(':').map(Number); if(Number.isNaN(h)||Number.isNaN(m))return time; return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'pm':'am'}`; };
  const estimateMinutes = value => { if(!value)return 0; const text=String(value); const h=/([\d.]+)\s*h/i.exec(text); const m=/([\d.]+)\s*m/i.exec(text); return Math.max(0,Math.round((h?parseFloat(h[1])*60:0)+(m?parseFloat(m[1]):(!h&&/^\d+$/.test(text.trim())?parseInt(text,10):0)))); };
  const formatMinutes = mins => mins>=60?`${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:''}`:`${mins}m`;
  const slug = text => String(text||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project';
  const initials = name => String(name||'User').split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase();

  function demoScenes(){
    return [
      {id:'scene-1',number:'1',heading:'EXT. RIVER - DAY',notes:'Golden-hour exterior. Prioritise the final wide.',breakdown:['Maya','Hugo','Fox','River bank','Practical leaves'],items:[
        {id:'shot-1',type:'shot',complete:false,selected:false,image:svgFrame('MAYA LOOKS AT THE FOX',['#84c8bf','#d8c890','#547664']),scene:'1',shot:'11',subject:'Maya',description:'MAYA looks at the fox',shotSize:'CU — Close-Up',shotType:'Single',movement:'Dolly',equipment:'Dolly',lens:'18mm',time:'10m',frameRate:'24 fps',notes:'Soft backlight; hold for the reaction.'},
        {id:'shot-2',type:'shot',complete:false,selected:false,image:svgFrame('THE FOX LOOKS BACK',['#d8874b','#ede0bf','#526d64']),scene:'1',shot:'12',subject:'Fox',description:'The fox looks back at MAYA',shotSize:'CU — Close-Up',shotType:'Reaction',movement:'Dolly',equipment:'Dolly',lens:'85mm',time:'12m',frameRate:'24 fps',notes:'Eyeline should match shot 11.'},
        {id:'setup-1',type:'setup',label:'End of Setup 1',start:'08:00',end:'10:30',notes:'Move dolly track to south bank.'},
        {id:'shot-3',type:'shot',complete:false,selected:false,image:svgFrame('MAYA REVERSES THE SPELL',['#7bc1c7','#d6d19e','#315766']),scene:'1',shot:'14',subject:'Maya',description:'MAYA reverses the spell',shotSize:'WS — Wide Shot',shotType:'Master',movement:'Steadicam',equipment:'Steadicam',lens:'50mm',time:'20m',frameRate:'48 fps',notes:'Practical wind and leaf effects.'},
        {id:'banner-1',type:'banner',label:'Meal Break — 12:00 pm to 1:00 pm',style:'indigo'},
        {id:'shot-4',type:'shot',complete:false,selected:false,image:svgFrame('HUGO LOOKS LOVINGLY',['#e6c1a0','#8ebfbb','#526b72']),scene:'1',shot:'15',subject:'Hugo',description:'HUGO looks lovingly at MAYA',shotSize:'OTS — Over-the-Shoulder',shotType:'Over-the-Shoulder',movement:'Static',equipment:'Tripod',lens:'35mm',time:'8m',frameRate:'24 fps',notes:'Keep Maya soft in foreground.'},
        {id:'shot-5',type:'shot',complete:false,selected:false,image:svgFrame('HUGO TWIRLS MAYA',['#e6c8a7','#8fbcb9','#4d6870']),scene:'1',shot:'16',subject:'Hugo & Maya',description:'HUGO twirls MAYA and kisses her',shotSize:'MCU — Medium Close-Up',shotType:'Two Shot',movement:'Handheld',equipment:'Shoulder Rig',lens:'28mm',time:'15m',frameRate:'24 fps',notes:'Two full rotations, then settle.'},
        {id:'setup-2',type:'setup',label:'End of Setup 2',start:'13:00',end:'15:30',notes:'Reset for drone unit.'},
        {id:'shot-6',type:'shot',complete:false,selected:false,image:svgFrame('THEY WALK DOWNRIVER',['#80b1a7','#d7ca9f','#3f6656']),scene:'1',shot:'17',subject:'Hugo & Maya',description:'HUGO and MAYA walk downriver together',shotSize:'EWS — Extreme Wide Shot',shotType:'Master',movement:'Tracking',equipment:'Drone',lens:'24mm',time:'25m',frameRate:'24 fps',notes:'Golden-hour priority.'}
      ]},
      {id:'scene-2',number:'2',heading:'INT. CABIN - NIGHT',notes:'Firelight continuity throughout.',breakdown:['Maya','Hugo','Fireplace','Hero diary'],items:[
        {id:'shot-7',type:'shot',complete:false,selected:false,image:svgFrame('FIRELIGHT MASTER',['#b74b37','#f0a649','#261f29']),scene:'2',shot:'1',subject:'Maya & Hugo',description:'MAYA and HUGO sit by the fire',shotSize:'WS — Wide Shot',shotType:'Master',movement:'Static',equipment:'Tripod',lens:'32mm',time:'18m',frameRate:'24 fps',notes:'Fire practical at 50%; negative fill camera left.'},
        {id:'shot-8',type:'shot',complete:false,selected:false,image:svgFrame('MAYA CLOSE-UP',['#762f48','#c7644f','#252239']),scene:'2',shot:'2',subject:'Maya',description:'MAYA reveals what happened in the forest',shotSize:'CU — Close-Up',shotType:'Single',movement:'Push In',equipment:'Slider',lens:'75mm',time:'12m',frameRate:'24 fps',notes:'Subtle slider move over final sentence.'}
      ]},
      {id:'scene-3',number:'3',heading:'EXT. MOUNTAIN ROAD - DAWN',notes:'',breakdown:[],items:[]}
    ];
  }

  function defaultState(){
    return {
      schemaVersion:2,projectName:'The Girl and the Fox',activeModule:'shotlist',activeListId:'list-1',activeSceneId:'scene-1',viewMode:'list',search:'',filter:'all',visibleColumns:[...DEFAULT_COLUMNS],scriptNotes:'FADE IN:\n\nEXT. RIVER - DAY\n\nMAYA sees the fox across the water. The forest goes quiet.',
      profile:{name:'Jordan Wells',role:'Director'},collaborators:[{id:'person-1',name:'Jordan Wells',role:'Director',color:'#4c8ed7'},{id:'person-2',name:'Avery Chen',role:'Cinematographer',color:'#dc754c'},{id:'person-3',name:'Sam Rivera',role:'1st AD',color:'#45a579'}],
      settings:{defaultLens:'50mm',defaultFrameRate:'24 fps',defaultShotTime:'10m',autoNumberShots:true},
      moodboard:[
        {id:'mood-1',image:svgFrame('RIVER PALETTE',['#6ea6a7','#e2c88f','#2f5457']),caption:'Cool river tones with warm skin and late-afternoon highlights.'},
        {id:'mood-2',image:svgFrame('CABIN FIRELIGHT',['#7a2935','#df8242','#221d2c']),caption:'Low-key firelight, deep falloff, and practical motivated sources.'}
      ],
      shotLists:[{id:'list-1',name:'Master Shot List',productionDate:'',callTime:'08:00',scenes:demoScenes()}]
    };
  }

  function sanitizeItem(item, sceneNumber){
    if(!item||typeof item!=='object')return null;
    const type=['shot','setup','banner'].includes(item.type)?item.type:'shot';
    if(type==='shot')return {id:item.id||uid('shot'),type:'shot',complete:Boolean(item.complete),selected:Boolean(item.selected),image:item.image||svgFrame(item.description||'SHOT'),scene:String(item.scene??sceneNumber??''),shot:String(item.shot??''),subject:String(item.subject??''),description:String(item.description||'Untitled shot'),shotSize:String(item.shotSize||OPTIONS.shotSize[3]),shotType:String(item.shotType||OPTIONS.shotType[0]),movement:String(item.movement||OPTIONS.movement[0]),equipment:String(item.equipment||OPTIONS.equipment[0]),lens:String(item.lens||''),time:String(item.time||''),frameRate:String(item.frameRate||''),notes:String(item.notes||'')};
    if(type==='setup')return {id:item.id||uid('setup'),type:'setup',label:String(item.label||'End of Setup'),start:String(item.start||''),end:String(item.end||''),notes:String(item.notes||'')};
    return {id:item.id||uid('banner'),type:'banner',label:String(item.label||'Production Break'),style:['indigo','slate','green','red'].includes(item.style)?item.style:'indigo'};
  }

  function sanitizeState(raw){
    const fallback=defaultState();
    if(!raw||typeof raw!=='object')return fallback;
    let source=raw;
    if(!Array.isArray(source.shotLists)&&Array.isArray(source.scenes)){
      source={...source,schemaVersion:2,activeListId:'list-imported',shotLists:[{id:'list-imported',name:'Imported Shot List',productionDate:'',callTime:'08:00',scenes:source.scenes}]};
    }
    const next={...fallback,...source,schemaVersion:2};
    next.settings={...fallback.settings,...(source.settings||{})};
    next.profile={...fallback.profile,...(source.profile||{})};
    next.collaborators=Array.isArray(source.collaborators)&&source.collaborators.length?source.collaborators.map((p,index)=>({id:p.id||uid('person'),name:String(p.name||`Collaborator ${index+1}`),role:String(p.role||''),color:p.color||AVATAR_COLORS[index%AVATAR_COLORS.length]})):fallback.collaborators;
    next.moodboard=Array.isArray(source.moodboard)?source.moodboard.filter(Boolean).map(m=>({id:m.id||uid('mood'),image:m.image||svgFrame('MOOD FRAME'),caption:String(m.caption||'')})):fallback.moodboard;
    next.shotLists=Array.isArray(source.shotLists)&&source.shotLists.length?source.shotLists.filter(Boolean).map((list,listIndex)=>{
      const scenes=Array.isArray(list.scenes)&&list.scenes.length?list.scenes.map((scene,sceneIndex)=>{
        const number=String(scene.number??sceneIndex+1); const items=Array.isArray(scene.items)?scene.items.map(i=>sanitizeItem(i,number)).filter(Boolean):[];
        return {id:scene.id||uid('scene'),number,heading:String(scene.heading||'INT. NEW LOCATION - DAY'),notes:String(scene.notes||''),breakdown:Array.isArray(scene.breakdown)?scene.breakdown.map(String):[],items};
      }):[{id:uid('scene'),number:'1',heading:'INT. NEW LOCATION - DAY',notes:'',breakdown:[],items:[]}];
      return {id:list.id||uid('list'),name:String(list.name||`Shot List ${listIndex+1}`),productionDate:String(list.productionDate||''),callTime:String(list.callTime||'08:00'),scenes};
    }):fallback.shotLists;
    const validColumns=(Array.isArray(source.visibleColumns)?source.visibleColumns:DEFAULT_COLUMNS).filter(c=>COLUMN_DEFS[c]);
    next.visibleColumns=normalizeColumns(validColumns);
    next.activeModule=['shotlist','storyboard','moodboard'].includes(source.activeModule)?source.activeModule:'shotlist';
    next.viewMode=['list','board'].includes(source.viewMode)?source.viewMode:'list';
    next.filter=['all','incomplete','complete','selected'].includes(source.filter)?source.filter:'all';
    next.search=String(source.search||'');
    if(!next.shotLists.some(l=>l.id===next.activeListId))next.activeListId=next.shotLists[0].id;
    const list=next.shotLists.find(l=>l.id===next.activeListId)||next.shotLists[0];
    if(!list.scenes.some(s=>s.id===next.activeSceneId))next.activeSceneId=list.scenes[0].id;
    return next;
  }

  function normalizeColumns(columns){
    const optional=[...new Set(columns.filter(c=>COLUMN_DEFS[c]&&!COLUMN_DEFS[c].fixed))];
    return ['select',...optional,'menu'];
  }

  function loadState(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw?sanitizeState(JSON.parse(raw)):defaultState();
    }catch(error){ console.warn('Could not load saved project',error); return defaultState(); }
  }

  let state=loadState();
  let undoStack=[]; let redoStack=[]; let toastTimer=null;
  let editingShotId=null,editingSetupId=null,editingBannerId=null,editingSceneId=null;
  let pendingShotImageData=''; let pendingImageTarget=null; let dragged=null; let dropAfter=false;
  let utilityMode=null; let moveContext=null; let promptResolver=null; let confirmResolver=null;

  function currentList(){ return state.shotLists.find(l=>l.id===state.activeListId)||state.shotLists[0]; }
  function currentScene(){ const list=currentList(); return list?.scenes.find(s=>s.id===state.activeSceneId)||list?.scenes[0]; }
  function shotItems(scene=currentScene()){ return scene?scene.items.filter(i=>i.type==='shot'):[]; }
  function findItem(id, scene=currentScene()){ return scene?.items.find(i=>i.id===id); }
  function findScene(id){ return currentList()?.scenes.find(s=>s.id===id); }
  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); return true; }
    catch(error){ console.warn('Save failed',error); showToast('Local save is full. Export a backup or remove large images.'); return false; }
  }
  function commit(mutator,message){
    const before=deepClone(state);
    try{ mutator(); state=sanitizeState(state); }
    catch(error){ state=before; console.error(error); showToast('That change could not be completed'); return; }
    undoStack.push(before); if(undoStack.length>80)undoStack.shift(); redoStack=[]; saveState(); render(); if(message)showToast(message);
  }
  function uiUpdate(mutator){ mutator(); state=sanitizeState(state); saveState(); render(); }
  function undo(){ if(!undoStack.length)return showToast('Nothing to undo'); redoStack.push(deepClone(state)); state=undoStack.pop(); saveState(); render(); showToast('Undone'); }
  function redo(){ if(!redoStack.length)return showToast('Nothing to redo'); undoStack.push(deepClone(state)); state=redoStack.pop(); saveState(); render(); showToast('Redone'); }
  function showToast(message){ const toast=$('#toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2200); }

  function render(){
    const list=currentList(); const scene=currentScene(); if(!list||!scene)return;
    $('#projectNameButton').textContent=state.projectName;
    $('#sceneNumberButton').textContent=scene.number; $('#sceneHeadingButton').textContent=scene.heading;
    $('#sceneTitleText').textContent=`Sc. ${scene.number} | ${scene.heading}`;
    $('#searchInput').value=state.search; $('#filterSelector').value=state.filter;
    $('#undoButton').disabled=!undoStack.length; $('#redoButton').disabled=!redoStack.length;
    $$('.module-tab').forEach(button=>button.classList.toggle('active',button.dataset.module===state.activeModule));
    $('#listViewButton').classList.toggle('active',state.viewMode==='list'); $('#boardViewButton').classList.toggle('active',state.viewMode==='board');
    $('#panelToggle').classList.toggle('active',!$('#scenePanel').classList.contains('collapsed'));
    renderListSelector(); renderSceneList(); renderCollaboratorAvatars();
    const filtered=getFilteredItems(scene); const shots=shotItems(scene); const completed=shots.filter(s=>s.complete).length; const totalMin=shots.reduce((sum,s)=>sum+estimateMinutes(s.time),0);
    $('#itemCount').textContent=`${scene.items.length} items`; $('#sceneStats').textContent=`${shots.length} Shots${completed?` · ${completed} complete`:''}${totalMin?` · ${formatMinutes(totalMin)}`:''}`;
    const isMood=state.activeModule==='moodboard'; const isStoryboard=state.activeModule==='storyboard'; const isShotlist=state.activeModule==='shotlist';
    $('#shotToolbar').classList.toggle('hidden',isMood); $('#scenePanel').classList.toggle('hidden',isMood); $('#sceneTitleRow').classList.toggle('hidden',isMood);
    $('.view-switch').classList.toggle('hidden',!isShotlist); $('#columnsButton').classList.toggle('hidden',!isShotlist);
    $('#tableView').classList.add('hidden'); $('#boardView').classList.add('hidden'); $('#auxView').classList.add('hidden'); $('#emptyState').classList.add('hidden');
    renderBulkBar();
    if(isMood){ $('#bulkBar').classList.add('hidden'); renderMoodboard(); $('#auxView').classList.remove('hidden'); }
    else if(isStoryboard){ $('#bulkBar').classList.add('hidden'); renderStoryboard(filtered); $('#auxView').classList.remove('hidden'); }
    else if(!filtered.length){ renderEmpty(scene); $('#emptyState').classList.remove('hidden'); }
    else if(state.viewMode==='board'){ renderBoard(filtered); $('#boardView').classList.remove('hidden'); }
    else{ renderTable(filtered); $('#tableView').classList.remove('hidden'); }
    renderColumnOptions();
  }

  function renderListSelector(){
    const select=$('#listSelector'); select.innerHTML=state.shotLists.map(list=>`<option value="${escapeHtml(list.id)}" ${list.id===state.activeListId?'selected':''}>${escapeHtml(list.name)}</option>`).join('');
  }
  function renderCollaboratorAvatars(){
    const people=state.collaborators.slice(0,3); $('#collaboratorsButton').innerHTML=people.map(person=>`<span class="avatar" style="background:${escapeHtml(person.color)}" title="${escapeHtml(person.name)} — ${escapeHtml(person.role)}">${escapeHtml(initials(person.name))}</span>`).join('');
    $('#profileButton').textContent=initials(state.profile.name); $('#profileButton').title=`${state.profile.name} — ${state.profile.role}`;
  }
  function renderSceneList(){
    const list=currentList(); $('#sceneList').innerHTML=list.scenes.map(scene=>{const shots=shotItems(scene),done=shots.filter(s=>s.complete).length;return `<div class="scene-card ${scene.id===state.activeSceneId?'active':''}" draggable="true" data-scene-id="${scene.id}"><div class="scene-card-top"><span class="scene-drag" draggable="true" title="Drag scene">◉</span><span>SC. ${escapeHtml(scene.number)}</span></div><div class="scene-card-heading">${escapeHtml(scene.heading)}</div><div class="scene-card-meta">${shots.length} shot${shots.length===1?'':'s'}${done?` · ${done} done`:''}</div><button class="scene-card-menu" data-scene-menu="${scene.id}" title="Scene actions">⋮</button></div>`}).join('');
  }
  function getFilteredItems(scene){
    const q=state.search.trim().toLowerCase();
    return scene.items.filter(item=>{
      if(item.type==='shot'){
        if(state.filter==='complete'&&!item.complete)return false; if(state.filter==='incomplete'&&item.complete)return false; if(state.filter==='selected'&&!item.selected)return false;
      }else if(state.filter!=='all')return false;
      if(!q)return true; return Object.values(item).some(value=>typeof value==='string'&&value.toLowerCase().includes(q));
    });
  }
  function getGridTemplate(){ const widths={select:'34px',status:'38px',image:'112px',scene:'60px',shot:'64px',description:'minmax(220px,1.65fr)',shotSize:'95px',shotType:'118px',movement:'108px',equipment:'105px',lens:'88px',time:'80px',notes:'155px',frameRate:'90px',subject:'110px',menu:'35px'}; return state.visibleColumns.map(c=>widths[c]).join(' '); }
  function renderTable(items){
    const shots=items.filter(i=>i.type==='shot'); const all=shots.length&&shots.every(s=>s.selected); const some=shots.some(s=>s.selected)&&!all;
    const header=`<div class="table-header" style="grid-template-columns:${getGridTemplate()}">${state.visibleColumns.map(col=>col==='select'?`<div class="table-cell ${COLUMN_DEFS[col].className}"><input class="header-check" type="checkbox" ${all?'checked':''} aria-label="Select all visible shots"></div>`:`<div class="table-cell ${COLUMN_DEFS[col].className}">${escapeHtml(COLUMN_DEFS[col].label)}</div>`).join('')}</div>`;
    $('#shotTable').style.setProperty('--grid-template',getGridTemplate()); $('#shotTable').innerHTML=header+items.map(renderItemRow).join(''); const box=$('.header-check'); if(box)box.indeterminate=some;
  }
  function renderItemRow(item){
    if(item.type==='setup')return `<div class="setup-row special-row" draggable="true" data-item-id="${item.id}"><div class="grip" draggable="true" title="Drag setup">≡</div><div class="setup-label">${escapeHtml(item.label)}${item.start||item.end?` — ${formatTime(item.start)} to ${formatTime(item.end)}`:''}${item.notes?`<span class="setup-note">${escapeHtml(item.notes)}</span>`:''}</div><div class="row-actions"><button class="special-menu-button" data-id="${item.id}" title="Setup actions">•••</button></div></div>`;
    if(item.type==='banner')return `<div class="banner-row ${escapeHtml(item.style||'indigo')} special-row" draggable="true" data-item-id="${item.id}"><span class="banner-icon" draggable="true" title="Drag banner">●</span><span>${escapeHtml(item.label)}</span><div class="row-actions"><button class="special-menu-button" data-id="${item.id}" title="Banner actions">•••</button></div></div>`;
    return `<div class="shot-row ${item.selected?'selected':''} ${item.complete?'completed':''}" draggable="true" data-item-id="${item.id}" style="grid-template-columns:${getGridTemplate()}">${state.visibleColumns.map(col=>renderCell(item,col)).join('')}</div>`;
  }
  function renderCell(item,col){ const c=COLUMN_DEFS[col].className;
    switch(col){
      case'select':return `<div class="table-cell ${c} drag-handle" draggable="true"><input class="row-check" data-id="${item.id}" type="checkbox" ${item.selected?'checked':''} aria-label="Select shot ${escapeHtml(item.shot)}"><span title="Drag to reorder">⋮⋮</span></div>`;
      case'status':return `<div class="table-cell ${c}"><button class="status-dot ${item.complete?'complete':''}" data-id="${item.id}" title="${item.complete?'Mark incomplete':'Mark complete'}">${item.complete?'✓':''}</button></div>`;
      case'image':return `<div class="table-cell ${c} image-cell"><img class="shot-thumb" src="${item.image||svgFrame('ADD REFERENCE')}" alt="Reference for shot ${escapeHtml(item.shot)}"><button class="image-overlay" data-id="${item.id}">Replace</button></div>`;
      case'scene':case'shot':return `<div class="table-cell ${c} number-cell editable-cell" data-edit-field="${col}" data-id="${item.id}">${escapeHtml(item[col])}</div>`;
      case'description':return `<div class="table-cell ${c} editable-cell" data-edit-field="description" data-id="${item.id}"><div class="description-wrap"><span class="description-main">${escapeHtml(item.description)}</span>${item.subject?`<span class="description-sub">${escapeHtml(item.subject)}</span>`:''}</div></div>`;
      case'subject':case'lens':case'time':case'frameRate':return `<div class="table-cell ${c} editable-cell spec-cell" data-edit-field="${col}" data-id="${item.id}">${escapeHtml(item[col]||'—')}</div>`;
      case'shotSize':case'shotType':case'movement':case'equipment':return `<div class="table-cell ${c} spec-cell" data-spec-field="${col}" data-id="${item.id}">${escapeHtml(item[col]||'—')}</div>`;
      case'notes':return `<div class="table-cell ${c} editable-cell notes-cell" data-edit-field="notes" data-id="${item.id}">${escapeHtml(item.notes||'—')}</div>`;
      case'menu':return `<div class="table-cell ${c} row-menu"><button class="row-menu-button" data-id="${item.id}" title="Shot actions">⋮</button></div>`;
      default:return'';
    }
  }
  function renderBoard(items){
    $('#boardView').innerHTML=items.map(item=>{
      if(item.type==='setup')return `<div class="board-divider setup" draggable="true" data-item-id="${item.id}"><span class="board-drag" draggable="true">${escapeHtml(item.label)}${item.start||item.end?` — ${formatTime(item.start)} to ${formatTime(item.end)}`:''}</span><button class="card-menu special-menu-button" data-id="${item.id}">⋮</button></div>`;
      if(item.type==='banner')return `<div class="board-divider banner" draggable="true" data-item-id="${item.id}"><span class="board-drag" draggable="true">${escapeHtml(item.label)}</span><button class="card-menu special-menu-button" data-id="${item.id}">⋮</button></div>`;
      return `<article class="board-card ${item.complete?'completed':''}" draggable="true" data-item-id="${item.id}"><img class="board-card-image" data-id="${item.id}" src="${item.image||svgFrame('ADD REFERENCE')}" alt="Reference frame"><div class="board-card-body"><div class="board-card-kicker board-drag" draggable="true"><span>Scene ${escapeHtml(item.scene)} · Shot ${escapeHtml(item.shot)}</span><span class="board-card-tools"><button class="status-dot ${item.complete?'complete':''}" data-id="${item.id}">${item.complete?'✓':''}</button><button class="card-menu row-menu-button" data-id="${item.id}">⋮</button></span></div><h3 data-edit-field="description" data-id="${item.id}" class="editable-cell">${escapeHtml(item.description)}</h3><div class="board-card-specs"><span>${escapeHtml(item.shotSize)}</span><span>${escapeHtml(item.movement)}</span><span>${escapeHtml(item.lens)}</span><span>${escapeHtml(item.time)}</span></div></div></article>`;
    }).join('');
  }
  function renderStoryboard(items){
    const shots=items.filter(i=>i.type==='shot'); const scene=currentScene();
    $('#auxView').innerHTML=`<div class="aux-header"><div><h2>Storyboard · Sc. ${escapeHtml(scene.number)}</h2><p>Arrange reference frames in shooting order. Edits stay synced with the shot list.</p></div><button class="primary-button" data-add-shot>＋ Add Shot</button></div><div class="story-grid">${shots.length?shots.map(item=>`<article class="story-card ${item.complete?'completed':''}" draggable="true" data-item-id="${item.id}"><span class="story-number">${escapeHtml(item.scene)}.${escapeHtml(item.shot)}</span><button class="story-image-button" data-shot-image="${item.id}"><img src="${item.image||svgFrame('ADD REFERENCE')}" alt="Shot ${escapeHtml(item.shot)} reference"></button><div class="story-card-body"><h3 class="editable-cell" data-edit-field="description" data-id="${item.id}">${escapeHtml(item.description)}</h3><p>${escapeHtml(item.shotSize)} · ${escapeHtml(item.shotType)} · ${escapeHtml(item.movement)} · ${escapeHtml(item.lens)}</p><div class="story-tools story-drag" draggable="true"><span class="mini-meta">${escapeHtml(item.subject||'No subject')} · ${escapeHtml(item.time||'No estimate')}</span><span><button class="status-dot ${item.complete?'complete':''}" data-id="${item.id}">${item.complete?'✓':''}</button><button class="card-menu row-menu-button" data-id="${item.id}">⋮</button></span></div></div></article>`).join(''):`<div class="aux-empty"><div class="empty-icon">▦</div><h3>No storyboard frames</h3><p>Add shots to this scene to build the storyboard.</p><button class="primary-button" data-add-shot>＋ Add Shot</button></div>`}</div>`;
  }
  function renderMoodboard(){
    $('#auxView').innerHTML=`<div class="aux-header"><div><h2>Project Mood Board</h2><p>Upload references, add captions, and drag cards into a preferred order.</p></div><button class="primary-button" id="addMoodImagesButton">＋ Add Images</button></div><div class="mood-grid">${state.moodboard.length?state.moodboard.map((item,index)=>`<article class="mood-card" draggable="true" data-mood-id="${item.id}"><img src="${item.image||svgFrame('MOOD FRAME')}" alt="Mood board reference ${index+1}"><div class="mood-card-body"><div class="mood-caption editable-cell" data-edit-mood="${item.id}">${escapeHtml(item.caption||'Add a caption')}</div><div class="mood-tools mood-drag" draggable="true"><span class="mini-meta">Frame ${index+1}</span><span><button class="card-menu" data-replace-mood="${item.id}" title="Replace image">↥</button><button class="card-menu" data-delete-mood="${item.id}" title="Delete image">⌫</button></span></div></div></article>`).join(''):`<div class="aux-empty"><div class="empty-icon">▥</div><h3>No mood references yet</h3><p>Add visual references for palette, lighting, composition, wardrobe, or locations.</p><button class="primary-button" id="addMoodImagesButton">＋ Add Images</button></div>`}</div>`;
  }
  function renderEmpty(scene){
    const hasQuery=Boolean(state.search.trim())||state.filter!=='all'; $('#emptyTitle').textContent=hasQuery?'No matching shots':'No shots yet'; $('#emptyMessage').textContent=hasQuery?'Change the search or filter to see more items.':'Build this scene one shot at a time.'; $('#emptyAddButton').textContent=hasQuery?'Clear search and filters':'＋ Add Shot'; $('#emptyAddButton').dataset.action=hasQuery?'clear-filter':'add-shot';
  }
  function renderBulkBar(){
    const selected=shotItems().filter(s=>s.selected); $('#bulkBar').classList.toggle('hidden',!selected.length||state.activeModule!=='shotlist'); $('#bulkCount').textContent=`${selected.length} selected`;
  }
  function renderColumnOptions(){
    const allOptional=Object.keys(COLUMN_DEFS).filter(c=>!COLUMN_DEFS[c].fixed); const ordered=[...state.visibleColumns.filter(c=>!COLUMN_DEFS[c]?.fixed),...allOptional.filter(c=>!state.visibleColumns.includes(c))];
    $('#columnOptions').innerHTML=ordered.map((col,index)=>`<label class="column-option"><input type="checkbox" data-column="${col}" ${state.visibleColumns.includes(col)?'checked':''}><span>${escapeHtml(COLUMN_DEFS[col].label)}</span><span class="column-controls"><button type="button" data-column-move="up" data-column-id="${col}" ${index===0?'disabled':''}>↑</button><button type="button" data-column-move="down" data-column-id="${col}" ${index===ordered.length-1?'disabled':''}>↓</button></span></label>`).join('');
  }

  function beginInlineEdit(cell){
    if(cell.querySelector('input,textarea'))return;
    if(cell.dataset.editMood){
      const item=state.moodboard.find(m=>m.id===cell.dataset.editMood); if(!item)return; beginEditor(cell,item.caption||'',true,value=>commit(()=>item.caption=value,'Mood caption updated')); return;
    }
    const item=findItem(cell.dataset.id); const field=cell.dataset.editField; if(!item||!field)return; const multiline=['description','notes'].includes(field); beginEditor(cell,item[field]||'',multiline,value=>{ commit(()=>{const current=findItem(item.id);if(current)current[field]=value},'Shot updated'); });
  }
  function beginEditor(cell,old,multiline,onSave){
    const input=document.createElement(multiline?'textarea':'input'); input.className='inline-input'; input.value=old; if(multiline)input.rows=3; cell.innerHTML=''; cell.appendChild(input); input.focus(); input.select(); let finished=false;
    const finish=save=>{if(finished)return;finished=true;if(save&&input.value!==old)onSave(input.value);else render()}; input.addEventListener('blur',()=>finish(true)); input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();finish(false)}if(event.key==='Enter'&&(!multiline||event.ctrlKey||event.metaKey)){event.preventDefault();finish(true)}});
  }
  function openSpecPopover(target,id,field){
    closePopover(); const item=findItem(id); if(!item)return; const rect=target.getBoundingClientRect(); const pop=document.createElement('div'); pop.className='popover'; positionPopover(pop,rect,310,395); pop.innerHTML=`<h4>${escapeHtml(COLUMN_DEFS[field].label)}</h4><div class="popover-grid">${OPTIONS[field].map(option=>`<button class="popover-option ${item[field]===option?'selected':''}" data-spec-value="${escapeHtml(option)}" data-id="${id}" data-field="${field}"><span class="radio"></span><span>${escapeHtml(option)}</span></button>`).join('')}</div>`; $('#popoverLayer').appendChild(pop);
  }
  function positionPopover(pop,rect,width=205,height=340){ pop.style.left=`${Math.max(8,Math.min(rect.right-width,innerWidth-width-8))}px`; pop.style.top=`${Math.max(8,Math.min(rect.bottom+4,innerHeight-height-8))}px`; }
  function openMenu(target,items,context={}){ closePopover(); const rect=target.getBoundingClientRect(); const pop=document.createElement('div'); pop.className='popover menu-popover'; Object.entries(context).forEach(([key,value])=>pop.dataset[key]=value); positionPopover(pop,rect,205,340); pop.innerHTML=items.map(item=>item.separator?'<div class="menu-separator"></div>':`<button class="${item.danger?'danger':''}" data-action="${item.action}"><span>${item.icon||''}</span>${escapeHtml(item.label)}</button>`).join(''); $('#popoverLayer').appendChild(pop); return pop; }
  function closePopover(){ $('#popoverLayer').innerHTML=''; }

  function updateItem(id,field,value,message){ commit(()=>{const item=findItem(id);if(item)item[field]=value},message); }
  function nextShotNumber(scene=currentScene()){ const nums=shotItems(scene).map(s=>parseInt(s.shot,10)).filter(Number.isFinite); return String(nums.length?Math.max(...nums)+1:1); }
  function openShotDialog(id=null,afterId=null){
    editingShotId=id; const item=id?findItem(id):null; const defaults=state.settings; const number=item?.shot||(defaults.autoNumberShots?nextShotNumber():''); pendingShotImageData=item?.image||svgFrame(`SHOT ${number}`); $('#shotDialogTitle').textContent=item?`Edit Shot ${item.shot}`:'Add Shot'; fillSelects(item||{}); $('#formScene').value=item?.scene||currentScene().number; $('#formShotNumber').value=number; $('#formDescription').value=item?.description||''; $('#formSubject').value=item?.subject||''; $('#formTime').value=item?.time||defaults.defaultShotTime; $('#formLens').value=item?.lens||defaults.defaultLens; $('#formFrameRate').value=item?.frameRate||defaults.defaultFrameRate; $('#formNotes').value=item?.notes||''; $('#formImagePreview').src=pendingShotImageData; $('#shotDialog').dataset.afterId=afterId||''; $('#shotDialog').showModal(); setTimeout(()=>$('#formDescription').focus(),30);
  }
  function fillSelects(item={}){ [['formShotSize','shotSize'],['formShotType','shotType'],['formMovement','movement'],['formEquipment','equipment']].forEach(([id,field])=>{$(`#${id}`).innerHTML=OPTIONS[field].map(option=>`<option value="${escapeHtml(option)}" ${item[field]===option?'selected':''}>${escapeHtml(option)}</option>`).join('')}); }
  function saveShotFromForm(){
    const scene=currentScene(); const payload={image:pendingShotImageData||svgFrame($('#formDescription').value||'SHOT'),scene:$('#formScene').value.trim()||scene.number,shot:$('#formShotNumber').value.trim()||(state.settings.autoNumberShots?nextShotNumber(scene):''),description:$('#formDescription').value.trim()||'Untitled shot',subject:$('#formSubject').value.trim(),time:$('#formTime').value.trim(),shotSize:$('#formShotSize').value,shotType:$('#formShotType').value,movement:$('#formMovement').value,equipment:$('#formEquipment').value,lens:$('#formLens').value.trim(),frameRate:$('#formFrameRate').value.trim(),notes:$('#formNotes').value.trim()};
    if(editingShotId)commit(()=>Object.assign(findItem(editingShotId),payload),'Shot updated');
    else{ const shot={id:uid('shot'),type:'shot',complete:false,selected:false,...payload}; const afterId=$('#shotDialog').dataset.afterId; commit(()=>{const index=afterId?scene.items.findIndex(i=>i.id===afterId):-1;if(index>=0)scene.items.splice(index+1,0,shot);else scene.items.push(shot)},'Shot added'); }
    editingShotId=null; pendingShotImageData='';
  }
  function openSetupDialog(id=null){ editingSetupId=id; const item=id?findItem(id):null; $('#setupDialogTitle').textContent=item?'Edit Setup Marker':'Add Setup Marker'; $('#setupName').value=item?.label||'End of Setup'; $('#setupStart').value=item?.start||'08:00'; $('#setupEnd').value=item?.end||'10:30'; $('#setupNotes').value=item?.notes||''; $('#setupDialog').showModal(); }
  function saveSetup(){ const payload={label:$('#setupName').value.trim()||'End of Setup',start:$('#setupStart').value,end:$('#setupEnd').value,notes:$('#setupNotes').value.trim()}; if(editingSetupId)commit(()=>Object.assign(findItem(editingSetupId),payload),'Setup updated'); else commit(()=>currentScene().items.push({id:uid('setup'),type:'setup',...payload}),'Camera setup added'); editingSetupId=null; }
  function openBannerDialog(id=null){ editingBannerId=id; const item=id?findItem(id):null; $('#bannerDialogTitle').textContent=item?'Edit Banner':'Add Banner'; $('#bannerLabel').value=item?.label||'Meal Break — 12:00 pm to 1:00 pm'; $('#bannerStyle').value=item?.style||'indigo'; $('#bannerDialog').showModal(); }
  function saveBanner(){ const payload={label:$('#bannerLabel').value.trim()||'Production Break',style:$('#bannerStyle').value}; if(editingBannerId)commit(()=>Object.assign(findItem(editingBannerId),payload),'Banner updated'); else commit(()=>currentScene().items.push({id:uid('banner'),type:'banner',...payload}),'Banner added'); editingBannerId=null; }
  function openSceneDialog(id=null){ editingSceneId=id; const scene=id?findScene(id):null; $('#sceneDialogTitle').textContent=scene?'Edit Scene':'Add Scene'; $('#sceneFormNumber').value=scene?.number||String(currentList().scenes.length+1); $('#sceneFormHeading').value=scene?.heading||'INT. NEW LOCATION - DAY'; $('#sceneFormNotes').value=scene?.notes||''; $('#sceneDialog').showModal(); setTimeout(()=>$('#sceneFormHeading').focus(),30); }
  function saveScene(){ const number=$('#sceneFormNumber').value.trim(),heading=$('#sceneFormHeading').value.trim(),notes=$('#sceneFormNotes').value.trim(); if(editingSceneId)commit(()=>{const scene=findScene(editingSceneId);scene.number=number;scene.heading=heading;scene.notes=notes;shotItems(scene).forEach(s=>s.scene=number)},'Scene updated'); else commit(()=>{const scene={id:uid('scene'),number,heading,notes,breakdown:[],items:[]};currentList().scenes.push(scene);state.activeSceneId=scene.id},'Scene added'); editingSceneId=null; }
  function duplicateItem(id){ const scene=currentScene(),index=scene.items.findIndex(i=>i.id===id); if(index<0)return; const original=scene.items[index],copy=deepClone(original); copy.id=uid(original.type); if(copy.type==='shot'){copy.shot=`${copy.shot}A`;copy.selected=false;copy.complete=false} commit(()=>scene.items.splice(index+1,0,copy),'Item duplicated'); }
  function deleteItems(ids,message='Item deleted'){ const set=new Set(ids); commit(()=>{currentScene().items=currentScene().items.filter(i=>!set.has(i.id))},message); }
  function duplicateScene(id){ const list=currentList(),scene=findScene(id),index=list.scenes.findIndex(s=>s.id===id); if(!scene)return; const copy=deepClone(scene); copy.id=uid('scene'); copy.number=`${scene.number}A`; copy.heading=`${scene.heading} — COPY`; copy.items.forEach(item=>{item.id=uid(item.type);if(item.type==='shot')item.scene=copy.number}); commit(()=>{list.scenes.splice(index+1,0,copy);state.activeSceneId=copy.id},'Scene duplicated'); }
  async function deleteScene(id){ const list=currentList(); if(list.scenes.length===1)return showToast('A shot list must keep at least one scene'); const scene=findScene(id); if(!await askConfirm('Delete scene?',`Delete Sc. ${scene.number} and all ${scene.items.length} items inside it?`))return; commit(()=>{list.scenes=list.scenes.filter(s=>s.id!==id);if(state.activeSceneId===id)state.activeSceneId=list.scenes[0].id},'Scene deleted'); }
  function renumberShots(scene=currentScene()){ commit(()=>shotItems(scene).forEach((shot,index)=>{shot.shot=String(index+1);shot.scene=scene.number}),'Shots renumbered'); }
  function clearSelection(){ commit(()=>shotItems().forEach(s=>s.selected=false),'Selection cleared'); }
  function selectedShots(){ return shotItems().filter(s=>s.selected); }
  function moveItemsToScene(ids,destinationId){ const source=currentScene(),destination=findScene(destinationId); if(!destination||destination.id===source.id)return; const set=new Set(ids),moving=source.items.filter(i=>set.has(i.id)); commit(()=>{source.items=source.items.filter(i=>!set.has(i.id));moving.forEach(item=>{if(item.type==='shot'){item.scene=destination.number;item.selected=false}destination.items.push(item)})},`${moving.length} item${moving.length===1?'':'s'} moved`); closeDialog('utilityDialog'); moveContext=null; }
  function openMoveDialog(ids){ const destinations=currentList().scenes.filter(s=>s.id!==currentScene().id); if(!destinations.length)return showToast('Add another scene before moving shots'); moveContext=ids; utilityMode='move'; $('#utilityEyebrow').textContent='MOVE ITEMS'; $('#utilityTitle').textContent='Choose Destination Scene'; $('#utilityBody').innerHTML=`<div class="list-manager">${destinations.map(scene=>`<button class="list-row" data-move-scene="${scene.id}"><span class="list-main"><strong>Sc. ${escapeHtml(scene.number)} · ${escapeHtml(scene.heading)}</strong><span>${scene.items.length} items</span></span><span>→</span></button>`).join('')}</div>`; $('#utilityFooter').innerHTML=`<button type="button" data-close-dialog="utilityDialog" class="secondary-button">Cancel</button>`; $('#utilityDialog').showModal(); }

  function renderListManager(){
    $('#listManager').innerHTML=state.shotLists.map(list=>{const count=list.scenes.reduce((sum,s)=>sum+shotItems(s).length,0);return `<div class="list-row ${list.id===state.activeListId?'active':''}" data-list-id="${list.id}"><div class="list-main"><strong>${escapeHtml(list.name)}</strong><span>${list.scenes.length} scenes · ${count} shots</span></div><div class="row-buttons"><button data-list-action="open" title="Open">↗</button><button data-list-action="rename" title="Rename">✎</button><button data-list-action="duplicate" title="Duplicate">⧉</button><button data-list-action="delete" class="danger" title="Delete">⌫</button></div></div>`}).join('');
  }
  async function createShotList(){ const name=await askText('New Shot List','Name',`Shot List ${state.shotLists.length+1}`); if(!name)return; commit(()=>{const scene={id:uid('scene'),number:'1',heading:'INT. NEW LOCATION - DAY',notes:'',breakdown:[],items:[]};const list={id:uid('list'),name,productionDate:'',callTime:'08:00',scenes:[scene]};state.shotLists.push(list);state.activeListId=list.id;state.activeSceneId=scene.id},'Shot list created'); renderListManager(); }
  async function renameShotList(id){ const list=state.shotLists.find(l=>l.id===id); const name=await askText('Rename Shot List','Name',list.name); if(!name)return; commit(()=>list.name=name,'Shot list renamed'); renderListManager(); }
  function duplicateShotList(id){ const source=state.shotLists.find(l=>l.id===id),index=state.shotLists.findIndex(l=>l.id===id); const copy=deepClone(source); copy.id=uid('list');copy.name=`${source.name} Copy`;copy.scenes.forEach(scene=>{scene.id=uid('scene');scene.items.forEach(item=>item.id=uid(item.type))}); commit(()=>{state.shotLists.splice(index+1,0,copy);state.activeListId=copy.id;state.activeSceneId=copy.scenes[0].id},'Shot list duplicated'); renderListManager(); }
  async function deleteShotList(id){ if(state.shotLists.length===1)return showToast('The project must keep one shot list'); const list=state.shotLists.find(l=>l.id===id); if(!await askConfirm('Delete shot list?',`Delete “${list.name}” and all of its scenes?`))return; commit(()=>{state.shotLists=state.shotLists.filter(l=>l.id!==id);if(state.activeListId===id){state.activeListId=state.shotLists[0].id;state.activeSceneId=state.shotLists[0].scenes[0].id}},'Shot list deleted'); renderListManager(); }

  function openCollaborators(){ renderCollaborators(); $('#collaboratorsDialog').showModal(); }
  function renderCollaborators(){ $('#collaboratorList').innerHTML=state.collaborators.map(person=>`<div class="collaborator-row" data-person-id="${person.id}"><span class="collaborator-dot" style="background:${escapeHtml(person.color)}">${escapeHtml(initials(person.name))}</span><div class="collaborator-main"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role||'Collaborator')}</span></div><div class="row-buttons"><button data-person-action="edit">✎</button><button data-person-action="delete" class="danger">⌫</button></div></div>`).join(''); }
  function addCollaborator(){ const name=$('#collaboratorName').value.trim(),role=$('#collaboratorRole').value.trim(); if(!name)return showToast('Enter a collaborator name'); commit(()=>state.collaborators.push({id:uid('person'),name,role,color:AVATAR_COLORS[state.collaborators.length%AVATAR_COLORS.length]}),'Collaborator added'); $('#collaboratorName').value='';$('#collaboratorRole').value='';renderCollaborators(); }
  async function editCollaborator(id){ const person=state.collaborators.find(p=>p.id===id); const name=await askText('Edit Collaborator','Name',person.name); if(!name)return; const role=await askText('Edit Collaborator','Role',person.role||''); if(role===null)return; commit(()=>{person.name=name;person.role=role},'Collaborator updated'); renderCollaborators(); }
  async function deleteCollaborator(id){ const person=state.collaborators.find(p=>p.id===id); if(!await askConfirm('Remove collaborator?',`Remove ${person.name} from this local project?`))return; commit(()=>state.collaborators=state.collaborators.filter(p=>p.id!==id),'Collaborator removed'); renderCollaborators(); }

  function openUtility(section){
    if(section==='visualize'){ closeDialog('utilityDialog'); uiUpdate(()=>state.activeModule='shotlist'); return; }
    utilityMode=section; const dialog=$('#utilityDialog'); const list=currentList(),scene=currentScene();
    if(section==='write'){
      $('#utilityEyebrow').textContent='SCRIPT NOTES';$('#utilityTitle').textContent='Write';$('#utilityBody').innerHTML=`<div class="utility-section"><p class="utility-note">A lightweight local writing pad for script excerpts, scene notes, or shot-list context.</p><textarea id="utilityScriptNotes" class="utility-textarea">${escapeHtml(state.scriptNotes)}</textarea></div>`;$('#utilityFooter').innerHTML=`<button type="button" data-close-dialog="utilityDialog" class="secondary-button">Cancel</button><button type="button" data-utility-save="write" class="primary-button">Save Notes</button>`;
    }else if(section==='breakdown'){
      $('#utilityEyebrow').textContent='SCENE ELEMENTS';$('#utilityTitle').textContent=`Breakdown · Sc. ${scene.number}`;renderBreakdownUtility();
    }else if(section==='plan'){
      $('#utilityEyebrow').textContent='SCHEDULE';$('#utilityTitle').textContent=`Plan · ${list.name}`;renderPlanUtility();
    }else if(section==='shoot'){
      $('#utilityEyebrow').textContent='PROGRESS';$('#utilityTitle').textContent='Shoot';renderShootUtility();
    }else if(section==='settings'){
      $('#utilityEyebrow').textContent='LOCAL WORKSPACE';$('#utilityTitle').textContent='Settings';renderSettingsUtility();
    }
    if(!dialog.open)dialog.showModal();
  }
  function renderBreakdownUtility(){ const scene=currentScene(); $('#utilityBody').innerHTML=`<div class="utility-section"><p class="utility-note">Track cast, props, wardrobe, vehicles, locations, effects, or any other elements needed for this scene.</p><div class="tag-list">${scene.breakdown.length?scene.breakdown.map((tag,index)=>`<span class="tag-chip">${escapeHtml(tag)}<button data-remove-breakdown="${index}">×</button></span>`).join(''):'<span class="utility-note">No elements added.</span>'}</div><div class="inline-add"><input id="breakdownInput" class="utility-input" placeholder="e.g. Hero prop, rain rig, red coat"><button type="button" id="addBreakdownButton" class="secondary-button">Add Element</button></div><label class="field"><span>Scene notes</span><textarea id="breakdownSceneNotes" rows="4">${escapeHtml(scene.notes)}</textarea></label></div>`; $('#utilityFooter').innerHTML=`<button type="button" data-close-dialog="utilityDialog" class="secondary-button">Cancel</button><button type="button" data-utility-save="breakdown" class="primary-button">Save Scene Notes</button>`; }
  function addBreakdownTag(){ const input=$('#breakdownInput'),value=input?.value.trim();if(!value)return;commit(()=>currentScene().breakdown.push(value),'Breakdown element added');renderBreakdownUtility(); }
  function renderPlanUtility(){ const list=currentList(); const rows=[]; let cursor=list.callTime||'08:00'; list.scenes.forEach(scene=>{shotItems(scene).forEach(shot=>rows.push({scene:scene.number,shot:shot.shot,description:shot.description,time:shot.time,minutes:estimateMinutes(shot.time)}))}); const total=rows.reduce((sum,row)=>sum+row.minutes,0); $('#utilityBody').innerHTML=`<div class="utility-section"><div class="two-fields"><label class="field"><span>Production date</span><input id="planDate" type="date" value="${escapeHtml(list.productionDate)}"></label><label class="field"><span>Call time</span><input id="planCallTime" type="time" value="${escapeHtml(cursor)}"></label></div><div class="metric-grid"><div class="metric-card"><strong>${list.scenes.length}</strong><span>Scenes</span></div><div class="metric-card"><strong>${rows.length}</strong><span>Shots</span></div><div class="metric-card"><strong>${formatMinutes(total)}</strong><span>Shot estimates</span></div></div><table class="schedule-table"><thead><tr><th>Scene</th><th>Shot</th><th>Description</th><th>Estimate</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHtml(row.scene)}</td><td>${escapeHtml(row.shot)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.time||'—')}</td></tr>`).join('')||'<tr><td colspan="4">No shots scheduled.</td></tr>'}</tbody></table></div>`; $('#utilityFooter').innerHTML=`<button type="button" data-plan-export class="secondary-button">Export Schedule CSV</button><button type="button" data-utility-save="plan" class="primary-button">Save Plan</button>`; }
  function renderShootUtility(){ const all=currentList().scenes.flatMap(scene=>shotItems(scene).map(shot=>({scene,shot}))); const done=all.filter(x=>x.shot.complete).length,pct=all.length?Math.round(done/all.length*100):0; $('#utilityBody').innerHTML=`<div class="utility-section"><div class="metric-grid"><div class="metric-card"><strong>${done}</strong><span>Completed</span></div><div class="metric-card"><strong>${all.length-done}</strong><span>Remaining</span></div><div class="metric-card"><strong>${pct}%</strong><span>Progress</span></div></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><table class="shoot-table"><thead><tr><th>Done</th><th>Scene</th><th>Shot</th><th>Description</th></tr></thead><tbody>${all.map(({scene,shot})=>`<tr><td><input type="checkbox" data-shoot-toggle="${shot.id}" data-scene-id="${scene.id}" ${shot.complete?'checked':''}></td><td>${escapeHtml(scene.number)}</td><td>${escapeHtml(shot.shot)}</td><td>${escapeHtml(shot.description)}</td></tr>`).join('')||'<tr><td colspan="4">No shots yet.</td></tr>'}</tbody></table></div>`; $('#utilityFooter').innerHTML=`<button type="button" data-close-dialog="utilityDialog" class="primary-button">Done</button>`; }
  function renderSettingsUtility(){ $('#utilityBody').innerHTML=`<div class="utility-section"><div class="settings-grid"><label class="field"><span>Your name</span><input id="settingsName" value="${escapeHtml(state.profile.name)}"></label><label class="field"><span>Your role</span><input id="settingsRole" value="${escapeHtml(state.profile.role)}"></label><label class="field"><span>Default lens</span><input id="settingsLens" value="${escapeHtml(state.settings.defaultLens)}"></label><label class="field"><span>Default frame rate</span><input id="settingsFrameRate" value="${escapeHtml(state.settings.defaultFrameRate)}"></label><label class="field"><span>Default shot estimate</span><input id="settingsTime" value="${escapeHtml(state.settings.defaultShotTime)}"></label><label class="setting-check"><input id="settingsAutoNumber" type="checkbox" ${state.settings.autoNumberShots?'checked':''}><span>Use next available number for new shots</span></label></div><p class="utility-note">This replica stores project data in this browser only. Export Project JSON for a portable backup.</p></div>`; $('#utilityFooter').innerHTML=`<button type="button" data-reset-workspace class="secondary-button danger-text">Reset Demo</button><button type="button" data-utility-save="settings" class="primary-button">Save Settings</button>`; }
  function saveUtility(mode){
    if(mode==='write')commit(()=>state.scriptNotes=$('#utilityScriptNotes').value,'Writing notes saved');
    if(mode==='breakdown')commit(()=>currentScene().notes=$('#breakdownSceneNotes').value,'Scene notes saved');
    if(mode==='plan')commit(()=>{currentList().productionDate=$('#planDate').value;currentList().callTime=$('#planCallTime').value},'Production plan saved');
    if(mode==='settings')commit(()=>{state.profile.name=$('#settingsName').value.trim()||'User';state.profile.role=$('#settingsRole').value.trim();state.settings.defaultLens=$('#settingsLens').value.trim();state.settings.defaultFrameRate=$('#settingsFrameRate').value.trim();state.settings.defaultShotTime=$('#settingsTime').value.trim();state.settings.autoNumberShots=$('#settingsAutoNumber').checked},'Settings saved');
    closeDialog('utilityDialog');
  }

  function normalizeExportText(value){
    return String(value ?? '').replace(/\r\n?/g,'\n').trim();
  }
  function displayExportText(value,fallback='—'){
    const text=normalizeExportText(value);
    return escapeHtml(text || fallback);
  }
  function exportTimestamp(){
    try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date())}
    catch{return new Date().toLocaleString()}
  }
  function scheduleRows(){
    return currentList().scenes.flatMap(scene=>shotItems(scene).map(shot=>[
      scene.number,scene.heading,shot.shot,normalizeExportText(shot.description),normalizeExportText(shot.subject),shot.time,shot.complete?'Complete':'Incomplete'
    ]));
  }
  function exportScheduleCsv(){
    const rows=[['Scene','Heading','Shot','Description','Subject','Est. Time','Status'],...scheduleRows()];
    downloadCsv(rows,`${slug(state.projectName)}-${slug(currentList().name)}-schedule.csv`);
  }
  function exportCsv(scope='all'){
    const rows=[['Shot List','Scene','Heading','Item Type','Shot','Subject','Description / Label','Shot Size','Shot Type','Movement','Equipment','Lens','Est. Time','Frame Rate','Notes','Setup Start','Setup End','Banner Style','Complete']];
    const currentSceneOnly=scope==='current-scene';
    const currentFilmOnly=scope==='current-list';
    const lists=(currentSceneOnly||currentFilmOnly)?[currentList()]:state.shotLists;
    lists.forEach(list=>list.scenes.forEach(scene=>{
      if(currentSceneOnly&&scene.id!==state.activeSceneId)return;
      scene.items.forEach(item=>{
        if(item.type==='shot')rows.push([
          list.name,scene.number,scene.heading,'Shot',item.shot,item.subject,normalizeExportText(item.description),item.shotSize,item.shotType,item.movement,item.equipment,item.lens,item.time,item.frameRate,normalizeExportText(item.notes),'','','',item.complete?'Yes':'No'
        ]);
        else if(item.type==='setup')rows.push([
          list.name,scene.number,scene.heading,'Setup','','',normalizeExportText(item.label),'','','','','','','',normalizeExportText(item.notes),item.start,item.end,'',''
        ]);
        else rows.push([
          list.name,scene.number,scene.heading,'Banner / Break','','',normalizeExportText(item.label),'','','','','','','','','','',item.style||'',''
        ]);
      });
    }));
    const range=scope==='current-scene'?`scene-${slug(currentScene().number)}`:scope==='current-list'?`full-film-${slug(currentList().name)}`:'all-shot-lists';
    downloadCsv(rows,`${slug(state.projectName)}-${range}-shot-list.csv`);
  }
  function downloadCsv(rows,name){
    const csv='\ufeff'+rows.map(row=>row.map(value=>`"${normalizeExportText(value).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),name);
    showToast('CSV exported with all item fields');
  }
  function exportJson(){
    downloadBlob(new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),`${slug(state.projectName)}-shot-list-project.json`);
    showToast('Project backup exported');
  }
  async function saveBlobWithTauri(blob,name){
    try{
      const invoke=window.__TAURI__?.core?.invoke;
      if(!invoke)return false;
      const contents=await blob.text();
      const result=await invoke('save_text_file',{defaultName:name,contents});
      showToast(result?.canceled?'Export cancelled':'File exported successfully');
      return true;
    }catch(error){
      console.error(error);
      showToast(error?.message||'Could not save the file');
      return true;
    }
  }
  function downloadBlob(blob,name){
    if(window.__TAURI__?.core?.invoke){void saveBlobWithTauri(blob,name);return}
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function detectCsvDelimiter(text){
    const sample=String(text||'').replace(/^\uFEFF/,'');
    const counts={',':0,';':0,'\t':0};
    let inQuotes=false;
    for(let index=0;index<sample.length&&index<8192;index++){
      const char=sample[index];
      if(char==='"'){
        if(inQuotes&&sample[index+1]==='"'){index++;continue}
        inQuotes=!inQuotes;continue;
      }
      if(!inQuotes&&(char==='\r'||char==='\n'))break;
      if(!inQuotes&&Object.prototype.hasOwnProperty.call(counts,char))counts[char]++;
    }
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][1]>0?Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]:',';
  }
  function parseCsvText(text){
    const source=String(text||'').replace(/^\uFEFF/,'');
    const delimiter=detectCsvDelimiter(source);
    const rows=[];let row=[],field='',inQuotes=false;
    for(let index=0;index<source.length;index++){
      const char=source[index];
      if(inQuotes){
        if(char==='"'){
          if(source[index+1]==='"'){field+='"';index++}
          else inQuotes=false;
        }else field+=char;
        continue;
      }
      if(char==='"'&&field===''){inQuotes=true;continue}
      if(char===delimiter){row.push(field);field='';continue}
      if(char==='\r'||char==='\n'){
        row.push(field);field='';
        if(row.some(value=>String(value).trim()!==''))rows.push(row);
        row=[];
        if(char==='\r'&&source[index+1]==='\n')index++;
        continue;
      }
      field+=char;
    }
    if(inQuotes)throw new Error('The CSV contains an unclosed quoted field.');
    row.push(field);
    if(row.some(value=>String(value).trim()!==''))rows.push(row);
    if(rows[0]&&((rows[0].length===1&&/^sep=./i.test(String(rows[0][0]).trim()))||(rows[0].length<=2&&/^sep=$/i.test(String(rows[0][0]).trim()))))rows.shift();
    return rows;
  }
  function normalizeCsvHeader(value){
    return String(value||'').trim().toLowerCase().replace(/\ufeff/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
  }
  const CSV_HEADER_ALIASES={
    shotList:['shotlist','shotlistname','list','listname','sheet'],
    scene:['scene','sceneno','scenenumber','sceneid','sc'],
    heading:['heading','sceneheading','slugline','sceneslugline','location'],
    sceneNotes:['scenenotes','scenenote'],
    itemType:['itemtype','rowtype','recordtype','type'],
    shot:['shot','shotno','shotnumber','shotid','shotnum'],
    subject:['subject','character','characters','talent'],
    description:['descriptionlabel','description','shotdescription','action','label','content'],
    shotSize:['shotsize','framesize','framing','size'],
    shotType:['shottype','cameraangle','angle','composition','type'],
    movement:['movement','cameramovement','cameramove','move'],
    equipment:['equipment','gear','support','cameraequipment','cameragear','camera'],
    lens:['lens','focallength','lensmm','focal'],
    time:['esttime','estimatedtime','estimate','duration','shottime'],
    frameRate:['framerate','fps','framespersecond'],
    notes:['notes','note','comments','comment','additionalnotes','remarks'],
    setupStart:['setupstart','starttime','setupstarttime','start'],
    setupEnd:['setupend','endtime','setupendtime','end'],
    bannerStyle:['bannerstyle','style','colour','color'],
    complete:['complete','completed','status','done','shotstatus'],
    image:['image','imageurl','referenceimage','referenceimageurl','thumbnail','thumbnailurl']
  };
  function csvHeaderMap(headers){
    const normalized=headers.map(normalizeCsvHeader);const map={};
    Object.entries(CSV_HEADER_ALIASES).forEach(([key,aliases])=>{
      const index=normalized.findIndex(header=>aliases.includes(header));
      if(index>=0)map[key]=index;
    });
    return map;
  }
  function csvCell(row,map,key){
    const index=map[key];
    return index===undefined?'':String(row[index]??'').trim();
  }
  function csvComplete(value){
    return ['1','true','yes','y','complete','completed','done','checked','x','✓'].includes(String(value||'').trim().toLowerCase());
  }
  function csvItemType(value,row,map){
    const raw=String(value||'').trim().toLowerCase();
    if(/setup/.test(raw))return'setup';
    if(/banner|break|meal|lunch/.test(raw))return'banner';
    if(!csvCell(row,map,'shot')&&(csvCell(row,map,'setupStart')||csvCell(row,map,'setupEnd')))return'setup';
    return'shot';
  }
  function safeCsvImage(value,label){
    const image=String(value||'').trim();
    return /^(data:image\/|https?:\/\/)/i.test(image)?image:svgFrame(label||'IMPORTED SHOT');
  }
  function uniqueImportedListName(name,usedNames){
    const base=String(name||'Imported Shot List').trim()||'Imported Shot List';
    let candidate=base,index=1;
    while(usedNames.has(candidate.toLowerCase())){candidate=index===1?`${base} (Imported)`:`${base} (Imported ${index})`;index++}
    usedNames.add(candidate.toLowerCase());return candidate;
  }
  function shotListsFromCsv(rows,fileName='Imported CSV'){
    if(rows.length<2)throw new Error('The CSV has no data rows.');
    const headers=rows[0].map(value=>String(value||'').trim());
    const map=csvHeaderMap(headers);
    const recognized=Object.keys(map);
    if(!recognized.some(key=>['scene','heading','shot','description','subject','itemType','shotSize','shotType'].includes(key)))throw new Error('No recognised shot-list columns were found.');
    const fallbackName=String(fileName||'Imported CSV').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').trim()||'Imported CSV';
    const listGroups=new Map();let importedShots=0,importedSpecial=0;
    rows.slice(1).forEach(row=>{
      if(!row.some(value=>String(value??'').trim()))return;
      const rawListName=csvCell(row,map,'shotList')||fallbackName;
      if(!listGroups.has(rawListName))listGroups.set(rawListName,{name:rawListName,scenes:new Map()});
      const listGroup=listGroups.get(rawListName);
      const sceneNumber=csvCell(row,map,'scene')||'1';
      const heading=csvCell(row,map,'heading')||'Imported Scene';
      const sceneKey=sceneNumber||heading;
      if(!listGroup.scenes.has(sceneKey))listGroup.scenes.set(sceneKey,{id:uid('scene'),number:sceneNumber,heading,notes:csvCell(row,map,'sceneNotes'),breakdown:[],items:[]});
      const scene=listGroup.scenes.get(sceneKey);
      if(scene.heading==='Imported Scene'&&heading!=='Imported Scene')scene.heading=heading;
      if(!scene.notes&&csvCell(row,map,'sceneNotes'))scene.notes=csvCell(row,map,'sceneNotes');
      const itemType=csvItemType(csvCell(row,map,'itemType'),row,map);
      const description=csvCell(row,map,'description');
      if(itemType==='setup'){
        scene.items.push({id:uid('setup'),type:'setup',label:description||'End of Setup',start:csvCell(row,map,'setupStart'),end:csvCell(row,map,'setupEnd'),notes:csvCell(row,map,'notes')});
        importedSpecial++;return;
      }
      if(itemType==='banner'){
        const style=csvCell(row,map,'bannerStyle').toLowerCase();
        scene.items.push({id:uid('banner'),type:'banner',label:description||'Production Break',style:['indigo','slate','green','red'].includes(style)?style:'indigo'});
        importedSpecial++;return;
      }
      const shotNumber=csvCell(row,map,'shot')||String(scene.items.filter(item=>item.type==='shot').length+1);
      const shotDescription=description||`Imported shot ${shotNumber}`;
      scene.items.push({
        id:uid('shot'),type:'shot',complete:csvComplete(csvCell(row,map,'complete')),selected:false,
        image:safeCsvImage(csvCell(row,map,'image'),shotDescription),scene:sceneNumber,shot:shotNumber,
        subject:csvCell(row,map,'subject'),description:shotDescription,
        shotSize:csvCell(row,map,'shotSize')||OPTIONS.shotSize[3],shotType:csvCell(row,map,'shotType')||OPTIONS.shotType[0],
        movement:csvCell(row,map,'movement')||OPTIONS.movement[0],equipment:csvCell(row,map,'equipment')||OPTIONS.equipment[0],
        lens:csvCell(row,map,'lens'),time:csvCell(row,map,'time'),frameRate:csvCell(row,map,'frameRate'),notes:csvCell(row,map,'notes')
      });
      importedShots++;
    });
    const lists=[...listGroups.values()].map(group=>({id:uid('list'),name:group.name,productionDate:'',callTime:'08:00',scenes:[...group.scenes.values()]})).filter(list=>list.scenes.some(scene=>scene.items.length));
    if(!lists.length)throw new Error('No importable shot rows were found.');
    return {lists,importedShots,importedSpecial};
  }
  async function importCsv(file){
    try{
      const text=await file.text();const parsed=parseCsvText(text);const result=shotListsFromCsv(parsed,file.name);
      const usedNames=new Set(state.shotLists.map(list=>list.name.toLowerCase()));
      result.lists.forEach(list=>{list.name=uniqueImportedListName(list.name,usedNames)});
      const first=result.lists[0];
      commit(()=>{state.shotLists.push(...result.lists);state.activeListId=first.id;state.activeSceneId=first.scenes[0].id;state.activeModule='shotlist';state.viewMode='list';},`Imported ${result.importedShots} shot${result.importedShots===1?'':'s'}${result.importedSpecial?` and ${result.importedSpecial} setup/break row${result.importedSpecial===1?'':'s'}`:''}`);
    }catch(error){console.warn(error);showToast(error?.message||'Could not import this CSV file')}
  }
  async function importJson(file){
    try{const text=await file.text();const parsed=JSON.parse(text);const imported=sanitizeState(parsed);commit(()=>{state=imported},'Project imported');}
    catch(error){console.warn(error);showToast('Could not import this JSON file')}
  }
  async function importProjectFile(file){
    const name=String(file?.name||'').toLowerCase();
    if(name.endsWith('.csv')||name.endsWith('.tsv')||name.endsWith('.txt')||/csv|tab-separated/i.test(file?.type||''))return importCsv(file);
    if(name.endsWith('.json')||/json/i.test(file?.type||''))return importJson(file);
    try{
      const text=await file.text();
      if(/^[\s\uFEFF]*[\[{]/.test(text))return importJson(new File([text],file.name,{type:'application/json'}));
      return importCsv(new File([text],file.name,{type:'text/csv'}));
    }catch(error){console.warn(error);showToast('Unsupported import file')}
  }

  function exportDocumentCss(kind='shotlist'){
    const isStoryboard=kind==='storyboard';
    return `
      @page{size:A4 landscape;margin:${isStoryboard?'5mm':'6mm'}}
      *{box-sizing:border-box}
      html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{margin:0;background:#fff;color:#151922;font-family:"Segoe UI",Arial,sans-serif;font-size:${isStoryboard?'7pt':'7.2pt'};line-height:1.22}
      .report{width:100%}
      .report-header{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding:0 0 2.5mm;border-bottom:1.5px solid #181d26;margin-bottom:3mm}
      .report-header h1{margin:0;font-size:15pt;line-height:1.05;letter-spacing:-.02em}
      .report-header p{margin:1mm 0 0;color:#596273;font-size:7pt}
      .report-meta{text-align:right;color:#596273;font-size:6.5pt;white-space:nowrap}
      .list-section{margin:0 0 4mm}
      .list-section+.list-section{break-before:auto}
      .list-heading{display:flex;justify-content:space-between;gap:12px;align-items:end;margin:0 0 2mm;padding-bottom:1mm;border-bottom:1px solid #cfd5df}
      .list-heading h2{margin:0;font-size:10.5pt}
      .list-heading span{color:#667085;font-size:6.4pt}
      .scene-section{margin:0 0 3mm;break-inside:auto}
      .scene-section+.scene-section{break-before:auto}
      .scene-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:1.5mm 2mm;background:#171c25;color:#fff;margin:0 0 1mm;break-after:avoid}
      .scene-heading h3{margin:0;font-size:8.5pt;line-height:1.15}
      .scene-heading p{margin:.6mm 0 0;color:#d8dde7;font-size:6.2pt;white-space:pre-wrap;overflow-wrap:anywhere}
      .scene-count{font-size:6.2pt;color:#cbd2df;white-space:nowrap}
      .shot-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:6.6pt;line-height:1.16}
      .shot-table thead{display:table-header-group}
      .shot-table th{padding:1mm 1.2mm;background:#e8ebf0;border:1px solid #c9cfd9;color:#4d5665;font-size:5.7pt;letter-spacing:.045em;text-align:left;text-transform:uppercase}
      .shot-table td{padding:1.15mm 1.2mm;border:1px solid #d6dbe3;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
      .shot-table tr{break-inside:avoid}
      .shot-table .shot-id{font-weight:800;color:#5d4ed0;white-space:nowrap}
      .shot-table .cell-title{display:block;font-weight:700;font-size:7pt;line-height:1.15;color:#161b24}
      .shot-table .cell-sub{display:block;margin-top:.5mm;color:#5d6675;font-size:6pt;line-height:1.15}
      .shot-table .compact-line{display:block;margin:0 0 .45mm}
      .shot-table .compact-line:last-child{margin-bottom:0}
      .shot-table .label{font-weight:700;color:#525c6c}
      .shot-table .complete{font-weight:700;color:#16633c}
      .shot-table .incomplete{font-weight:700;color:#7a4b14}
      .special-table-row td{padding:1.1mm 1.5mm;font-size:6.4pt}
      .special-table-row.setup td{background:#eef2f7}
      .special-table-row.banner td{background:#eeeaff}
      .special-table-row strong{font-size:6.8pt}
      .empty-export{padding:8mm;border:1px dashed #b9c0cb;text-align:center;color:#667085}
      .story-page{height:199mm;display:flex;flex-direction:column;break-after:page;page-break-after:always;overflow:hidden}
      .story-page:last-child{break-after:auto;page-break-after:auto}
      .story-page-header{height:9mm;flex:0 0 9mm;display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #aeb6c4;padding:0 0 1.5mm;margin-bottom:2mm}
      .story-page-header h1{margin:0;font-size:9pt;line-height:1}
      .story-page-header p{margin:.6mm 0 0;color:#596273;font-size:5.8pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220mm}
      .story-page-number{font-size:6.2pt;color:#596273;white-space:nowrap}
      .story-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:2mm;flex:1 1 auto;min-height:0}
      .story-card{min-width:0;min-height:0;border:1px solid #c8ced8;overflow:hidden;break-inside:avoid;background:#fff;display:flex;flex-direction:column}
      .story-card img{display:block;width:100%;aspect-ratio:16/9;max-height:34mm;object-fit:contain;background:#111827;flex:0 0 auto}
      .story-body{padding:1mm 1.25mm;min-width:0;min-height:0;overflow:hidden}
      .story-number{display:block;font-size:5.8pt;font-weight:800;color:#5d4ed0;letter-spacing:.035em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .story-body h4{margin:.5mm 0 0;font-size:6.3pt;line-height:1.12;font-weight:650;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
      .story-placeholder{border:1px dashed #d4d9e1;background:#fafbfc}
      .print-help{position:fixed;right:6mm;bottom:4mm;color:#8a93a2;font-size:6pt}
      @media screen{body{padding:8mm;background:#e8ebf0}.report{max-width:1400px;margin:auto;background:#fff;padding:8mm;box-shadow:0 10px 35px rgba(22,27,37,.16)}.story-report{padding:5mm}.story-page{height:199mm}.print-help{position:static;text-align:right;margin-top:4mm}}
      @media print{.print-help{display:none}.report{padding:0}.story-report{padding:0}}
    `;
  }
  function reportHeader(title,subtitle){
    return `<header class="report-header"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="report-meta">${escapeHtml(state.projectName)}<br>${escapeHtml(exportTimestamp())}</div></header>`;
  }
  function renderShotForExport(item,scene){
    if(item.type==='setup'){
      const times=[item.start?formatTime(item.start):'',item.end?formatTime(item.end):''].filter(Boolean).join(' – ');
      return `<tr class="special-table-row setup"><td colspan="7"><strong>${displayExportText(item.label,'Camera setup')}</strong>${times?` · ${escapeHtml(times)}`:''}${item.notes?` · ${displayExportText(item.notes)}`:''}</td></tr>`;
    }
    if(item.type==='banner')return `<tr class="special-table-row banner"><td colspan="7"><strong>${displayExportText(item.label,'Production break')}</strong>${item.style?` · ${escapeHtml(item.style)}`:''}</td></tr>`;
    return `<tr>
      <td class="shot-id">${escapeHtml(`${scene.number}.${item.shot||'—'}`)}</td>
      <td><span class="cell-title">${displayExportText(item.description,'Untitled shot')}</span><span class="cell-sub"><span class="label">Subject:</span> ${displayExportText(item.subject)}</span></td>
      <td><span class="compact-line"><span class="label">Size:</span> ${displayExportText(item.shotSize)}</span><span class="compact-line"><span class="label">Type:</span> ${displayExportText(item.shotType)}</span></td>
      <td><span class="compact-line"><span class="label">Move:</span> ${displayExportText(item.movement)}</span><span class="compact-line"><span class="label">Gear:</span> ${displayExportText(item.equipment)}</span></td>
      <td><span class="compact-line"><span class="label">Lens:</span> ${displayExportText(item.lens)}</span><span class="compact-line"><span class="label">FPS:</span> ${displayExportText(item.frameRate)}</span></td>
      <td><span class="compact-line"><span class="label">Time:</span> ${displayExportText(item.time)}</span><span class="compact-line ${item.complete?'complete':'incomplete'}">${item.complete?'Complete':'Incomplete'}</span></td>
      <td>${displayExportText(item.notes,'—')}</td>
    </tr>`;
  }
  function renderSceneShotListExport(scene){
    const shots=shotItems(scene);
    return `<section class="scene-section"><div class="scene-heading"><div><h3>Sc. ${escapeHtml(scene.number)} · ${displayExportText(scene.heading,'Untitled scene')}</h3>${scene.notes?`<p>${displayExportText(scene.notes)}</p>`:''}</div><span class="scene-count">${shots.length} shot${shots.length===1?'':'s'} · ${scene.items.length} item${scene.items.length===1?'':'s'}</span></div>${scene.items.length?`<table class="shot-table"><colgroup><col style="width:6%"><col style="width:25%"><col style="width:11%"><col style="width:15%"><col style="width:11%"><col style="width:9%"><col style="width:23%"></colgroup><thead><tr><th>Shot</th><th>Description / Subject</th><th>Framing</th><th>Movement / Equipment</th><th>Lens / FPS</th><th>Time / Status</th><th>Notes</th></tr></thead><tbody>${scene.items.map(item=>renderShotForExport(item,scene)).join('')}</tbody></table>`:'<div class="empty-export">No items in this scene.</div>'}</section>`;
  }
  function renderStoryboardCard(shot,scene,list){
    const context=[`Sc. ${scene.number}`,`Shot ${shot.shot||'—'}`,shot.shotSize].filter(Boolean).join(' · ');
    return `<article class="story-card"><img src="${escapeHtml(shot.image||svgFrame(shot.description||'SHOT'))}" alt="Shot ${escapeHtml(shot.shot)} storyboard frame"><div class="story-body"><span class="story-number">${escapeHtml(context)}</span><h4>${displayExportText(shot.description,'Untitled shot')}</h4></div></article>`;
  }
  function renderSceneStoryboardExport(scene,list){
    return shotItems(scene).map(shot=>renderStoryboardCard(shot,scene,list)).join('');
  }
  function chunkExportItems(items,size){
    const chunks=[];
    for(let index=0;index<items.length;index+=size)chunks.push(items.slice(index,index+size));
    return chunks.length?chunks:[[]];
  }
  function renderStoryboardPage(entries,pageIndex,totalPages,subtitle){
    const cards=entries.map(entry=>renderStoryboardCard(entry.shot,entry.scene,entry.list)).join('');
    return `<section class="story-page"><header class="story-page-header"><div><h1>${escapeHtml(state.projectName)} · Storyboard</h1><p>${escapeHtml(subtitle)}</p></div><span class="story-page-number">${pageIndex+1} / ${totalPages} · ${escapeHtml(exportTimestamp())}</span></header><div class="story-grid">${cards||'<div class="empty-export">No storyboard frames to export.</div>'}</div></section>`;
  }
  function buildExportDocument(kind='shotlist',scope='current-scene'){
    const currentOnly=scope==='current-scene';
    const currentFilmOnly=scope==='current-list';
    const lists=(currentOnly||currentFilmOnly)?[currentList()]:state.shotLists;
    const subtitle=currentOnly
      ?`Current scene · Sc. ${currentScene().number} · ${currentScene().heading}`
      :currentFilmOnly
        ?`Full film · ${currentList().name} · all ${currentList().scenes.length} scenes`
        :'All shot lists · every scene in the project';
    let content='';
    let title='Detailed Shot List';
    let reportClass='report';
    if(kind==='storyboard'){
      title='Storyboard';
      reportClass='report story-report';
      const entries=[];
      lists.forEach(list=>{
        const scenes=currentOnly?list.scenes.filter(scene=>scene.id===state.activeSceneId):list.scenes;
        scenes.forEach(scene=>shotItems(scene).forEach(shot=>entries.push({shot,scene,list})));
      });
      const pages=chunkExportItems(entries,16);
      content=pages.map((page,index)=>renderStoryboardPage(page,index,pages.length,subtitle)).join('');
    }else{
      const sections=lists.map(list=>{
        const scenes=currentOnly?list.scenes.filter(scene=>scene.id===state.activeSceneId):list.scenes;
        const shotCount=scenes.reduce((total,scene)=>total+shotItems(scene).length,0);
        const body=scenes.map(scene=>renderSceneShotListExport(scene)).join('');
        return `<section class="list-section"><div class="list-heading"><h2>${displayExportText(list.name,'Shot List')}</h2><span>${scenes.length} scene${scenes.length===1?'':'s'} · ${shotCount} shot${shotCount===1?'':'s'}${list.productionDate?` · ${escapeHtml(list.productionDate)}`:''}${list.callTime?` · Call ${escapeHtml(formatTime(list.callTime))}`:''}</span></div>${body||'<div class="empty-export">Nothing to export.</div>'}</section>`;
      }).join('');
      content=`${reportHeader(title,subtitle)}${sections}`;
    }
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(state.projectName)} — ${escapeHtml(title)}</title><style>${exportDocumentCss(kind)}</style></head><body><main class="${reportClass}">${content}<div class="print-help">Choose “Save as PDF” in the print dialog.</div></main></body></html>`;
  }
  function waitForExportImages(doc){
    return Promise.all([...doc.images].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{
      const done=()=>resolve();image.addEventListener('load',done,{once:true});image.addEventListener('error',done,{once:true});setTimeout(done,2500);
    })));
  }
  function exportPdfFileName(kind,scope){
    const type=kind==='storyboard'?'storyboard':'shot-list';
    const range=scope==='current-scene'
      ?`scene-${slug(currentScene().number)}`
      :scope==='current-list'
        ?`full-film-${slug(currentList().name)}`
        :'all-shot-lists';
    return `${slug(state.projectName)}-${type}-${range}.pdf`;
  }
  async function printExportDocument(kind='shotlist',scope='current-scene'){
    const html=buildExportDocument(kind,scope);
    if(window.desktopAPI?.savePdf){
      try{
        showToast(`Preparing ${kind==='storyboard'?'storyboard':'shot list'} PDF…`);
        const result=await window.desktopAPI.savePdf({html,defaultName:exportPdfFileName(kind,scope)});
        showToast(result?.canceled?'PDF export cancelled':'PDF exported successfully');
      }catch(error){console.error(error);showToast(error?.message||'Could not export PDF')}
      return;
    }
    const frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(frame);
    const cleanup=()=>{if(frame.isConnected)frame.remove()};
    const fallback=setTimeout(cleanup,60000);
    frame.onload=async()=>{
      try{
        const target=frame.contentWindow,doc=frame.contentDocument;
        await waitForExportImages(doc);
        await new Promise(resolve=>setTimeout(resolve,120));
        const afterPrint=()=>{clearTimeout(fallback);cleanup()};
        target.addEventListener('afterprint',afterPrint,{once:true});
        target.focus();target.print();
        showToast(`${kind==='storyboard'?'Storyboard':'Shot list'} ready to print or save as PDF`);
      }catch(error){console.error(error);clearTimeout(fallback);cleanup();showToast('Could not open the export document')}
    };
    frame.srcdoc=html;
  }
  function printShotList(scope='current-scene'){return printExportDocument('shotlist',scope)}
  function printStoryboard(scope='current-scene'){return printExportDocument('storyboard',scope)}
  async function shareSummary(){ const scene=currentScene(),shots=shotItems(scene); const text=`${state.projectName}\n${currentList().name}\nSc. ${scene.number} | ${scene.heading}\n${shots.map(s=>`${s.complete?'✓':'○'} ${s.shot} — ${s.description} (${s.shotSize}, ${s.lens||'no lens'})`).join('\n')}`; if(navigator.share){try{await navigator.share({title:`${state.projectName} Shot List`,text});return}catch(error){if(error?.name==='AbortError')return}} const copied=await copyText(text);showToast(copied?'Shot-list summary copied':'Copy unavailable'); }
  async function copyText(text){ try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true}const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok}catch{return false} }

  async function resizeImage(file){
    if(!file.type.startsWith('image/'))throw new Error('Not an image'); if(file.size>25*1024*1024)throw new Error('Image is too large');
    const url=URL.createObjectURL(file); try{const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not read image'));img.src=url});const maxW=1280,maxH=720,scale=Math.min(1,maxW/image.naturalWidth,maxH/image.naturalHeight),w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale));const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,w,h);const preservePng=file.type==='image/png'&&file.size<700000;return canvas.toDataURL(preservePng?'image/png':'image/jpeg',.82)}finally{URL.revokeObjectURL(url)}
  }
  async function handleImageFile(file,target){ try{showToast('Processing image…');const data=await resizeImage(file);if(target.kind==='form'){pendingShotImageData=data;$('#formImagePreview').src=data;showToast('Image ready')}else if(target.kind==='shot')updateItem(target.id,'image',data,'Reference image updated');else if(target.kind==='mood-replace')commit(()=>{const item=state.moodboard.find(m=>m.id===target.id);if(item)item.image=data},'Mood image updated');}catch(error){console.warn(error);showToast(error.message||'Could not process image')} }
  async function addMoodImages(files){ for(const file of files){try{const image=await resizeImage(file);commit(()=>state.moodboard.push({id:uid('mood'),image,caption:file.name.replace(/\.[^.]+$/,'')}),'Mood image added')}catch(error){showToast(`Skipped ${file.name}: ${error.message}`)}} }

  function askText(title,label,value=''){ return new Promise(resolve=>{promptResolver=resolve;$('#promptTitle').textContent=title;$('#promptLabel').textContent=label;$('#promptInput').value=value;$('#promptDialog').showModal();setTimeout(()=>{$('#promptInput').focus();$('#promptInput').select()},30)}); }
  function finishPrompt(value){ if(!promptResolver)return; const resolve=promptResolver;promptResolver=null;closeDialog('promptDialog');resolve(value); }
  function askConfirm(title,message){ return new Promise(resolve=>{confirmResolver=resolve;$('#confirmTitle').textContent=title;$('#confirmMessage').textContent=message;$('#confirmDialog').showModal()}); }
  function finishConfirm(value){ if(!confirmResolver)return; const resolve=confirmResolver;confirmResolver=null;closeDialog('confirmDialog');resolve(value); }
  function closeDialog(id){ const dialog=$(`#${id}`);if(dialog?.open)dialog.close(); }

  function openRowMenu(button,id){ openMenu(button,[{label:'Edit shot',action:'edit',icon:'✎'},{label:'Add shot below',action:'add-below',icon:'＋'},{label:'Duplicate',action:'duplicate',icon:'⧉'},{label:'Move to scene',action:'move',icon:'→'},{label:'Replace image',action:'image',icon:'▧'},{separator:true},{label:'Delete shot',action:'delete',icon:'⌫',danger:true}],{itemId:id,itemType:'shot'}); }
  function openSpecialMenu(button,id){ const item=findItem(id);openMenu(button,[{label:`Edit ${item.type}`,action:'edit',icon:'✎'},{label:'Duplicate',action:'duplicate',icon:'⧉'},{label:'Move to scene',action:'move',icon:'→'},{separator:true},{label:'Delete',action:'delete',icon:'⌫',danger:true}],{itemId:id,itemType:item.type}); }
  function openSceneMenu(button,id){ openMenu(button,[{label:'Edit scene',action:'scene-edit',icon:'✎'},{label:'Duplicate scene',action:'scene-duplicate',icon:'⧉'},{label:'Auto-renumber shots',action:'scene-renumber',icon:'#'},{separator:true},{label:'Delete scene',action:'scene-delete',icon:'⌫',danger:true}],{sceneId:id}); }
  function handleMenuAction(action,pop){
    const id=pop.dataset.itemId,type=pop.dataset.itemType,sceneId=pop.dataset.sceneId;
    if(action==='edit'){if(type==='shot')openShotDialog(id);if(type==='setup')openSetupDialog(id);if(type==='banner')openBannerDialog(id)}
    if(action==='add-below')openShotDialog(null,id); if(action==='duplicate')duplicateItem(id); if(action==='move')openMoveDialog([id]); if(action==='image'){pendingImageTarget={kind:'shot',id};$('#imageFileInput').click()}
    if(action==='delete')askConfirm('Delete item?','This item will be removed from the current scene.').then(ok=>{if(ok)deleteItems([id])});
    if(action==='scene-edit')openSceneDialog(sceneId);if(action==='scene-duplicate')duplicateScene(sceneId);if(action==='scene-renumber')renumberShots(findScene(sceneId));if(action==='scene-delete')deleteScene(sceneId);
    if(action==='print'||action==='export')$('#exportDialog').showModal();if(action==='csv')exportCsv('all');if(action==='json')exportJson();if(action==='manage-lists'){renderListManager();$('#listDialog').showModal()}if(action==='rename-project')renameProject();if(action==='collaborators')openCollaborators();if(action==='settings')openUtility('settings');if(action==='reset')resetWorkspace();
    closePopover();
  }
  async function renameProject(){ const name=await askText('Rename Project','Project name',state.projectName);if(name)commit(()=>state.projectName=name,'Project renamed'); }
  async function resetWorkspace(){ if(!await askConfirm('Reset demo project?','This replaces all current local data. Export a JSON backup first if you need it.'))return;undoStack.push(deepClone(state));state=defaultState();redoStack=[];saveState();render();showToast('Demo project restored');closeDialog('utilityDialog'); }

  function reorderSceneItems(sourceId,targetId,after){ const items=currentScene().items,from=items.findIndex(i=>i.id===sourceId);if(from<0)return;const [moved]=items.splice(from,1);let to=items.findIndex(i=>i.id===targetId);if(to<0){items.push(moved);return}if(after)to++;items.splice(to,0,moved); }
  function reorderScenes(sourceId,targetId,after){ const scenes=currentList().scenes,from=scenes.findIndex(s=>s.id===sourceId);if(from<0)return;const [moved]=scenes.splice(from,1);let to=scenes.findIndex(s=>s.id===targetId);if(to<0){scenes.push(moved);return}if(after)to++;scenes.splice(to,0,moved); }
  function reorderMood(sourceId,targetId,after){ const items=state.moodboard,from=items.findIndex(i=>i.id===sourceId);if(from<0)return;const [moved]=items.splice(from,1);let to=items.findIndex(i=>i.id===targetId);if(to<0){items.push(moved);return}if(after)to++;items.splice(to,0,moved); }
  function clearDropClasses(){ $$('.drop-before,.drop-after').forEach(el=>el.classList.remove('drop-before','drop-after')); }
  function setDropTarget(element,event){ clearDropClasses();const rect=element.getBoundingClientRect();dropAfter=event.clientY>rect.top+rect.height/2;element.classList.add(dropAfter?'drop-after':'drop-before'); }

  function bindEvents(){
    document.addEventListener('click',async event=>{
      const close=event.target.closest('[data-close-dialog]');if(close){closeDialog(close.dataset.closeDialog);return}
      if(event.target.closest('[data-prompt-cancel]')){finishPrompt(null);return}if(event.target.closest('[data-confirm-cancel]')){finishConfirm(false);return}
      const module=event.target.closest('[data-module]');if(module){$$('.side-item').forEach(b=>b.classList.toggle('active',b.dataset.section==='visualize'));uiUpdate(()=>state.activeModule=module.dataset.module);return}
      const side=event.target.closest('[data-section]');if(side){$$('.side-item').forEach(b=>b.classList.toggle('active',b===side));openUtility(side.dataset.section);return}
      if(event.target.closest('#homeButton')){$$('.side-item').forEach(b=>b.classList.toggle('active',b.dataset.section==='visualize'));uiUpdate(()=>state.activeModule='shotlist');return}
      const sceneMenu=event.target.closest('[data-scene-menu]');if(sceneMenu){event.stopPropagation();openSceneMenu(sceneMenu,sceneMenu.dataset.sceneMenu);return}
      const sceneCard=event.target.closest('.scene-card');if(sceneCard){uiUpdate(()=>state.activeSceneId=sceneCard.dataset.sceneId);closePopover();return}
      const status=event.target.closest('.status-dot');if(status){const item=findItem(status.dataset.id);if(item)updateItem(item.id,'complete',!item.complete,item.complete?'Marked incomplete':'Shot completed');return}
      const rowCheck=event.target.closest('.row-check');if(rowCheck){updateItem(rowCheck.dataset.id,'selected',rowCheck.checked);return}
      const spec=event.target.closest('[data-spec-field]');if(spec){openSpecPopover(spec,spec.dataset.id,spec.dataset.specField);return}
      const option=event.target.closest('[data-spec-value]');if(option){updateItem(option.dataset.id,option.dataset.field,option.dataset.specValue,`${COLUMN_DEFS[option.dataset.field].label} updated`);closePopover();return}
      const editable=event.target.closest('[data-edit-field],[data-edit-mood]');if(editable){beginInlineEdit(editable);return}
      const image=event.target.closest('.image-overlay,.board-card-image,[data-shot-image]');if(image){const id=image.dataset.id||image.dataset.shotImage;pendingImageTarget={kind:'shot',id};$('#imageFileInput').click();return}
      const rowMenu=event.target.closest('.row-menu-button');if(rowMenu){openRowMenu(rowMenu,rowMenu.dataset.id);return}
      const specialMenu=event.target.closest('.special-menu-button');if(specialMenu){openSpecialMenu(specialMenu,specialMenu.dataset.id);return}
      const menuAction=event.target.closest('.menu-popover [data-action]');if(menuAction){handleMenuAction(menuAction.dataset.action,menuAction.closest('.menu-popover'));return}
      if(event.target.closest('[data-add-shot]')){openShotDialog();return}
      if(event.target.closest('#addMoodImagesButton')){$('#moodImageFileInput').click();return}
      const replaceMood=event.target.closest('[data-replace-mood]');if(replaceMood){pendingImageTarget={kind:'mood-replace',id:replaceMood.dataset.replaceMood};$('#imageFileInput').click();return}
      const deleteMood=event.target.closest('[data-delete-mood]');if(deleteMood){if(await askConfirm('Delete mood image?','Remove this reference and its caption?'))commit(()=>state.moodboard=state.moodboard.filter(m=>m.id!==deleteMood.dataset.deleteMood),'Mood image deleted');return}
      const bulk=event.target.closest('[data-bulk]');if(bulk){const ids=selectedShots().map(s=>s.id),action=bulk.dataset.bulk;if(action==='complete')commit(()=>selectedShots().forEach(s=>s.complete=true),'Selected shots completed');if(action==='incomplete')commit(()=>selectedShots().forEach(s=>s.complete=false),'Selected shots marked incomplete');if(action==='duplicate'){ids.forEach(id=>duplicateItem(id));clearSelection()}if(action==='move')openMoveDialog(ids);if(action==='delete'&&await askConfirm('Delete selected shots?',`Delete ${ids.length} selected shots?`))deleteItems(ids,'Selected shots deleted');if(action==='clear')clearSelection();return}
      const move=event.target.closest('[data-move-scene]');if(move){moveItemsToScene(moveContext||[],move.dataset.moveScene);return}
      const listAction=event.target.closest('[data-list-action]');if(listAction){const id=listAction.closest('[data-list-id]').dataset.listId,action=listAction.dataset.listAction;if(action==='open'){uiUpdate(()=>{state.activeListId=id;state.activeSceneId=state.shotLists.find(l=>l.id===id).scenes[0].id});closeDialog('listDialog')}if(action==='rename')await renameShotList(id);if(action==='duplicate')duplicateShotList(id);if(action==='delete')await deleteShotList(id);return}
      const personAction=event.target.closest('[data-person-action]');if(personAction){const id=personAction.closest('[data-person-id]').dataset.personId;if(personAction.dataset.personAction==='edit')await editCollaborator(id);else await deleteCollaborator(id);return}
      const removeTag=event.target.closest('[data-remove-breakdown]');if(removeTag){const index=Number(removeTag.dataset.removeBreakdown);commit(()=>currentScene().breakdown.splice(index,1),'Breakdown element removed');renderBreakdownUtility();return}
      const utilitySave=event.target.closest('[data-utility-save]');if(utilitySave){saveUtility(utilitySave.dataset.utilitySave);return}
      if(event.target.closest('#addBreakdownButton')){addBreakdownTag();return}if(event.target.closest('[data-plan-export]')){exportScheduleCsv();return}
      const shootToggle=event.target.closest('[data-shoot-toggle]');if(shootToggle){const scene=findScene(shootToggle.dataset.sceneId),shot=scene?.items.find(i=>i.id===shootToggle.dataset.shootToggle);if(shot)commit(()=>shot.complete=shootToggle.checked,'Shoot progress updated');renderShootUtility();return}
      if(event.target.closest('[data-reset-workspace]')){await resetWorkspace();return}
      const columnMove=event.target.closest('[data-column-move]');if(columnMove){moveColumn(columnMove.dataset.columnId,columnMove.dataset.columnMove);return}
      if(!event.target.closest('.popover'))closePopover();
    });

    $('#homeButton')?.addEventListener('dblclick',()=>showToast('Shot List home'));
    $('#addNewButton').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{label:'New Shot',action:'new-shot',icon:'🎬'},{label:'New Camera Setup',action:'new-setup',icon:'≡'},{label:'New Banner / Break',action:'new-banner',icon:'●'},{separator:true},{label:'New Scene',action:'new-scene',icon:'◉'}],{addMenu:'true'})});
    $('#popoverLayer').addEventListener('click',event=>{const action=event.target.closest('[data-action]');if(!action)return;const pop=action.closest('.menu-popover');if(pop?.dataset.addMenu){if(action.dataset.action==='new-shot')openShotDialog();if(action.dataset.action==='new-setup')openSetupDialog();if(action.dataset.action==='new-banner')openBannerDialog();if(action.dataset.action==='new-scene')openSceneDialog();closePopover()}});
    $('#emptyAddButton').addEventListener('click',event=>{if(event.currentTarget.dataset.action==='clear-filter')uiUpdate(()=>{state.search='';state.filter='all'});else openShotDialog()});
    $('#addSceneButton').addEventListener('click',()=>openSceneDialog());
    $('#panelToggle').addEventListener('click',()=>{$('#scenePanel').classList.toggle('collapsed');render()});
    $('#listViewButton').addEventListener('click',()=>uiUpdate(()=>state.viewMode='list'));$('#boardViewButton').addEventListener('click',()=>uiUpdate(()=>state.viewMode='board'));
    $('#searchInput').addEventListener('input',event=>{state.search=event.target.value;saveState();render()});$('#filterSelector').addEventListener('change',event=>uiUpdate(()=>state.filter=event.target.value));
    $('#listSelector').addEventListener('change',event=>uiUpdate(()=>{state.activeListId=event.target.value;state.activeSceneId=currentList().scenes[0].id}));
    $('#listManageButton').addEventListener('click',()=>{renderListManager();$('#listDialog').showModal()});$('#newListButton').addEventListener('click',createShotList);
    $('#columnsButton').addEventListener('click',()=>{$('#columnsDialog').showModal();renderColumnOptions()});
    $('#columnOptions').addEventListener('change',event=>{if(!event.target.dataset.column)return;const col=event.target.dataset.column;commit(()=>{if(event.target.checked){const menuIndex=state.visibleColumns.indexOf('menu');state.visibleColumns.splice(menuIndex,0,col)}else state.visibleColumns=state.visibleColumns.filter(c=>c!==col)},'Columns updated')});
    $('#resetColumnsButton').addEventListener('click',()=>commit(()=>state.visibleColumns=[...DEFAULT_COLUMNS],'Columns reset'));
    $('#undoButton').addEventListener('click',undo);$('#redoButton').addEventListener('click',redo);$('#helpButton').addEventListener('click',()=>$('#helpDialog').showModal());$('#shareButton').addEventListener('click',shareSummary);
    $('#collaboratorsButton').addEventListener('click',openCollaborators);$('#addCollaboratorButton').addEventListener('click',addCollaborator);
    $('#companyButton').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{label:'Rename project',action:'rename-project',icon:'✎'},{label:'Manage shot lists',action:'manage-lists',icon:'☷'},{label:'Collaborators',action:'collaborators',icon:'●'},{label:'Settings',action:'settings',icon:'⚙'},{separator:true},{label:'Export backup',action:'json',icon:'⇩'},{label:'Reset demo project',action:'reset',icon:'↻',danger:true}],{})});
    $('#profileButton').addEventListener('click',()=>openUtility('settings'));
    $('#projectNameButton').addEventListener('click',renameProject);$('#sceneNumberButton').addEventListener('click',()=>openSceneDialog(currentScene().id));$('#sceneHeadingButton').addEventListener('click',()=>openSceneDialog(currentScene().id));
    $('#sceneActionsButton').addEventListener('click',event=>{event.stopPropagation();openSceneMenu(event.currentTarget,currentScene().id)});
    $('#selectAllButton').addEventListener('click',()=>commit(()=>{const shots=shotItems(),all=shots.length&&shots.every(s=>s.selected);shots.forEach(s=>s.selected=!all)},'Selection updated'));
    $('#clearCompletedButton').addEventListener('click',async()=>{const done=shotItems().filter(s=>s.complete);if(!done.length)return showToast('No completed shots');if(await askConfirm('Clear completed shots?',`Delete ${done.length} completed shot${done.length===1?'':'s'}?`))deleteItems(done.map(s=>s.id),'Completed shots cleared')});
    $('#exportButton').addEventListener('click',()=>$('#exportDialog').showModal());$('#importButton').addEventListener('click',()=>$('#jsonFileInput').click());
    $('#moreButton').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{label:'Export…',action:'export',icon:'⇩'},{label:'Export Project JSON',action:'json',icon:'{}'},{label:'Manage Shot Lists',action:'manage-lists',icon:'☷'},{separator:true},{label:'Reset Demo Project',action:'reset',icon:'↻',danger:true}],{})});
    $$('#exportDialog [data-export]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.export;
      if(action==='shot-pdf-current')printShotList('current-scene');
      if(action==='shot-pdf-film')printShotList('current-list');
      if(action==='shot-pdf-all')printShotList('all');
      if(action==='storyboard-current')printStoryboard('current-scene');
      if(action==='storyboard-film')printStoryboard('current-list');
      if(action==='storyboard-all')printStoryboard('all');
      if(action==='csv-current')exportCsv('current-scene');
      if(action==='csv-film')exportCsv('current-list');
      if(action==='csv-all')exportCsv('all');
      if(action==='json')exportJson();
      closeDialog('exportDialog');
    }));
    $('#shotForm').addEventListener('submit',event=>{event.preventDefault();saveShotFromForm();closeDialog('shotDialog')});$('#setupForm').addEventListener('submit',event=>{event.preventDefault();saveSetup();closeDialog('setupDialog')});$('#bannerForm').addEventListener('submit',event=>{event.preventDefault();saveBanner();closeDialog('bannerDialog')});$('#sceneForm').addEventListener('submit',event=>{event.preventDefault();saveScene();closeDialog('sceneDialog')});
    $('#chooseShotImageButton').addEventListener('click',()=>{pendingImageTarget={kind:'form'};$('#imageFileInput').click()});$('#removeShotImageButton').addEventListener('click',()=>{pendingShotImageData=svgFrame($('#formDescription').value||'SHOT');$('#formImagePreview').src=pendingShotImageData});
    $('#jsonFileInput').addEventListener('change',event=>{const file=event.target.files[0];if(file)importProjectFile(file);event.target.value=''});
    $('#imageFileInput').addEventListener('change',async event=>{const file=event.target.files[0],target=pendingImageTarget;event.target.value='';pendingImageTarget=null;if(file&&target)await handleImageFile(file,target)});
    $('#moodImageFileInput').addEventListener('change',async event=>{const files=[...event.target.files];event.target.value='';if(files.length)await addMoodImages(files)});
    $('#promptForm').addEventListener('submit',event=>{event.preventDefault();finishPrompt($('#promptInput').value.trim())});$('#confirmAcceptButton').addEventListener('click',()=>finishConfirm(true));
    document.addEventListener('keydown',event=>{if(event.target?.id==='breakdownInput'&&event.key==='Enter'){event.preventDefault();addBreakdownTag();return}if((event.target?.id==='collaboratorName'||event.target?.id==='collaboratorRole')&&event.key==='Enter'){event.preventDefault();addCollaborator();return}const tag=document.activeElement?.tagName,editing=['INPUT','TEXTAREA','SELECT'].includes(tag);const mod=event.metaKey||event.ctrlKey;if(mod&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return}if(editing)return;if(event.key==='/'){event.preventDefault();$('#searchInput').focus();return}if(event.key.toLowerCase()==='n'){event.preventDefault();openShotDialog()}if(event.key.toLowerCase()==='s'){event.preventDefault();openSetupDialog()}if(event.key.toLowerCase()==='b'){event.preventDefault();openBannerDialog()}if(event.key==='Escape')closePopover()});

    bindDragContainer($('#shotTable'),'[data-item-id]','scene-item');bindDragContainer($('#boardView'),'[data-item-id]','scene-item');bindDragContainer($('#auxView'),'[data-item-id]','scene-item');bindDragContainer($('#sceneList'),'[data-scene-id]','scene');bindDragContainer($('#auxView'),'[data-mood-id]','mood');
  }

  function moveColumn(col,direction){ const optional=state.visibleColumns.filter(c=>!COLUMN_DEFS[c]?.fixed); const index=optional.indexOf(col); if(index<0)return;const target=direction==='up'?index-1:index+1;if(target<0||target>=optional.length)return;[optional[index],optional[target]]=[optional[target],optional[index]];commit(()=>state.visibleColumns=['select',...optional,'menu'],'Column order updated'); }
  function bindDragContainer(container,selector,kind){
    container.addEventListener('dragstart',event=>{const element=event.target.closest(selector);if(!element)return;if(kind==='scene-item'&&container.id==='shotTable'&&!event.target.closest('.drag-handle,.grip,.banner-icon')){event.preventDefault();return}if(kind==='scene-item'&&container.id==='boardView'&&!event.target.closest('.board-drag')){event.preventDefault();return}if(kind==='scene-item'&&container.id==='auxView'&&!event.target.closest('.story-drag')){event.preventDefault();return}if(kind==='scene'&&!event.target.closest('.scene-drag')){event.preventDefault();return}if(kind==='mood'&&!event.target.closest('.mood-drag')){event.preventDefault();return}const id=element.dataset.itemId||element.dataset.sceneId||element.dataset.moodId;dragged={kind,id};element.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',id)});
    container.addEventListener('dragover',event=>{if(!dragged||dragged.kind!==kind)return;const target=event.target.closest(selector);const id=target&&(target.dataset.itemId||target.dataset.sceneId||target.dataset.moodId);if(!target||id===dragged.id)return;event.preventDefault();setDropTarget(target,event)});
    container.addEventListener('drop',event=>{if(!dragged||dragged.kind!==kind)return;const target=event.target.closest(selector);const targetId=target&&(target.dataset.itemId||target.dataset.sceneId||target.dataset.moodId);if(!targetId||targetId===dragged.id)return;event.preventDefault();const sourceId=dragged.id,after=dropAfter;if(kind==='scene-item')commit(()=>reorderSceneItems(sourceId,targetId,after),'Shooting order updated');if(kind==='scene')commit(()=>reorderScenes(sourceId,targetId,after),'Scene order updated');if(kind==='mood')commit(()=>reorderMood(sourceId,targetId,after),'Mood board reordered');dragged=null;clearDropClasses()});
    container.addEventListener('dragend',()=>{dragged=null;clearDropClasses();$$('.dragging').forEach(el=>el.classList.remove('dragging'))});
  }

  fillSelects(); bindEvents(); render();
})();
