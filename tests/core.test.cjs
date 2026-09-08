'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../src/data.js');
const C=require('../src/core.js');
const get=id=>{const card=C.cardMap.get(id);assert.ok(card,`Card exists: ${id}`);return card;};

test('dataset has unique stable IDs, Arabic prompts, and ASCII-only keys',()=>{
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  assert.equal(D.letters.length,29);
  for(const card of D.cards){
    assert.match(card.ar,/[\u0621-\u064a]/,card.id);
    assert.match(card.answer,/^[A-Za-z3' -]+$/,card.id);
    assert.ok(card.hint&&card.explanation,card.id);
    assert.ok(C.checkAnswer(card,card.answer),card.id);
    for(const alias of card.aliases)assert.ok(C.checkAnswer(card,alias),`${card.id}: ${alias}`);
    assert.equal(C.checkAnswer(card,''),false,card.id);
  }
});
test('letter shapes respect one-sided and non-joining letters',()=>{
  for(const l of D.letters){
    const cards=D.cards.filter(c=>c.mode==='letters'&&c.letters[0]===l.id);
    assert.equal(cards.length,l.joining==='join'?4:l.joining==='break'?2:1,l.id);
    if(l.joining!=='join')assert.ok(cards.every(c=>!['initial','medial'].includes(c.form)));
  }
});
test('alif is not assigned synthetic consonant syllables and internal hamzas are not invented',()=>{
  assert.ok(D.cards.filter(c=>['short','long','joined'].includes(c.mode)).every(c=>!c.letters.includes('alif')));
  assert.ok(D.cards.filter(c=>c.mode==='joined').every(c=>!c.letters.includes('hamza')));
  assert.equal(get('long:hamza:a').ar,'آ');
});
test('plain consonants and emphatics are never lowercased together',()=>{
  for(const [id,right,wrong] of [['hha','H','h'],['sad','S','s'],['dad','D','d'],['tta','T','t'],['zha','Z','z']]){
    const card=get(`letter:${id}:isolated`);
    assert.ok(C.checkAnswer(card,right));assert.equal(C.checkAnswer(card,wrong),false);
  }
  assert.equal(C.checkAnswer(get('letter:ha:isolated'),'H'),false);
  assert.equal(C.checkAnswer(get('letter:ayn:isolated'),"'"),false);
  assert.equal(C.checkAnswer(get('letter:hamza:isolated'),'3'),false);
});
test('easy aliases preserve the intended sounds inside words',()=>{
  assert.ok(C.checkAnswer(get('word:sea'),'ba7r'));
  assert.ok(C.checkAnswer(get('word:sea'),'bah.r'));
  assert.ok(C.checkAnswer(get('word:friend'),'s.adiiq'));
  assert.ok(C.checkAnswer(get('word:land'),"2ard."));
  assert.ok(C.checkAnswer(get('word:road'),'t.ariiq'));
  assert.ok(C.checkAnswer(get('word:shadow'),'dh.ill'));
  assert.ok(C.checkAnswer(get('word:shadow'),'z.ill'));
  assert.equal(C.checkAnswer(get('word:friend'),'sadiiq'),false);
});
test('length contrasts are strict',()=>{
  for(const v of ['a','i','u']){
    assert.equal(C.checkAnswer(get(`short:ba:${v}`),'b'+v+v),false);
    assert.equal(C.checkAnswer(get(`long:ba:${v}`),'b'+v),false);
    assert.ok(C.checkAnswer(get(`long:ba:${v}`),'b'+v+v));
  }
  assert.equal(C.checkAnswer(get('word:house'),'baayt'),false);
});
test('hamza is optional initially but required medially and finally',()=>{
  for(const value of ["'akala",'akala','2akala','’akala'])assert.ok(C.checkAnswer(get('rule:ate'),value),value);
  assert.ok(C.checkAnswer(get('rule:to'),'ilaa'));
  assert.ok(C.checkAnswer(get('rule:adam'),'aadam'));
  assert.ok(C.checkAnswer(get('rule:asked'),'sa2ala'));
  assert.equal(C.checkAnswer(get('rule:asked'),'saala'),false);
  assert.equal(C.checkAnswer(get('rule:thing'),'shay'),false);
  assert.equal(C.checkAnswer(get('word:door'),"'baab"),false);
  assert.ok(C.checkAnswer(get('letter:hamza:isolated'),'2'));
});
test('article exercises grade pronunciation, not an unassimilated spelling',()=>{
  const card=get('rule:the-sun');
  for(const value of ['ash-shams','ashshams',' ash shams ',"'ashshams"]){assert.ok(C.checkAnswer(card,value),value);}
  assert.equal(C.checkAnswer(card,'al-shams'),false);
  assert.equal(C.checkAnswer(card,'ashams'),false);
  assert.ok(C.checkAnswer(get('rule:the-garment'),'ath-thawb'));
  assert.equal(C.checkAnswer(get('rule:the-garment'),'at-thawb'),false);
  assert.ok(C.checkAnswer(get('rule:the-moon'),'al qamar'));
});
test('pause forms and tanwin are separate, explicit targets',()=>{
  const school=get('word:school');
  assert.ok(C.checkAnswer(school,'madrasa'));assert.ok(C.checkAnswer(school,'madrasah'));
  assert.equal(C.checkAnswer(school,'madrasat'),false);
  const full=get('rule:school-un');
  assert.ok(C.checkAnswer(full,'madrasatun'));assert.equal(C.checkAnswer(full,'madrasa'),false);
  assert.ok(C.checkAnswer(get('rule:book-an'),'kitaaban'));
  assert.equal(C.checkAnswer(get('rule:book-an'),'kitaabaan'),false);
  assert.equal(C.checkAnswer(get('rule:teacher'),'mu3alim'),false);
});
test('unknown punctuation is not silently removed',()=>{
  const card=get('word:door');
  assert.equal(C.checkAnswer(card,'baab!'),false);
  assert.equal(C.checkAnswer(card,'baab.'),false);
  assert.equal(C.checkAnswer(card,'baa_b'),false);
  assert.ok(C.checkAnswer(card,' b a a b '));
});
test('beginner deck and vowel controls produce the expected card counts',()=>{
  const s=C.defaultSettings();
  assert.equal(C.makeDeck(s).length,18);
  assert.equal(C.makeDeck({...s,vowels:['a']}).length,6);
  assert.equal(C.makeDeck({...s,mode:'letters'}).length,6);
  assert.equal(C.makeDeck({...s,mode:'joined'}).length,108);
  assert.equal(C.makeDeck({...s,letters:['alif']}).length,0);
  assert.equal(C.makeDeck({...s,mode:'letters',letters:['alif'],forms:['medial']}).length,0);
});
test('word and rule banks do not accidentally disappear under beginner letter filters',()=>{
  const s=C.defaultSettings();
  assert.equal(C.makeDeck({...s,mode:'words'}).length,58);
  assert.equal(C.makeDeck({...s,mode:'rules'}).length,56);
  assert.equal(C.makeDeck({...s,mode:'words',wordCategory:'actions'}).length,14);
  assert.equal(C.makeDeck({...s,mode:'rules',ruleCategory:'tanwin'}).length,10);
});
test('results count once per completed card and clean recall promotes a review box',()=>{
  const p=C.freshProfile(), c=get('short:ba:a'),now=new Date(2026,8,8,12).getTime();
  let r=C.recordResult(p,c,true,now);
  assert.equal(r.seen,1);assert.equal(r.box,1);assert.equal(r.dueAt,now+600000);
  r=C.recordResult(p,c,true,now);assert.equal(r.box,2);assert.equal(r.dueAt,now+C.DAY);
  r=C.recordResult(p,c,true,now);assert.equal(r.box,3);assert.equal(C.totals(p).comfortable,1);
  r=C.recordResult(p,c,false,now);assert.equal(r.box,0);assert.equal(r.streak,0);assert.equal(r.seen,4);assert.equal(r.clean,3);
  assert.equal(C.totals(p).accuracy,75);assert.equal(C.totals(p).review,1);
  assert.deepEqual(p.days['2026-09-08'],{seen:4,clean:3});
  assert.equal(C.makeDeck(p.settings,p.records,true).length,1);
});
test('adaptive scheduler avoids immediate repeats',()=>{
  const deck=C.makeDeck(C.defaultSettings());
  const scheduler=new C.Scheduler(deck,{},true,()=>0.001);
  let previous;
  for(let i=0;i<100;i++){const card=scheduler.next();assert.notEqual(card.id,previous);previous=card.id;}
});
test('missed cards return after two intervening cards with sufficient alternatives',()=>{
  const deck=C.makeDeck(C.defaultSettings());
  const scheduler=new C.Scheduler(deck,{},true,()=>0);
  const first=scheduler.next();scheduler.retry(first.id);
  assert.notEqual(scheduler.next().id,first.id);
  assert.notEqual(scheduler.next().id,first.id);
  assert.equal(scheduler.next().id,first.id);
});
test('one-card decks and empty decks are safe',()=>{
  const card=get('short:ba:a'),scheduler=new C.Scheduler([card]);
  for(let i=0;i<5;i++){assert.equal(scheduler.next().id,card.id);scheduler.retry(card.id);}
  assert.equal(new C.Scheduler([]).next(),null);
});
test('non-adaptive mode is a shuffled round without replacement or boundary repeats',()=>{
  const deck=C.makeDeck(C.defaultSettings());
  const scheduler=new C.Scheduler(deck,{},false,()=>.5);
  const first=Array.from({length:deck.length},()=>scheduler.next().id);
  assert.equal(new Set(first).size,deck.length);
  assert.notEqual(scheduler.next().id,first.at(-1));
});
test('profile validation accepts backups and rejects other apps and unsupported versions',()=>{
  const p=C.freshProfile();C.recordResult(p,get('short:ba:a'),true);
  assert.deepEqual(C.validateProfile(JSON.parse(JSON.stringify(p))),p);
  for(const bad of [null,{},[],{app:'other',version:1},{app:'harf',version:2}])assert.throws(()=>C.validateProfile(bad));
});
test('import sanitizes invalid settings, records, dates, and prototype keys',()=>{
  const raw=JSON.parse('{"app":"harf","version":1,"settings":{"mode":"<img>","letters":["bogus"],"length":-1},"records":{"__proto__":{"seen":100},"short:ba:a":{"seen":2,"clean":500,"streak":999,"box":999,"lapses":-1,"lastSeen":"bad","dueAt":null}},"days":{"2026-02-30":{"seen":50},"2026-09-08":{"seen":-4,"clean":8}}}');
  const p=C.validateProfile(raw);
  assert.equal(p.settings.mode,'short');assert.deepEqual(p.settings.letters,D.presets.starter);
  assert.equal(Object.keys(p.records).length,1);assert.equal(p.records['short:ba:a'].clean,2);
  assert.equal(p.records['short:ba:a'].box,2);assert.equal(p.records['short:ba:a'].lapses,0);
  assert.equal(p.days['2026-02-30'],undefined);assert.deepEqual(p.days['2026-09-08'],{seen:0,clean:0});
  assert.equal({}.seen,undefined);
});
test('blocked or corrupted storage falls back to a usable session',()=>{
  const blocked={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};
  assert.ok(C.loadProfile(blocked).error);assert.equal(C.saveProfile(blocked,C.freshProfile()),false);
  assert.ok(C.loadProfile({getItem:()=>'{'}).error);
  assert.ok(C.loadProfile(null).error);
  const memory={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}};
  assert.equal(C.loadProfile(memory).error,null);assert.ok(C.saveProfile(memory,C.freshProfile()));
  assert.equal(C.loadProfile(memory).profile.version,1);
});
test('targeted feedback covers length, case, hamza, and Arabic keyboard mistakes',()=>{
  assert.match(C.feedbackFor(get('long:ba:a'),'ba'),/vowel length/);
  assert.match(C.feedbackFor(get('word:friend'),'sadiiq'),/Case matters/);
  assert.match(C.feedbackFor(get('rule:asked'),'saala'),/hamza/);
  assert.match(C.feedbackFor(get('short:ba:a'),'بَ'),/Latin letters/);
});

test('the article bank covers all fourteen sun and fourteen moon consonants',()=>{
  const cards=D.cards.filter(c=>c.mode==='rules'&&c.category==='article');
  assert.equal(cards.length,28);
  assert.equal(cards.filter(c=>c.explanation.startsWith('The l of')).length,14);
  assert.equal(cards.filter(c=>c.explanation.startsWith('This is a moon')).length,14);
  assert.ok(C.checkAnswer(get('rule:the-land'),"al-'arD"));
  assert.equal(C.checkAnswer(get('rule:the-land'),'alarD'),false);
});
