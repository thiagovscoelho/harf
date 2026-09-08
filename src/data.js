/* Harf's hand-authored teaching data. No API, network call, or transliteration guesser.
   MSA sound values; generated combinations are explicitly NOT vocabulary words. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HarfData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const letters = [
    ['alif','ا','aa','Alif','A long aa in this drill; a vowel carrier, not a consonant.','break'],
    ['ba','ب','b','Baa','Like b in book.','join'],
    ['ta','ت','t','Taa','Like t, with the tongue near the upper teeth.','join'],
    ['tha','ث','th','Thaa','The unvoiced th in think, not t or s.','join'],
    ['jim','ج','j','Jiim','Like j in jump in Standard Arabic, not the Egyptian g.','join'],
    ['hha','ح','H','Haa (deep)','A voiceless, constricted throat sound; distinct from ordinary h.','join'],
    ['kha','خ','kh','Khaa','Like ch in Scottish loch, not k followed by h.','join'],
    ['dal','د','d','Daal','Like d, with the tongue near the upper teeth.','break'],
    ['dhal','ذ','dh','Dhaal','The voiced th in this, not d or z.','break'],
    ['ra','ر','r','Raa','A tapped or trilled r.','break'],
    ['zay','ز','z','Zaay','Like z in zoo.','break'],
    ['sin','س','s','Siin','Like s in see.','join'],
    ['shin','ش','sh','Shiin','Like sh in ship.','join'],
    ['sad','ص','S','Saad','An emphatic s, made with a retracted tongue root. Not plain s.','join'],
    ['dad','ض','D','Daad','An emphatic d. Not plain d.','join'],
    ['tta','ط','T','Taa (emphatic)','An emphatic t. Not plain t.','join'],
    ['zha','ظ','Z','Dhaa (emphatic)','An emphatic voiced dh (as in this), not plain z.','join'],
    ['ayn','ع','3','Ayn','A voiced pharyngeal sound, made deep in the throat; not a vowel or a hamza.','join'],
    ['ghayn','غ','gh','Ghayn','A voiced fricative at the back of the mouth; the voiced counterpart of kh.','join'],
    ['fa','ف','f','Faa','Like f in fish.','join'],
    ['qaf','ق','q','Qaaf','A stop made farther back than k. Standard Arabic uses q, not a dialectal g or hamza.','join'],
    ['kaf','ك','k','Kaaf','Like k in skill.','join'],
    ['lam','ل','l','Laam','Like l in leaf.','join'],
    ['mim','م','m','Miim','Like m in moon.','join'],
    ['nun','ن','n','Nuun','Like n in noon.','join'],
    ['ha','ه','h','Haa (light)','Like h in hello; distinct from deep H (ح).','join'],
    ['waw','و','w','Waaw','Consonant w here; uu only when it is a long-vowel letter.','break'],
    ['ya','ي','y','Yaa','Consonant y here; ii only when it is a long-vowel letter.','join'],
    ['hamza','ء',"'",'Hamza','A glottal stop, like the break in uh-oh. Also type 2. Its seat does not add a sound.','none']
  ].map(([id, ar, roman, name, note, joining]) => ({id, ar, roman, name, note, joining}));
  const byId = Object.fromEntries(letters.map(l => [l.id,l]));
  const modes = [
    {id:'letters',name:'Letters',short:'The foundations',icon:'letter',description:'Recognize the sound, not the letter name.',tip:'One letter, one sound',body:'Type b for ب, not baa. Here ا stands for aa; و and ي stand for consonant w and y. Choose connected shapes in the letter picker.'},
    {id:'short',name:'Short vowels',short:'Add a little sound',icon:'vowels',description:'A letter. A vowel. The start of reading.',tip:'Small marks, real sounds',body:'A stroke above adds a, a stroke below adds i, and a small curl above adds u. Read the consonant first, then its vowel.'},
    {id:'long',name:'Long vowels',short:'Let it linger',icon:'wave',description:'Hear the difference between a and aa.',tip:'Give long vowels room',body:'Type aa, ii, or uu for a long vowel. They last about twice as long as short a, i, or u. Do not type w or y for vowel letters in these cards.'},
    {id:'joined',name:'Combinations',short:'Connect the dots',icon:'link',description:'Join the shapes. Put the sounds together.',tip:'Read from right to left',body:'These are sound-building exercises, not necessarily real words. A small circle (sukun) means no vowel. Some letters never connect to the next letter on their left.'},
    {id:'words',name:'Words',short:'Make it meaningful',icon:'book',description:'Turn familiar shapes into everyday words.',tip:'Let the marks lead',body:'Noun cards use pause forms: no unprinted case endings. Verb cards retain every displayed vowel. Meanings appear after you answer, so you practice reading rather than translation.'},
    {id:'rules',name:'Reading rules',short:'The finishing touches',icon:'spark',description:'Doubled sounds, endings, and the definite article.',tip:'Read the sound, not just the spelling',body:'Shadda doubles a consonant. Tanwin adds n to a short vowel. With a sun letter, the l of al- assimilates to that letter. Each card states whether to read an ending or pause.'}
  ];
  const vowels = [{id:'a',mark:'َ',name:'Fatha'},{id:'i',mark:'ِ',name:'Kasra'},{id:'u',mark:'ُ',name:'Damma'}];
  const presets = {
    starter:['ba','ta','tha','mim','nun','ya'],
    familiar:['alif','ba','ta','dal','ra','sin','fa','kaf','lam','mim','nun','ha','waw','ya'],
    challenging:['tha','jim','hha','kha','dhal','sad','dad','tta','zha','ayn','ghayn','qaf','hamza'],
    all:letters.map(l=>l.id)
  };
  const cards = [];
  const add = c => cards.push({meaning:'',aliases:[],initialHamza:false,...c});
  for (const l of letters) {
    const forms = l.joining === 'join' ? ['isolated','initial','medial','final'] : l.joining === 'break' ? ['isolated','final'] : ['isolated'];
    for (const form of forms) {
      const ar = {isolated:l.ar, initial:l.ar+'ـ', medial:'ـ'+l.ar+'ـ', final:'ـ'+l.ar}[form];
      add({id:`letter:${l.id}:${form}`,mode:'letters',ar,answer:l.roman,letters:[l.id],form,
        label:({isolated:'Isolated',initial:'Beginning',medial:'Middle',final:'End'})[form]+' shape',
        hint:l.note, explanation:`${l.name}: ${l.note}`+(form==='isolated'?'':' The connecting stroke has no sound.')});
    }
    if (l.id === 'alif') continue;
    for (const v of vowels) {
      const base = l.id === 'hamza' ? (v.id === 'i' ? 'إ' : 'أ') : l.ar;
      add({id:`short:${l.id}:${v.id}`,mode:'short',ar:base+v.mark,answer:l.roman+v.id,letters:[l.id],vowel:v.id,
        label:'Letter + short vowel',hint:`${v.name} adds a short ${v.id} after the consonant.`,initialHamza:l.id==='hamza',
        explanation:`${l.name} (${l.roman}) + ${v.name.toLowerCase()} (${v.id}). ${l.note}`});
      const carrier = {a:'ا',i:'ي',u:'و'}[v.id];
      add({id:`long:${l.id}:${v.id}`,mode:'long',ar:l.id==='hamza'&&v.id==='a'?'آ':base+v.mark+carrier,
        answer:l.roman+v.id+v.id,letters:[l.id],vowel:v.id,label:'Letter + long vowel',initialHamza:l.id==='hamza',
        hint:`The vowel is long: use ${v.id+v.id}, not ${v.id}.`,
        explanation:l.id==='hamza'&&v.id==='a'?'Alif madda combines a hamza and long aa. At the start, the apostrophe is optional.':`${l.name} (${l.roman}) + long ${v.id+v.id}. The ${carrier} is a vowel letter here.`});
    }
  }
  // Do not invent medial hamza spellings: hamza seats are taught with curated words.
  const consonants = letters.filter(l=>l.id!=='alif'&&l.id!=='hamza');
  for (const a of consonants) for (const b of consonants) {
    for (const [id,va,vb] of [['ai','a','i'],['ua','u','a'],['ic','i','']]) {
      const ma = vowels.find(v=>v.id===va).mark;
      const mb = vb ? vowels.find(v=>v.id===vb).mark : 'ْ';
      add({id:`joined:${a.id}:${b.id}:${id}`,mode:'joined',ar:a.ar+ma+b.ar+mb,answer:a.roman+va+b.roman+vb,
        letters:[...new Set([a.id,b.id])],label:vb?'Two-syllable exercise':'Sukun exercise',
        hint:vb?'Read each consonant, then its vowel, from right to left.':'The circle on the last letter means no vowel after it.',
        explanation:`${a.name} + ${va}, then ${b.name}${vb?' + '+vb:' with no vowel'}. This is a sound exercise, not a vocabulary word.`});
    }
  }
  function word(id,ar,answer,meaning,category,extra={}) {
    add({id:`word:${id}`,mode:'words',ar,answer,meaning,category,letters:[],label:category==='actions'?'Read every marked vowel':'Pause form',
      hint:category==='actions'?'Read the vowels on every consonant, including the last one.':'Read the word at a pause. Do not add a case ending.',
      explanation:category==='actions'?'Read all displayed short and long vowels.':'This noun is given in its pause form; the final sukun marks a consonant with no following vowel.',...extra});
  }
  [
    ['book','كِتَابْ','kitaab','book','everyday'],['door','بَابْ','baab','door','everyday'],
    ['house','بَيْتْ','bayt','house','everyday'],['pen','قَلَمْ','qalam','pen','everyday'],
    ['bread','خُبْزْ','khubz','bread','everyday'],['time','وَقْتْ','waqt','time','everyday'],
    ['name','اِسْمْ','ism','name','everyday'],['heart','قَلْبْ','qalb','heart','everyday'],
    ['eye','عَيْنْ','3ayn','eye','everyday'],['hand','يَدْ','yad','hand','everyday'],
    ['head','رَأْسْ',"ra's",'head','everyday'],['girl','بِنْتْ','bint','girl','everyday'],
    ['boy','وَلَدْ','walad','boy','everyday'],['work','عَمَلْ','3amal','work','everyday'],
    ['knowledge','عِلْمْ','3ilm','knowledge','everyday'],['garment','ثَوْبْ','thawb','garment','everyday'],
    ['gold','ذَهَبْ','dhahab','gold','everyday'],['letter','حَرْفْ','Harf','letter','everyday'],
    ['friend','صَدِيقْ','Sadiiq','friend','everyday'],['road','طَرِيقْ','Tariiq','road','everyday'],
    ['sun','شَمْسْ','shams','sun','nature'],['moon','قَمَرْ','qamar','moon','nature'],
    ['light','نُورْ','nuur','light','nature'],['fire','نَارْ','naar','fire','nature'],
    ['sea','بَحْرْ','baHr','sea','nature'],['river','نَهْرْ','nahr','river','nature'],
    ['mountain','جَبَلْ','jabal','mountain','nature'],['star','نَجْمْ','najm','star','nature'],
    ['rain','مَطَرْ','maTar','rain','nature'],['fish','سَمَكْ','samak','fish','nature'],
    ['dog','كَلْبْ','kalb','dog','nature'],['bird','طَيْرْ','Tayr','bird','nature'],
    ['cloud','غَيْمْ','ghaym','cloud','nature'],['shadow','ظِلّْ','Zill','shadow','nature'],
    ['land','أَرْضْ',"'arD",'land','nature'],['wind','رِيحْ','riiH','wind','nature'],
    ['wrote','كَتَبَ','kataba','he wrote','actions'],['written','كُتِبَ','kutiba','it was written','actions'],
    ['studied','دَرَسَ','darasa','he studied','actions'],['opened','فَتَحَ','fataHa','he opened','actions'],
    ['drank','شَرِبَ','shariba','he drank','actions'],['heard','سَمِعَ','sami3a','he heard','actions'],
    ['went','ذَهَبَ','dhahaba','he went','actions'],['sat','جَلَسَ','jalasa','he sat','actions'],
    ['entered','دَخَلَ','dakhala','he entered','actions'],['exited','خَرَجَ','kharaja','he went out','actions'],
    ['read','قَرَأَ',"qara'a",'he read','actions'],['said','قَالَ','qaala','he said','actions'],
    ['was','كَانَ','kaana','he was','actions'],['slept','نَامَ','naama','he slept','actions']
  ].forEach(row=>word(...row, row[0]==='land'?{initialHamza:true}:{}));
  [
    ['school','مَدْرَسَة','madrasa','school'],['tree','شَجَرَة','shajara','tree'],
    ['city','مَدِينَة','madiina','city'],['language','لُغَة','lugha','language'],
    ['university','جَامِعَة','jaami3a','university'],['garden','حَدِيقَة','Hadiiqa','garden'],
    ['cat','قِطَّة','qiTTa','cat'],['car','سَيَّارَة','sayyaara','car']
  ].forEach(([id,ar,answer,meaning])=>word(id,ar,answer,meaning,'everyday',{
    aliases:[answer+'h'],label:'Pause form · taa marbuta',hint:'At a pause, ة is read as a final a (or ah), not at.',
    explanation:'Taa marbuta (ة) has no pronounced t at a pause. This drill accepts both -a and -ah. With a pronounced case ending, the t returns.'}));
  function rule(id,ar,answer,meaning,category,explanation,extra={}) {
    add({id:`rule:${id}`,mode:'rules',ar,answer,meaning,category,letters:[],label:({shadda:'Shadda · pause form',tanwin:'Tanwin · read the ending',article:'Definite article · start here',hamza:'Hamza · read as marked',special:'Special spelling · pause form'})[category],hint:explanation,explanation,...extra});
  }
  [
    ['teacher','مُعَلِّمْ','mu3allim','teacher'],['sugar','سُكَّرْ','sukkar','sugar'],
    ['love','حُبّْ','Hubb','love'],['rice','رُزّْ','ruzz','rice'],['duck','بَطّْ','baTT','duck'],
    ['pilgrimage','حَجّْ','Hajj','pilgrimage'],['story','قِصَّة','qiSSa','story']
  ].forEach(([id,ar,answer,meaning])=>rule(id,ar,answer,meaning,'shadda','Shadda means two of the same consonant: type ll, kk, TT, etc. This card is read at a pause.', id==='story'?{aliases:['qiSSah'],explanation:'Shadda doubles S. Taa marbuta at a pause is -a or -ah, not -at.'}:{}));
  [
    ['book-un','كِتَابٌ','kitaabun','a book'],['book-in','كِتَابٍ','kitaabin','a book'],
    ['book-an','كِتَابًا','kitaaban','a book'],['pen-un','قَلَمٌ','qalamun','a pen'],
    ['pen-in','قَلَمٍ','qalamin','a pen'],['pen-an','قَلَمًا','qalaman','a pen'],
    ['house-un','بَيْتٌ','baytun','a house'],['school-un','مَدْرَسَةٌ','madrasatun','a school'],
    ['car-an','سَيَّارَةً','sayyaaratan','a car'],['cat-in','قِطَّةٍ','qiTTatin','a cat']
  ].forEach(([id,ar,answer,meaning])=>rule(id,ar,answer,meaning,'tanwin','Read the displayed ending: ٌ = un, ٍ = in, ً = an. Taa marbuta becomes t before the ending. A support alif after ً does not make aa.'));
  [
    ['the-sun','اَلشَّمْسْ','ash-shams','the sun',true],['the-man','اَلرَّجُلْ','ar-rajul','the man',true],
    ['the-light','اَلنُّورْ','an-nuur','the light',true],['the-fish','اَلسَّمَكْ','as-samak','the fish',true],
    ['the-road','اَلطَّرِيقْ','aT-Tariiq','the road',true],['the-garment','اَلثَّوْبْ','ath-thawb','the garment',true],
    ['the-gold','اَلذَّهَبْ','adh-dhahab','the gold',true],['the-shadow','اَلظِّلّْ','aZ-Zill','the shadow',true],
    ['the-dates','اَلتَّمْرْ','at-tamr','the dates',true],['the-lesson','اَلدَّرْسْ','ad-dars','the lesson',true],
    ['the-blossoms','اَلزَّهْرْ','az-zahr','the blossoms',true],['the-sound','اَلصَّوْتْ','aS-Sawt','the sound',true],
    ['the-illumination','اَلضَّوْءْ',"aD-Daw'",'the light',true],['the-night','اَللَّيْلْ','al-layl','the night',true],
    ['the-moon','اَلْقَمَرْ','al-qamar','the moon',false],['the-book','اَلْكِتَابْ','al-kitaab','the book',false],
    ['the-door','اَلْبَابْ','al-baab','the door',false],['the-sea','اَلْبَحْرْ','al-baHr','the sea',false],
    ['the-eye','اَلْعَيْنْ','al-3ayn','the eye',false],['the-air','اَلْهَوَاءْ',"al-hawaa'",'the air',false],
    ['the-mountain','اَلْجَبَلْ','al-jabal','the mountain',false],['the-bread','اَلْخُبْزْ','al-khubz','the bread',false],
    ['the-cloud','اَلْغَيْمْ','al-ghaym','the cloud',false],['the-dawn','اَلْفَجْرْ','al-fajr','the dawn',false],
    ['the-water','اَلْمَاءْ',"al-maa'",'the water',false],['the-time','اَلْوَقْتْ','al-waqt','the time',false],
    ['the-hand','اَلْيَدْ','al-yad','the hand',false],['the-land','اَلْأَرْضْ',"al-'arD",'the land',false]
  ].forEach(([id,ar,answer,meaning,sun])=>rule(id,ar,answer,meaning,'article',sun?'The l of al- is not pronounced before this sun letter. Double the sun consonant instead. Hyphens are optional. Start the word here and pause at its end.':'This is a moon letter: pronounce the l of al-. Hyphens are optional. Start the word here and pause at its end.',{initialHamza:true}));
  [
    ['asked','سَأَلَ',"sa'ala",'he asked'],['question','سُؤَالْ',"su'aal",'question'],
    ['president','رَئِيسْ',"ra'iis",'president'],['thing','شَيْءْ',"shay'",'thing'],
    ['ate','أَكَلَ',"'akala",'he ate'],['to','إِلَى',"'ilaa",'to'],['adam','آدَمْ',"'aadam",'Adam']
  ].forEach(([id,ar,answer,meaning])=>rule(id,ar,answer,meaning,'hamza',"Hamza is a glottal stop: type an apostrophe or 2. Its seat (alif, waw, or yaa) is not an extra consonant. Only an initial hamza may be omitted.",{initialHamza:answer.startsWith("'")}));
  [
    ['young-man','فَتَى','fataa','young man','Final ى (alif maqsura) is long aa, not y or ii.'],
    ['guidance','هُدَى','hudaa','guidance','Final ى (alif maqsura) is long aa, not y or ii.'],
    ['this','هٰذَا','haadhaa','this','The small upright alif (ٰ) gives a long aa. ذ is dh, the voiced th.'],
    ['that','ذٰلِكْ','dhaalik','that','The small upright alif (ٰ) gives a long aa. This card is shown in its pause form.']
  ].forEach(([id,ar,answer,meaning,note])=>rule(id,ar,answer,meaning,'special',note));
  const sources = [
    {title:'Arabic reading course',author:'Madinah Arabic',url:'https://madinaharabic.com/free-content/reading',description:'Alphabet, short and long vowels, letter joining, sukun, shadda, and tanwin.'},
    {title:'The moon and sun letters',author:'Madinah Arabic',url:'https://madinaharabic.com/free-content/grammar/lesson-3/part-7',description:'Pronunciation of the definite article.'},
    {title:'Alphabet: short vowels',author:'University of Oregon',url:'https://opentext.uoregon.edu/introarabic/chapter/alphabet-short-vowels/',description:'The three short vowels and their positions.'},
    {title:'Arabic phonology and orthography',author:'Lebanese Arabic Institute',url:'https://www.lebanesearabicinstitute.com/arabic-alphabet/',description:'Use the Modern Standard Arabic sections, not the Lebanese dialect sections.'}
  ];
  return {letters,byId,modes,vowels,presets,cards,sources};
});
