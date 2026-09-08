/* Harf UI. Dependency-free, local-first, and usable from a file:// URL. */
(function () {
  'use strict';
  const D=window.HarfData, C=window.HarfCore;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iconPaths={
    practice:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7m-3.5-3.5v7"/>',
    book:'<path d="M12 5v15m0-15C8 2 4 3 2.5 4v15c3-1.5 6.5-1 9.5 1 3-2 6.5-2.5 9.5-1V4c-2-1-5.5-2-9.5 1Z"/>',
    chart:'<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
    arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    keyboard:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 15h10"/>',
    settings:'<path d="m10 3-.7 2.1-2 .9-2.1-.5-2 3.4 1.5 1.6v2.4l-1.5 1.7 2 3.4 2.1-.5 2 .9.7 2.1h4l.7-2.1 2-.9 2.1.5 2-3.4-1.5-1.7v-2.4L21 8.9l-2-3.4-2.2.5-2-.9L14 3Z"/><circle cx="12" cy="11.8" r="3"/>',
    sliders:'<path d="M4 6h7m4 0h5M4 12h3m4 0h9M4 18h10m4 0h2"/><circle cx="13" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    letter:'<path d="M5 9v4c0 4 14 4 14 0V9M12 19h.01"/>',
    vowels:'<path d="M5 11v3c0 4 14 4 14 0v-3M12 20h.01M9 5l6-2"/>',
    wave:'<path d="M2 12c4-12 6 12 10 0s6 12 10 0M5 21h14"/>',
    link:'<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(2 1)"/>',
    spark:'<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/>',
    bulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    leaf:'<path d="M20 3c-8-1-16 2-15 10a6 6 0 0 0 9 5c5-3 6-9 6-15ZM4 21l11-12"/>',
    skip:'<path d="m5 5 10 7-10 7ZM19 5v14"/>',
    shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    flag:'<path d="M5 21V3c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
    repeat:'<path d="M3 11a9 9 0 0 1 15-6l3 3M21 3v5h-5M21 13A9 9 0 0 1 6 19l-3-3M3 21v-5h5"/>',
    heart:'<path d="M20.5 5a5.5 5.5 0 0 0-8.5 1A5.5 5.5 0 0 0 3.5 5c-4 5 4 12 8.5 15 4.5-3 12.5-10 8.5-15Z"/>'
  };
  const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.spark}</svg>`;
  function fillIcons(scope=document){scope.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
  let storage;try{storage=window.localStorage;}catch{storage=null;}
  const loaded=C.loadProfile(storage);
  let profile=loaded.profile, view='practice', state=null, autoTimer=null, toastTimer=null, storageWarned=false, letterDraft=null, pendingImport=null, composing=false;
  const modal=$('modal');
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  function applyAppearance(){
    document.documentElement.dataset.theme=profile.settings.theme==='system'?(media.matches?'dark':'light'):profile.settings.theme;
    document.documentElement.dataset.font=profile.settings.font;
  }
  if(media.addEventListener)media.addEventListener('change',applyAppearance);
  function toast(message){clearTimeout(toastTimer);const el=$('toast'),host=modal.open?modal:document.body;if(el.parentElement!==host)host.append(el);el.textContent=message;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,6500);}
  function save(){
    const ok=C.saveProfile(storage,profile);
    $('storage-label').textContent=ok?'Saved on this device':'Session-only progress';
    if(!ok&&!storageWarned){storageWarned=true;toast('Browser storage is unavailable. Practice still works; export your progress before closing.');}
    return ok;
  }
  function clearAuto(){clearTimeout(autoTimer);autoTimer=null;}
  function focusAnswer(){if(view==='practice'&&!modal.open&&!$('exercise-area').hidden)$('answer-input').focus({preventScroll:true});}
  function modeFor(id){return D.modes.find(m=>m.id===id)||D.modes[1];}
  function accuracy(results){return results.length?Math.round(100*results.filter(r=>r.clean).length/results.length):null;}
  function labelForLetters(ids){
    for(const [key,values] of Object.entries(D.presets)){if(values.length===ids.length&&values.every(id=>ids.includes(id)))return {starter:'Starter set',familiar:'Familiar sounds',challenging:'Distinctive sounds',all:'Full alphabet + hamza'}[key];}
    return 'Your custom set';
  }
  function showView(next,focus=false){
    view=['practice','alphabet','progress'].includes(next)?next:'practice';
    ['practice','alphabet','progress'].forEach(id=>$(id+'-view').hidden=id!==view);
    document.querySelectorAll('.nav-item').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    $('breadcrumb-current').textContent={practice:'Practice',alphabet:'Alphabet',progress:'Your progress'}[view];
    document.title=`Harf — ${{practice:'Arabic reading practice',alphabet:'The Arabic alphabet',progress:'Your reading progress'}[view]}`;
    try{history.replaceState(null,'','#'+view);}catch{}
    if(view!=='practice')clearAuto();
    if(view==='alphabet')renderAlphabet();
    if(view==='progress')renderProgress();
    if(focus)$('main').focus({preventScroll:true});
  }
  function renderModes(){
    $('modes').innerHTML=D.modes.map(m=>`<button class="mode-button ${!state?.mixed&&profile.settings.mode===m.id?'active':''}" data-mode="${m.id}" aria-pressed="${!state?.mixed&&profile.settings.mode===m.id}" title="${esc(m.description)}"><span class="mode-icon">${icon(m.icon)}</span><span><strong>${m.name}</strong><small>${m.short}</small></span>${!state?.mixed&&profile.settings.mode===m.id?'<span class="mode-selected-dot"></span>':''}</button>`).join('');
  }
  function renderSet(){
    const s=profile.settings, mode=s.mode;
    if(state?.mixed){
      $('set-content').innerHTML=`<p class="set-description">Focused review</p><p class="set-description" style="margin:12px 0 15px">${state.deck.length} previously missed or assisted cards. Letter filters do not limit this review.</p><button class="secondary-button choose-button" data-action="regular-practice">${icon('arrow')}Back to regular practice</button>`;
      return;
    }
    if(mode==='words'||mode==='rules'){
      const category=mode==='words'?s.wordCategory:s.ruleCategory;
      const options=mode==='words'?[['all','All words'],['everyday','Everyday life'],['nature','Nature'],['actions','Actions']]:[['all','All reading rules'],['shadda','Shadda · doubled sounds'],['tanwin','Tanwin · word endings'],['article','Sun & moon letters'],['hamza','Hamza & its seats'],['special','Special vowel spellings']];
      $('set-content').innerHTML=`<p class="set-description">${state.deck.length} curated cards${state.reviewOnly?' to review':''}</p><select class="category-select" id="category-select" aria-label="${mode==='words'?'Word category':'Reading rule'}">${options.map(([value,label])=>`<option value="${value}" ${category===value?'selected':''}>${label}</option>`).join('')}</select><p class="set-description" style="margin-top:12px">${mode==='words'?'Read the marked sounds. Meanings appear after your answer.':'A pronunciation rule is shown on every card. Read its ending as directed.'}</p>`;
    }else{
      const ids=s.letters;
      const note=(['short','long','joined'].includes(mode)&&ids.includes('alif')?' Alif is a vowel carrier, not a standalone consonant in this mode.':'')+(mode==='joined'&&ids.includes('hamza')?' Hamza spellings are taught in Reading rules.':'');
      $('set-content').innerHTML=`<p class="set-description">${labelForLetters(ids)} · ${state.deck.length.toLocaleString()} cards</p><div class="letter-chips" lang="ar" dir="rtl">${ids.slice(0,12).map(id=>`<span class="letter-chip">${D.byId[id].ar}</span>`).join('')}${ids.length>12?`<span class="letter-chip more" lang="en">+${ids.length-12}</span>`:''}</div><button class="secondary-button choose-button" data-action="letters">${icon('sliders')}Choose letters${icon('chevron')}</button>${['short','long'].includes(mode)?`<div class="vowel-selectors"><span>Vowels</span>${D.vowels.map(v=>`<button class="vowel-toggle" data-vowel="${v.id}" aria-pressed="${s.vowels.includes(v.id)}" aria-label="Include ${v.name}, ${mode==='long'?v.id+v.id:v.id}">${mode==='long'?v.id+v.id:v.id}</button>`).join('')}</div>`:''}${mode==='letters'?`<p class="set-description" style="margin-top:10px">${s.forms.map(f=>({isolated:'Isolated',initial:'Beginning',medial:'Middle',final:'End'})[f]).join(' · ')}</p>`:''}${note?`<p class="set-description" style="margin-top:10px">${note}</p>`:''}`;
    }
  }
  function renderStats(){
    if(!state)return;
    const acc=accuracy(state.results);
    $('session-accuracy').innerHTML=`${acc===null?'—':acc}<small>%</small>`;
    $('session-streak').textContent=state.streak;
    const today=profile.days[C.dateKey()]||{seen:0};
    $('daily-count').textContent=today.seen;$('daily-goal').textContent=profile.settings.goal;
    $('goal-fill').style.width=Math.min(100,today.seen/profile.settings.goal*100)+'%';
    $('goal-caption').textContent=today.seen>=profile.settings.goal?'Daily goal reached. Nicely done.':`${profile.settings.goal-today.seen} more to your daily goal. No rush.`;
    const total=state.target;
    const current=state.done?state.results.length:state.current?state.results.length+1:0;
    $('question-count').textContent=total?`${Math.min(current,total)} / ${total}`:`${state.results.length} read · ∞`;
    const bar=document.querySelector('.session-progress');
    bar.setAttribute('aria-valuenow',String(state.results.length));
    bar.setAttribute('aria-valuemax',String(total||Math.max(1,state.results.length+1)));
    bar.setAttribute('aria-valuetext',`${state.results.length} cards completed${total?' out of '+total:''}`);
    $('session-progress-fill').style.width=total?Math.min(100,state.results.length/total*100)+'%':'0%';
    const mins=Math.floor((Date.now()-state.startedAt)/60000);
    $('session-duration').textContent=mins?`${mins} min`:'Just started';
  }
  function settleAbandoned(){
    if(state?.current&&!state.locked&&(state.tries>0||state.assisted))recordCurrent(false,'skipped');
  }
  function startSession(reviewOnly=false,explicitDeck=null){
    clearAuto();settleAbandoned();
    const deck=explicitDeck||C.makeDeck(profile.settings,profile.records,reviewOnly);
    state={deck,scheduler:new C.Scheduler(deck,profile.records,profile.settings.adaptive),current:null,tries:0,assisted:false,locked:false,results:[],streak:0,bestStreak:0,startedAt:Date.now(),target:profile.settings.length,reviewOnly,mixed:Boolean(explicitDeck),done:false};
    renderModes();renderSet();nextCard(false);
  }
  function nextCard(focus=true){
    clearAuto();
    if(state.done){startSession(state.reviewOnly,state.mixed?state.deck:null);if(focus)focusAnswer();return;}
    if(state.target&&state.results.length>=state.target){state.done=true;renderStats();$('check-button').innerHTML=`New session${icon('arrow')}`;showSummary();return;}
    state.current=state.scheduler.next();state.tries=0;state.assisted=false;state.locked=false;
    const hasCard=Boolean(state.current);
    $('exercise-area').hidden=!hasCard;$('empty-deck').hidden=hasCard;
    $('skip-button').disabled=!hasCard;
    document.querySelectorAll('[data-insert]').forEach(b=>b.disabled=!hasCard);
    $('review-label').hidden=!(state.reviewOnly||state.mixed);
    if(!hasCard){
      const reviewing=state.reviewOnly||state.mixed;
      $('empty-message').textContent=reviewing?'Nothing needs review in this set. Keep exploring, or switch to regular practice.':'This selection has no cards in this mode. Add a consonant, or choose a different letter shape.';
      $('empty-action').textContent=reviewing?'Back to regular practice':'Choose letters';
      $('empty-action').dataset.action=reviewing?'regular-practice':'letters';
      $('session-label').textContent=modeFor(profile.settings.mode).name.toUpperCase();
      renderStats();return;
    }
    const card=state.current, mode=modeFor(card.mode);
    $('session-label').textContent=mode.name.toUpperCase();
    $('tip-title').textContent=mode.tip;$('tip-body').textContent=mode.body;
    const prompt=$('arabic-prompt');prompt.textContent=card.ar;prompt.dataset.cardId=card.id;
    prompt.classList.toggle('word',['words','rules'].includes(card.mode));
    $('prompt-label').textContent=card.label;
    $('prompt-instruction').textContent=card.mode==='letters'?'Type the sound, not the letter name.':'How does this sound?';
    $('answer-input').value='';$('answer-input').readOnly=false;$('answer-input').removeAttribute('aria-invalid');
    document.querySelector('.answer-field').classList.remove('invalid','correct');
    $('check-button').innerHTML=`Check${icon('arrow')}`;
    $('feedback').hidden=true;$('feedback').textContent='';$('feedback').className='feedback';
    $('hint-button').disabled=false;$('reveal-button').disabled=false;
    $('hint-button').innerHTML=`${icon('bulb')}Give me a hint`;
    renderStats();if(focus)focusAnswer();
  }
  function showFeedback(type,html){const el=$('feedback');el.className='feedback '+type;el.innerHTML=html;el.hidden=false;}
  function recordCurrent(clean,kind){
    if(!state.current||state.locked||state.done)return;
    state.locked=true;
    state.results.push({id:state.current.id,clean,kind,typed:$('answer-input').value});
    state.streak=clean?state.streak+1:0;state.bestStreak=Math.max(state.bestStreak,state.streak);
    profile.bestStreak=Math.max(profile.bestStreak,state.bestStreak);
    C.recordResult(profile,state.current,clean);
    if(!clean)state.scheduler.retry(state.current.id);
    save();renderStats();
  }
  function finishCard(clean,kind){
    if(!state.current||state.locked||state.done)return;
    recordCurrent(clean,kind);
    const c=state.current;
    const heading=kind==='correct'?(clean?'Nicely read.':'You got there.'):(kind==='skipped'?"Let's revisit this one.":'One to remember.');
    const msg=kind==='correct'?(clean?'First try, without a hint.':"Saved as assisted practice; it will get another turn."):"Saved for review. Take a look, then continue.";
    showFeedback(kind==='correct'?'success':'hint',`<div class="feedback-heading">${icon(kind==='correct'?'check':'book')}<strong>${heading}</strong><code class="correct-answer" dir="ltr">${esc(c.answer)}</code>${c.meaning?`<span class="translation">— ${esc(c.meaning)}</span>`:''}</div><p>${esc(c.explanation)}</p><p>${esc(msg)}</p>`);
    document.querySelector('.answer-field').classList.remove('invalid');
    document.querySelector('.answer-field').classList.toggle('correct',kind==='correct');
    $('answer-input').removeAttribute('aria-invalid');$('answer-input').readOnly=true;
    $('check-button').innerHTML=`Continue${icon('arrow')}`;
    $('hint-button').disabled=true;$('reveal-button').disabled=true;$('skip-button').disabled=true;
    document.querySelectorAll('[data-insert]').forEach(b=>b.disabled=true);
    if(profile.settings.autoAdvance&&kind==='correct'&&clean&&!modal.open&&view==='practice'&&!document.hidden){autoTimer=setTimeout(()=>nextCard(),1250);}
  }
  function submitAnswer(event){
    event.preventDefault();if(event.isComposing||composing)return;
    if(!state?.current)return;
    if(state.locked||state.done){nextCard();return;}
    const value=$('answer-input').value;
    if(!C.normalizeAnswer(value)){showFeedback('hint','Type a sound first. Use Latin letters, then press Enter.');focusAnswer();return;}
    state.tries++;
    if(C.checkAnswer(state.current,value)){finishCard(state.tries===1&&!state.assisted,'correct');}
    else{
      $('answer-input').setAttribute('aria-invalid','true');document.querySelector('.answer-field').classList.add('invalid');
      showFeedback('error',`<strong>Not quite.</strong> ${esc(C.feedbackFor(state.current,value))}<p>Try again, or reveal the answer. Repeated tries count as one reviewed card.</p>`);
      $('answer-input').select();
    }
  }
  function giveHint(){
    if(!state?.current||state.locked||state.done)return;
    state.assisted=true;$('hint-button').disabled=true;
    showFeedback('hint',`<div class="feedback-heading">${icon('bulb')}<strong>A little help</strong></div><p>${esc(state.current.hint)}</p><p>This card will count as assisted, not first-try accuracy.</p>`);focusAnswer();
  }
  function openModal(title,eyebrow,body){
    clearAuto();$('modal-title').textContent=title;$('modal-eyebrow').textContent=eyebrow;$('modal-body').innerHTML=body;
    if(!modal.open){modal.showModal();document.body.classList.add('body-lock');}
    modal.scrollTop=0;$('modal-title').focus({preventScroll:true});
  }
  function closeModal(){if(modal.open)modal.close();}
  modal.addEventListener('close',()=>{document.body.classList.remove('body-lock');if($('toast').parentElement===modal)document.body.append($('toast'));pendingImport=null;});
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  function openLetters(){
    letterDraft={letters:[...profile.settings.letters],forms:[...profile.settings.forms]};
    openModal('Build your practice set.','MAKE IT YOURS',`<p class="modal-intro">Start small, or take on the whole alphabet. Practice tests the <strong>sound</strong>, not the letter name. Applying a set starts a new session; recorded progress is kept.</p><div class="preset-row">${Object.keys(D.presets).map(key=>`<button class="preset-button" data-preset="${key}">${{starter:'Starter set',familiar:'Familiar sounds',challenging:'Distinctive sounds',all:'Select all'}[key]}</button>`).join('')}<button class="preset-button" data-preset="none">Clear</button></div><form id="letter-form"><div class="letter-picker">${D.letters.map(l=>`<label class="letter-option" title="${esc(l.name)}"><input type="checkbox" name="letter" value="${l.id}" aria-label="${esc(l.name)}, ${esc(l.roman)}" ${letterDraft.letters.includes(l.id)?'checked':''}><span lang="ar" dir="rtl">${l.ar}</span><span class="picker-roman">${esc(l.roman)}</span></label>`).join('')}</div><div class="option-group"><h3>Shapes in the Letters drill</h3><div class="form-options">${['isolated','initial','medial','final'].map(form=>`<label><input type="checkbox" name="form" value="${form}" ${letterDraft.forms.includes(form)?'checked':''}>${{isolated:'Isolated',initial:'Beginning',medial:'Middle',final:'End'}[form]}</label>`).join('')}</div><p>Letters that cannot join on the left have no connected beginning or middle form. Hamza (ء) is isolated. These shapes apply to Letters only; the other modes use natural joined text.</p></div><div class="modal-actions"><span class="selection-count" id="selection-count"></span><button type="button" class="secondary-button" data-action="close-modal">Cancel</button><button type="submit" class="primary-button" id="apply-letters">Start practicing${icon('arrow')}</button></div></form>`);
    updateLetterDraft();
  }
  function updateLetterDraft(){
    if(!$('letter-form'))return;
    letterDraft.letters=[...$('letter-form').querySelectorAll('[name="letter"]:checked')].map(el=>el.value);
    letterDraft.forms=[...$('letter-form').querySelectorAll('[name="form"]:checked')].map(el=>el.value);
    const valid=letterDraft.letters.length&&letterDraft.forms.length;
    const count=C.makeDeck({...profile.settings,...letterDraft}).length;
    $('selection-count').textContent=valid?`${letterDraft.letters.length} selected · ${count.toLocaleString()} cards in this mode`:'Select at least one letter and one shape.';
    $('apply-letters').disabled=!valid;
  }
  function applyLetters(event){event.preventDefault();updateLetterDraft();if($('apply-letters').disabled)return;profile.settings.letters=letterDraft.letters;profile.settings.forms=letterDraft.forms;save();closeModal();startSession();showView('practice');focusAnswer();}
  function openGuide(){
    if(view==='practice'&&state?.current&&!state.locked&&!state.done)state.assisted=true;
    const rows=[
      ['ح','H','7 or h.','Deep, voiceless throat sound; not ordinary h.'],
      ['ص','S','s.','Emphatic s.'],['ض','D','d.','Emphatic d.'],['ط','T','t.','Emphatic t.'],
      ['ظ','Z','dh. or z.','Emphatic voiced dh, not ordinary z.'],['ع','3','—','Voiced throat sound (ayn).'],['ء',"'",'2','Glottal stop (hamza), as in uh-oh.']
    ];
    openModal('Your keyboard is enough.','THE HARF TYPING GUIDE',`<p class="modal-intro">An easy-to-type, <strong>ASCII-only sound notation</strong> for this trainer. No macrons, dots under letters, or Arabic keyboard needed. It is our teaching convention, not a universal romanization standard.</p><div class="guide-vowels"><div class="guide-vowel"><strong>a · i · u</strong><small>Short vowels</small></div><div class="guide-vowel"><strong>aa · ii · uu</strong><small>Long vowels</small></div><div class="guide-vowel"><strong>ay · aw</strong><small>As in bayt and thawb</small></div></div><table class="guide-table"><thead><tr><th scope="col">Letter</th><th scope="col">Type</th><th scope="col">Also accepted</th><th scope="col">The sound</th></tr></thead><tbody>${rows.map(([ar,roman,alias,note])=>`<tr><td lang="ar" dir="rtl">${ar}</td><td><code>${esc(roman)}</code></td><td>${esc(alias)}</td><td>${note}</td></tr>`).join('')}</tbody></table><div class="guide-note"><strong>Capital letters matter.</strong> <code>H</code> is not <code>h</code>, and <code>S</code> is not <code>s</code>. No Shift key? Use dot aliases such as <code>s.</code>, or the key buttons below the answer field. Aliases work inside words too: <code>ba7r</code> = <code>baHr</code>.</div><section class="guide-section"><h3>The full sound map</h3><div class="guide-letter-grid">${D.letters.map(l=>`<div class="guide-letter" title="${esc(l.name)}"><span lang="ar" dir="rtl">${l.ar}</span><code>${esc(l.roman)}</code></div>`).join('')}</div></section><section class="guide-section"><h3>Read what is pronounced.</h3><p><strong>Digraphs:</strong> <code>th</code> as in think; <code>dh</code> as in this; <code>sh</code> as in ship; <code>kh</code> as in loch; <code>gh</code> is the voiced counterpart of kh. Standard Arabic <code>j</code> is as in jump, and <code>q</code> is distinct from k.</p><p><strong>Sukun & shadda:</strong> <span lang="ar">بْ</span> has no following vowel. Shadda doubles the consonant: <span lang="ar">مُعَلِّمْ</span> = <code>mu3allim</code>. Double the whole digraph when needed: <code>shsh</code>, not just <code>ssh</code>.</p><p><strong>Endings:</strong> follow the card's label. Noun pause forms have no added case ending. <span lang="ar">ة</span> at a pause accepts <code>a</code> or <code>ah</code>. In tanwin cards, keep the ending: <span lang="ar">مَدْرَسَةٌ</span> = <code>madrasatun</code>.</p><p><strong>The article:</strong> start each card afresh. Moon letters keep <code>al-</code>; sun letters assimilate the l: <span lang="ar">اَلشَّمْسْ</span> = <code>ash-shams</code>. This trainer does not test linking between separate words.</p><p><strong>Hamza:</strong> an initial apostrophe is optional on vowel-bearing cards: <code>'akala</code> or <code>akala</code>. Inside and at the end of a word it is required: <code>sa'ala</code> or <code>sa2ala</code>. The standalone letter <span lang="ar">ء</span> requires <code>'</code> or <code>2</code>.</p><p><strong>Alif, waw, yaa:</strong> in the Letters drill, <span lang="ar">ا</span> = <code>aa</code>, <span lang="ar">و</span> = <code>w</code>, and <span lang="ar">ي</span> = <code>y</code>. Long-vowel drills teach the vowel uses. Alif maqsura <span lang="ar">ى</span> and dagger alif <span lang="ar">ٰ</span> are long <code>aa</code>.</p><p><strong>Flexible spacing:</strong> spaces and hyphens are ignored. Curly apostrophes are accepted. Vowel length and distinct consonants are never silently merged.</p></section><div class="guide-note"><strong>A reading tool, not a pronunciation exam.</strong> These keys represent sounds but cannot check how you speak. Use native-speaker listening alongside this trainer. Opening this guide during an unanswered card marks that card as assisted.</div><div class="modal-actions"><button class="primary-button" data-action="close-modal">Back to it${icon('arrow')}</button></div>`);
  }
  function openSettings(){
    const s=profile.settings;
    const select=(id,opts,current)=>`<select id="${id}" aria-label="${id.replace('setting-','').replace(/-/g,' ')}">${opts.map(([v,l])=>`<option value="${v}" ${String(current)===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
    openModal('Make yourself at home.','PRACTICE SETTINGS',`<form id="settings-form"><div class="settings-row"><div><strong>Session length</strong><small>Choose a small finish line, or keep reading freely.</small></div>${select('setting-length',[[10,'10 cards'],[20,'20 cards'],[50,'50 cards'],[0,'Endless']],s.length)}</div><div class="settings-row"><div><strong>Adaptive practice</strong><small>Bring back missed cards after a few others. Favor new or due cards. Off: shuffle the set without replacement.</small></div><label class="switch"><input id="setting-adaptive" type="checkbox" ${s.adaptive?'checked':''} aria-label="Adaptive practice"></label></div><div class="settings-row"><div><strong>Automatic next card</strong><small>Move on after a clean correct answer. Mistakes and hints always wait for you to continue.</small></div><label class="switch"><input id="setting-auto" type="checkbox" ${s.autoAdvance?'checked':''} aria-label="Automatic next card"></label></div><div class="settings-row"><div><strong>Daily goal</strong><small>Completed cards count, including assisted ones.</small></div>${select('setting-goal',[[10,'10 cards'],[20,'20 cards'],[30,'30 cards'],[50,'50 cards']],s.goal)}</div><div class="settings-row"><div><strong>Appearance</strong><small>A quiet palette, by day or by night.</small></div>${select('setting-theme',[['light','Light'],['dark','Dark'],['system','Use device setting']],s.theme)}</div><div class="settings-row"><div><strong>Arabic letter style</strong><small>Uses the Arabic fonts available on your device. No font downloads are required.</small></div>${select('setting-font',[['naskh','Traditional / Naskh'],['sans','Simple / Sans']],s.font)}</div><div class="guide-note">Changing session length or adaptive practice starts a new session. Appearance and daily goal changes keep your place. No account or server is used.</div><div class="modal-actions"><button type="button" class="secondary-button" data-action="close-modal">Cancel</button><button type="submit" class="primary-button">Save settings${icon('check')}</button></div></form><section class="option-group"><h3>Your data belongs to you.</h3><p>Progress stays in this browser. Export a backup before clearing browser data or changing devices. Import replaces the current profile only after you confirm.</p><div class="data-buttons"><button class="secondary-button" data-action="export">${icon('download')}Export</button><button class="secondary-button" data-action="import">Import backup</button><button class="secondary-button danger-button" data-action="reset-confirm">Reset progress</button></div></section>`);
  }
  function applySettings(event){
    event.preventDefault();
    const old=profile.settings;
    const next=C.sanitizeSettings({...old,length:Number($('setting-length').value),adaptive:$('setting-adaptive').checked,autoAdvance:$('setting-auto').checked,goal:Number($('setting-goal').value),theme:$('setting-theme').value,font:$('setting-font').value});
    const restart=old.length!==next.length||old.adaptive!==next.adaptive;
    profile.settings=next;clearAuto();save();applyAppearance();closeModal();
    if(restart)startSession();else renderStats();
    if(view==='progress')renderProgress();toast('Settings saved.');
  }
  function letterHistory(id){
    const records=Object.entries(profile.records).filter(([cid])=>{const card=C.cardMap.get(cid);return ['letters','short','long'].includes(card?.mode)&&card.letters.includes(id);}).map(([,r])=>r);
    return !records.length?'new':records.some(r=>r.box>=3)?'comfortable':'learning';
  }
  function renderAlphabet(){
    const query=$('alphabet-search').value.trim();
    const list=D.letters.filter(l=>!query||l.ar.includes(query)||l.name.toLowerCase().includes(query.toLowerCase())||l.roman===query);
    $('alphabet-grid').innerHTML=list.map(l=>`<button class="alphabet-tile" data-letter-detail="${l.id}" aria-label="${esc(l.name)}: ${esc(l.roman)}. View letter details."><span class="letter-status ${letterHistory(l.id)}" title="${letterHistory(l.id)==='new'?'Not practiced yet':letterHistory(l.id)==='learning'?'Learning':'Some drills are comfortable'}"></span><span class="letter-ar" lang="ar" dir="rtl">${l.ar}</span><span class="letter-roman">${esc(l.roman)}</span><span class="letter-name">${l.name}</span></button>`).join('');
    $('alphabet-empty').hidden=list.length!==0;
  }
  function openLetterDetail(id){
    const l=D.byId[id];if(!l)return;
    const available=D.cards.filter(c=>c.mode==='letters'&&c.letters[0]===id);
    const forms=['isolated','initial','medial','final'].map(form=>{
      const c=available.find(c=>c.form===form);
      return `<div class="letter-form ${c?'':'unavailable'}">${c?`<span lang="ar" dir="rtl">${c.ar}</span>`:'<span>—</span>'}<small>${{isolated:'Isolated',initial:'Beginning',medial:'Middle',final:'End'}[form]}</small></div>`;
    }).join('');
    const examples=D.cards.filter(c=>c.mode==='short'&&c.letters[0]===id).map(c=>`<div><span lang="ar" dir="rtl">${c.ar}</span><code>${esc(c.answer)}</code></div>`).join('');
    openModal(l.name,'ONE LETTER. A WORLD OF POSSIBILITIES.',`<div class="letter-detail-hero"><span class="detail-glyph" lang="ar" dir="rtl">${l.ar}</span><div><code>${esc(l.roman)}</code><p>${l.note}</p></div></div><div class="letter-forms">${forms}</div><p class="modal-intro" style="margin-top:15px">${l.joining==='join'?'This letter joins on both sides when neighboring letters allow it.':l.joining==='break'?'This letter can join to the preceding letter on its right, but never to the next letter on its left.':'Standalone hamza does not join. Its other written seats are taught in Reading rules.'} The connecting stroke itself has no sound.</p>${examples?`<section class="guide-section"><h3>Add a short vowel.</h3><div class="vowel-demo">${examples}</div></section>`:''}<div class="modal-actions"><button class="secondary-button" data-action="close-modal">Back to alphabet</button><button class="primary-button" data-practice-letter="${id}">Practice this sound${icon('arrow')}</button></div>`);
  }
  function renderProgress(){
    const t=C.totals(profile);
    const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const key=C.dateKey(d);return {key,label:d.toLocaleDateString(undefined,{weekday:'short'}),count:profile.days[key]?.seen||0};});
    const max=Math.max(profile.settings.goal,...days.map(d=>d.count));
    const review=Object.entries(profile.records).filter(([,r])=>r.streak===0).sort((a,b)=>b[1].lastSeen-a[1].lastSeen).map(([id])=>C.cardMap.get(id));
    $('progress-content').innerHTML=`<div class="progress-metrics"><div class="metric-card"><span>Cards completed</span><strong>${t.seen.toLocaleString()}</strong><small>${t.explored.toLocaleString()} distinct cards explored</small></div><div class="metric-card"><span>First-try accuracy</span><strong>${t.accuracy===null?'—':t.accuracy+'%'}</strong><small>Correct without hints or retries</small></div><div class="metric-card"><span>Best reading streak</span><strong>${profile.bestStreak}</strong><small>Clean answers in one session</small></div><div class="metric-card"><span>Comfortable cards</span><strong>${t.comfortable}</strong><small>At least 3 clean recalls in a row</small></div></div><div class="progress-layout"><section class="progress-panel"><h2>A little, every day.</h2><p>Your completed cards over the last seven days.</p><div class="week-chart" aria-label="Cards completed by day">${days.map((d,i)=>`<div class="week-day ${i===6?'today':''}" aria-label="${d.key}: ${d.count} completed"><b>${d.count}</b><div class="bar" style="height:${Math.max(2,d.count/max*120)}px" aria-hidden="true"></div><span>${esc(d.label)}</span></div>`).join('')}</div></section><section class="progress-panel"><h2>Your reading path</h2><p>Distinct cards explored in each type of practice.</p><div class="mode-progress">${D.modes.map(m=>{const total=D.cards.filter(c=>c.mode===m.id).length;const explored=Object.keys(profile.records).filter(id=>C.cardMap.get(id)?.mode===m.id).length;return `<div class="mode-progress-row"><div><span>${m.name}</span><span>${explored.toLocaleString()} / ${total.toLocaleString()}</span></div><div class="goal-track"><span style="width:${explored/total*100}%"></span></div></div>`;}).join('')}</div></section></div><section class="progress-panel review-panel"><div class="review-panel-heading"><div><h2>Worth another look.</h2><p>${review.length?`${review.length} cards most recently missed, skipped, or assisted.`:'A wrong answer is just a useful place to begin again.'}</p></div>${review.length?`<button class="secondary-button" data-action="review-all">${icon('repeat')}Review these cards</button>`:''}</div>${review.length?`<div class="review-grid">${review.slice(0,12).map(c=>`<div class="review-item"><span lang="ar" dir="rtl">${c.ar}</span><code>${esc(c.answer)}</code><small>${modeFor(c.mode).name}</small></div>`).join('')}</div>${review.length>12?`<p class="set-description" style="margin-top:15px">Showing the 12 most recent. Review includes all ${review.length} cards.</p>`:''}`:`<div class="review-empty">${t.seen?'Nothing is waiting for review. Keep your reading rhythm going.':'No practice history yet. Your first answered card starts the story.'}<br><button class="text-button" data-view="practice" style="margin-top:12px">Back to practice${icon('arrow')}</button></div>`}</section><p class="progress-data-note">“Comfortable” is a practice heuristic, not a proficiency assessment. Hints, guide use, retries, reveals, and skips do not count as clean first-try answers. Progress is local to this browser and origin; export a backup to carry it elsewhere.</p>`;
  }
  function showSummary(){
    clearAuto();
    const results=state.results, clean=results.filter(r=>r.clean).length;
    const missed=[...new Set(results.filter(r=>!r.clean).map(r=>r.id))];
    openModal('A little further than before.','SESSION COMPLETE',`<div class="summary-hero"><span class="summary-symbol">${icon('leaf')}</span><h3>${results.length?'That is how reading grows.':'A fresh page is waiting.'}</h3><p>${results.length?`You worked through ${results.length} cards. Every careful look counts.`:'Start with a few letters and let the sounds come together.'}</p></div><div class="summary-stats"><div><strong>${results.length}</strong><span>Cards completed</span></div><div><strong>${results.length?Math.round(100*clean/results.length)+'%':'—'}</strong><span>First-try accuracy</span></div><div><strong>${state.bestStreak}</strong><span>Best streak</span></div></div>${missed.length?`<section class="guide-section"><h3>Keep these sounds close.</h3><p>These needed help during the session. Review them once more, or start a fresh set.</p><div class="summary-list">${missed.slice(0,10).map(id=>{const c=C.cardMap.get(id);return `<div><span lang="ar" dir="rtl">${c.ar}</span><code>${esc(c.answer)}</code></div>`;}).join('')}</div>${missed.length>10?`<p style="margin-top:10px">And ${missed.length-10} more.</p>`:''}</section>`:'<div class="guide-note">A new session changes the order. Choose another practice type whenever you feel ready.</div>'}<div class="modal-actions"><button class="secondary-button" data-action="summary-progress">View progress</button>${missed.length?`<button class="secondary-button" data-action="review-session">${icon('repeat')}Review ${missed.length}</button>`:''}<button class="primary-button" data-action="restart">Practice again${icon('arrow')}</button></div>`);
  }
  function endSession(){if(!state)return;settleAbandoned();state.done=true;clearAuto();if(state.current){$('check-button').innerHTML=`New session${icon('arrow')}`;$('answer-input').readOnly=true;$('hint-button').disabled=true;$('reveal-button').disabled=true;$('skip-button').disabled=true;document.querySelectorAll('[data-insert]').forEach(b=>b.disabled=true);}renderStats();showSummary();}
  function openAbout(){
    openModal('A little Arabic, every day.','ABOUT HARF',`<p class="modal-intro">Harf is a focused reading trainer inspired by the select-and-type loop of Real Kana. Its original interface and lesson data are designed around <strong>Modern Standard Arabic</strong>, not a regional dialect.</p><section class="guide-section"><h3>What you are practicing</h3><p>Letter sounds and contextual shapes, short and long vowels, joined sound combinations, ${D.cards.filter(c=>c.mode==='words').length} vocabulary cards, and ${D.cards.filter(c=>c.mode==='rules').length} reading-rule cards. All prompts have explicit answer keys. Generated combinations are sound exercises, not claims about real vocabulary.</p><p>Arabic vowel marks remain visible. Noun pause forms and fully pronounced endings are separate tasks. This is not an unvoweled-text translator, a speech evaluator, a grammar course, or a tajweed tutor.</p></section><section class="guide-section"><h3>Private by design</h3><p>No accounts, ads, analytics, external scripts, or network requests. Your choices and completed-card history are stored locally when the browser permits it. The standalone file also works offline. Browser storage for local files can vary; use Export to keep a durable backup.</p><p>Adaptive practice is a lightweight heuristic: new and due cards get more weight; mistakes return after intervening cards. Clean recalls move through intervals of 10 minutes, 1 day, 3 days, 7 days, and 21 days. This is not a validated measure of fluency.</p></section><section class="guide-section"><h3>Reading references</h3><p>Original teaching prompts informed by these reading and pronunciation references. English sound comparisons are approximate; learning the actual sounds also requires listening.</p><div class="source-list">${D.sources.map(s=>`<div><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.author} · ${s.title} ↗</a><small>${s.description}</small></div>`).join('')}</div></section><section class="guide-section"><h3>Keyboard shortcuts</h3><p><kbd>Enter</kbd> checks your answer or continues. <kbd>Alt</kbd> + <kbd>H</kbd> gives a hint. <kbd>?</kbd> opens the guide when you are not typing in a field. <kbd>Esc</kbd> closes a dialog. Automatic advance pauses when you leave practice or open a dialog.</p></section><div class="modal-actions"><button class="primary-button" data-action="close-modal">Back to reading${icon('arrow')}</button></div>`);
  }
  function exportProfile(){
    const json=JSON.stringify({...profile,exportedAt:new Date().toISOString()},null,2);
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`harf-progress-${C.dateKey()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress exported. Keep the JSON file as your backup.');
  }
  function confirmReset(){
    openModal('Start with a clean page?','RESET PROGRESS',`<p class="modal-intro">This removes practice history, daily totals, and streaks from this browser. Your current settings stay. Export a backup first to keep a copy.</p><div class="modal-actions"><button class="secondary-button" data-action="export">Export first</button><button class="secondary-button" data-action="close-modal">Cancel</button><button class="secondary-button danger-button" data-action="reset">Reset my progress</button></div>`);
  }
  async function importFile(file){
    if(!file)return;
    if(file.size>4*1024*1024){toast('That file is too large. Choose a Harf JSON backup under 4 MB.');return;}
    try{
      const incoming=C.validateProfile(JSON.parse(await file.text()));
      const t=C.totals(incoming);
      openModal('Bring your progress here.','IMPORT BACKUP',`<p class="modal-intro">This backup contains <strong>${t.seen.toLocaleString()} completed cards</strong> and <strong>${t.explored.toLocaleString()} distinct cards</strong>. Importing replaces this browser's current progress and settings. It does not merge profiles.</p><div class="modal-actions"><button class="secondary-button" data-action="export">Export current first</button><button class="secondary-button" data-action="close-modal">Cancel</button><button class="primary-button" data-action="import-confirm">Replace with backup${icon('check')}</button></div>`);
      pendingImport=incoming;
    }catch(error){toast('Could not import that file. '+(error instanceof SyntaxError?'Choose a valid JSON backup exported by Harf.':error.message));}
  }
  const actions={
    'guide':openGuide,'letters':openLetters,'settings':openSettings,'about':openAbout,'close-modal':closeModal,
    'hint':giveHint,'reveal':()=>finishCard(false,'revealed'),'skip':()=>finishCard(false,'skipped'),'finish':endSession,
    'export':exportProfile,'import':()=>{$('import-file').value='';$('import-file').click();},
    'reset-confirm':confirmReset,
    'reset':()=>{const settings=profile.settings;profile=C.freshProfile();profile.settings=settings;state=null;closeModal();save();startSession();if(view==='progress')renderProgress();if(view==='alphabet')renderAlphabet();toast('Progress reset. A fresh start.');},
    'import-confirm':()=>{if(!pendingImport)return;const incoming=pendingImport;state=null;clearAuto();profile=incoming;closeModal();save();applyAppearance();startSession();if(view==='progress')renderProgress();if(view==='alphabet')renderAlphabet();toast('Backup imported. Welcome back.');},
    'regular-practice':()=>{closeModal();startSession();showView('practice');focusAnswer();},
    'restart':()=>{closeModal();startSession(state?.reviewOnly,state?.mixed?state.deck:null);showView('practice');focusAnswer();},
    'summary-progress':()=>{closeModal();showView('progress',true);},
    'review-session':()=>{const ids=[...new Set(state.results.filter(r=>!r.clean).map(r=>r.id))];closeModal();startSession(true,ids.map(id=>C.cardMap.get(id)));showView('practice');focusAnswer();},
    'review-all':()=>{const cards=Object.entries(profile.records).filter(([,r])=>r.streak===0).map(([id])=>C.cardMap.get(id));closeModal();startSession(true,cards);showView('practice');focusAnswer();},
    'joined-practice':()=>{profile.settings.mode='joined';save();startSession();showView('practice');focusAnswer();}
  };
  document.addEventListener('click',event=>{
    const btn=event.target.closest('button,a');if(!btn||btn.disabled)return;
    if(btn.dataset.view){event.preventDefault();showView(btn.dataset.view);return;}
    if(btn.dataset.action&&actions[btn.dataset.action]){event.preventDefault();actions[btn.dataset.action]();return;}
    if(btn.dataset.mode){profile.settings.mode=btn.dataset.mode;save();startSession();focusAnswer();return;}
    if(btn.dataset.vowel){const v=btn.dataset.vowel, selected=profile.settings.vowels;
      if(selected.includes(v)&&selected.length===1){toast('Keep at least one vowel selected.');return;}
      profile.settings.vowels=selected.includes(v)?selected.filter(x=>x!==v):[...selected,v];save();startSession();focusAnswer();return;
    }
    if(btn.hasAttribute('data-insert')){
      if(!state?.current||state.locked||state.done)return;
      const input=$('answer-input'),start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
      if(input.value.length-(end-start)+btn.dataset.insert.length>80){toast('Answers can be up to 80 characters.');return;}
      input.setRangeText(btn.dataset.insert,start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}));focusAnswer();return;
    }
    if(btn.dataset.preset){
      const selected=D.presets[btn.dataset.preset]||[];
      $('letter-form').querySelectorAll('[name="letter"]').forEach(el=>el.checked=selected.includes(el.value));updateLetterDraft();return;
    }
    if(btn.dataset.letterDetail){openLetterDetail(btn.dataset.letterDetail);return;}
    if(btn.dataset.practiceLetter){
      const id=btn.dataset.practiceLetter;profile.settings.letters=[id];profile.settings.mode=id==='alif'?'letters':'short';profile.settings.forms=['isolated'];save();closeModal();startSession();showView('practice');focusAnswer();
    }
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='answer-form')submitAnswer(event);
    if(event.target.id==='letter-form')applyLetters(event);
    if(event.target.id==='settings-form')applySettings(event);
  });
  document.addEventListener('change',event=>{
    if(event.target.closest('#letter-form'))updateLetterDraft();
    if(event.target.id==='category-select'){
      profile.settings[profile.settings.mode==='words'?'wordCategory':'ruleCategory']=event.target.value;save();startSession();focusAnswer();
    }
    if(event.target.id==='import-file')importFile(event.target.files?.[0]);
  });
  $('alphabet-search').addEventListener('input',renderAlphabet);
  $('answer-input').addEventListener('compositionstart',()=>composing=true);
  $('answer-input').addEventListener('compositionend',()=>composing=false);
  $('answer-input').addEventListener('input',()=>{if(!state.locked){document.querySelector('.answer-field').classList.remove('invalid');$('answer-input').removeAttribute('aria-invalid');}});
  document.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(modal.open)return;
    const tag=event.target.tagName;
    if(event.key==='?'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)){event.preventDefault();openGuide();return;}
    if(event.altKey&&event.key.toLowerCase()==='h'&&view==='practice'){event.preventDefault();giveHint();return;}
    if(event.key==='Enter'&&view==='practice'&&!['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(tag)){event.preventDefault();submitAnswer(event);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearAuto();});
  $('sound-keys').innerHTML=[['H','ح'],['S','ص'],['D','ض'],['T','ط'],['Z','ظ'],['3','ع'],["'",'ء']].map(([key,ar])=>`<button class="sound-key" data-insert="${esc(key)}" title="${ar} → ${esc(key)}" aria-label="Insert ${esc(key)} for ${ar}">${esc(key)}</button>`).join('');
  fillIcons();applyAppearance();startSession();
  showView(location.hash.slice(1));
  if(loaded.error){$('storage-label').textContent='Check progress backup';toast(loaded.error);}
  if(!storage){$('storage-label').textContent='Session-only progress';}
  // Desktop autofocus keeps the drill immediate; mobile waits so the keyboard does not hide the first card.
  if(window.matchMedia('(pointer: fine)').matches)focusAnswer();
  setInterval(()=>{if(view==='practice')renderStats();},30000);
})();
