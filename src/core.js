/* Pure logic, shared by the browser and Node tests. */
(function (root, factory) {
  const lib = factory(typeof module === 'object' && module.exports ? require('./data.js') : root.HarfData);
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.HarfCore = lib;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Data) {
  'use strict';
  const DAY = 86400000;
  const STORAGE_KEY = 'harf.reader.v1';
  const cardMap = new Map(Data.cards.map(c=>[c.id,c]));
  const defaultSettings = () => ({mode:'short',letters:[...Data.presets.starter],forms:['isolated'],vowels:['a','i','u'],wordCategory:'all',ruleCategory:'all',length:20,adaptive:true,autoAdvance:false,theme:'light',font:'naskh',goal:20});
  const freshProfile = () => ({app:'harf',version:1,settings:defaultSettings(),records:{},days:{},bestStreak:0});
  function normalizeAnswer(value) {
    return String(value ?? '').normalize('NFKC').trim()
      .replace(/[‘’ʼ]/g,"'")
      .replace(/dh\./g,'Z').replace(/h\./g,'H').replace(/s\./g,'S').replace(/d\./g,'D').replace(/t\./g,'T').replace(/z\./g,'Z')
      .replace(/7/g,'H').replace(/2/g,"'")
      .replace(/[\s\-‐‑–—]/g,'');
  }
  function comparable(card,value) {
    const norm = normalizeAnswer(value);
    return card.initialHamza ? norm.replace(/^'/,'') : norm;
  }
  function checkAnswer(card,value) {
    const normalized = comparable(card,value);
    return normalized.length > 0 && [card.answer,...(card.aliases||[])].some(a=>comparable(card,a)===normalized);
  }
  function feedbackFor(card,value) {
    const got = comparable(card,value), target = comparable(card,card.answer);
    if (/[\u0600-\u06ff]/.test(value)) return 'Use Latin letters for the sound, not an Arabic keyboard.';
    if (got.toLowerCase()===target.toLowerCase()) return 'Case matters here: H, S, D, T, and Z are different sounds from h, s, d, t, and z. The key buttons can help.';
    if (got.replace(/([aiu])\1/g,'$1')===target.replace(/([aiu])\1/g,'$1')) return 'Check the vowel length. Use a, i, u for short vowels and aa, ii, uu for long vowels.';
    if (target.includes("'") && got===target.replace(/'/g,'')) return "There is a hamza inside this word. Keep its glottal stop: type an apostrophe or 2.";
    if (card.category==='article') return card.explanation;
    if (card.category==='tanwin') return 'Read the written tanwin ending: an, in, or un. A final ة becomes t before that ending.';
    if (got && target && got[0]===target[0]) return 'You have the beginning. Check the remaining sounds and vowel marks, from right to left.';
    return 'Not quite yet. Look at the dots and vowel marks, or use a hint to break it down.';
  }
  function makeDeck(settings, records={}, reviewOnly=false) {
    const selected = new Set(settings.letters);
    return Data.cards.filter(c=>c.mode===settings.mode &&
      (c.mode==='words' ? settings.wordCategory==='all'||c.category===settings.wordCategory :
       c.mode==='rules' ? settings.ruleCategory==='all'||c.category===settings.ruleCategory : c.letters.every(id=>selected.has(id))) &&
      (c.mode!=='letters'||settings.forms.includes(c.form)) &&
      (!['short','long'].includes(c.mode)||settings.vowels.includes(c.vowel)) &&
      (!reviewOnly||(records[c.id]&&records[c.id].streak===0)));
  }
  const shuffle = (items, random=Math.random) => {
    const result=[...items];
    for (let i=result.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  };
  class Scheduler {
    constructor(deck,records={},adaptive=true,random=Math.random) {
      this.deck=[...deck];this.records=records;this.adaptive=adaptive;this.random=random;
      this.recent=[];this.drawn=0;this.retries=[];this.round=shuffle(deck,random);
    }
    retry(id) {
      if (this.adaptive && !this.retries.some(r=>r.id===id)) this.retries.push({id,due:this.drawn+2});
    }
    next(now=Date.now()) {
      if (!this.deck.length) return null;
      const last=this.recent.at(-1);
      const retry=this.retries.find(r=>r.due<=this.drawn && (r.id!==last||this.deck.length===1));
      let card;
      if (retry) {
        card=this.deck.find(c=>c.id===retry.id);
        this.retries=this.retries.filter(r=>r!==retry);
      }
      if (!card && !this.adaptive) {
        if (!this.round.length) this.round=shuffle(this.deck,this.random);
        if (this.round.length>1 && this.round.at(-1).id===last) [this.round[0],this.round[this.round.length-1]]=[this.round.at(-1),this.round[0]];
        card=this.round.pop();
      }
      if (!card) {
        const pending=new Set(this.retries.map(r=>r.id));
        const cooldown=this.recent.slice(-Math.min(3,this.deck.length-1));
        let eligible=this.deck.filter(c=>!cooldown.includes(c.id)&&!pending.has(c.id));
        if (!eligible.length) eligible=this.deck.filter(c=>c.id!==last&&!pending.has(c.id));
        if (!eligible.length) eligible=this.deck.filter(c=>c.id!==last);
        if (!eligible.length) eligible=this.deck;
        const weights=eligible.map(c=>{
          const r=this.records[c.id];
          if (!r) return 5;
          return (r.dueAt<=now?4:0.6)+(1-r.clean/Math.max(1,r.seen))*3+(r.streak===0?2:0);
        });
        let roll=this.random()*weights.reduce((a,b)=>a+b,0);
        card=eligible.at(-1);
        for(let i=0;i<eligible.length;i++){roll-=weights[i];if(roll<0){card=eligible[i];break;}}
      }
      this.recent.push(card.id);if(this.recent.length>10)this.recent.shift();this.drawn++;
      return card;
    }
  }
  function dateKey(date=new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function recordResult(profile,card,clean,now=Date.now()) {
    const old=profile.records[card.id]||{seen:0,clean:0,streak:0,box:0,lapses:0};
    const box=clean?Math.min(5,old.box+1):0;
    const intervals=[0,10*60000,DAY,3*DAY,7*DAY,21*DAY];
    profile.records[card.id]={seen:old.seen+1,clean:old.clean+(clean?1:0),streak:clean?old.streak+1:0,box,lapses:old.lapses+(clean?0:1),lastSeen:now,dueAt:now+intervals[box]};
    const day=dateKey(new Date(now));
    const daily=profile.days[day]||{seen:0,clean:0};
    profile.days[day]={seen:daily.seen+1,clean:daily.clean+(clean?1:0)};
    return profile.records[card.id];
  }
  function totals(profile) {
    const values=Object.values(profile.records);
    const seen=values.reduce((n,r)=>n+r.seen,0), clean=values.reduce((n,r)=>n+r.clean,0);
    return {seen,clean,accuracy:seen?Math.round(100*clean/seen):null,comfortable:values.filter(r=>r.box>=3).length,review:values.filter(r=>r.streak===0).length,explored:values.length};
  }
  function sanitizeSettings(raw={}) {
    const d=defaultSettings(), out={...d};
    const list=(value,allowed,fallback)=>Array.isArray(value)?[...new Set(value.filter(v=>allowed.includes(v)))]:fallback;
    if(Data.modes.some(m=>m.id===raw.mode))out.mode=raw.mode;
    out.letters=list(raw.letters,Data.letters.map(l=>l.id),d.letters);if(!out.letters.length)out.letters=d.letters;
    out.forms=list(raw.forms,['isolated','initial','medial','final'],d.forms);if(!out.forms.length)out.forms=d.forms;
    out.vowels=list(raw.vowels,['a','i','u'],d.vowels);if(!out.vowels.length)out.vowels=d.vowels;
    if(['all','everyday','actions','nature'].includes(raw.wordCategory))out.wordCategory=raw.wordCategory;
    if(['all','shadda','tanwin','article','hamza','special'].includes(raw.ruleCategory))out.ruleCategory=raw.ruleCategory;
    if([10,20,50,0].includes(raw.length))out.length=raw.length;
    if([10,20,30,50].includes(raw.goal))out.goal=raw.goal;
    for(const key of ['adaptive','autoAdvance'])if(typeof raw[key]==='boolean')out[key]=raw[key];
    if(['light','dark','system'].includes(raw.theme))out.theme=raw.theme;
    if(['naskh','sans'].includes(raw.font))out.font=raw.font;
    return out;
  }
  const integer=(n,max=1e9)=>Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;
  function validateProfile(raw) {
    if(!raw||typeof raw!=='object'||raw.app!=='harf'||raw.version!==1)throw new Error('This is not a supported Harf progress file (version 1).');
    const result=freshProfile();result.settings=sanitizeSettings(raw.settings||{});result.bestStreak=integer(raw.bestStreak);
    if(raw.records&&typeof raw.records==='object')for(const [id,r] of Object.entries(raw.records)) {
      if(!cardMap.has(id)||!r||typeof r!=='object')continue;
      const seen=integer(r.seen);if(!seen)continue;
      const clean=integer(r.clean,seen), streak=integer(r.streak,clean);
      result.records[id]={seen,clean,streak,box:integer(r.box,Math.min(5,streak)),lapses:integer(r.lapses,seen),lastSeen:integer(r.lastSeen,8640000000000000),dueAt:integer(r.dueAt,8640000000000000)};
    }
    if(raw.days&&typeof raw.days==='object')for(const [day,d] of Object.entries(raw.days)) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!d||typeof d!=='object')continue;
      const parsed=new Date(day+'T12:00:00');if(!Number.isFinite(parsed.getTime())||dateKey(parsed)!==day)continue;
      result.days[day]={seen:integer(d.seen),clean:integer(d.clean,integer(d.seen))};
    }
    return result;
  }
  function loadProfile(storage) {
    try {
      const raw=storage.getItem(STORAGE_KEY);
      return {profile:raw?validateProfile(JSON.parse(raw)):freshProfile(),error:null};
    }catch(error){return {profile:freshProfile(),error:'Saved progress could not be read. This session still works; export progress to keep a copy.'};}
  }
  function saveProfile(storage,profile) {
    try{storage.setItem(STORAGE_KEY,JSON.stringify(profile));return true;}catch{return false;}
  }
  return {DAY,STORAGE_KEY,cardMap,defaultSettings,freshProfile,normalizeAnswer,checkAnswer,feedbackFor,makeDeck,Scheduler,shuffle,dateKey,recordResult,totals,sanitizeSettings,validateProfile,loadProfile,saveProfile};
});
