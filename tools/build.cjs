#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="src/styles.css">',()=>'<style>\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8')+'\n</style>');
for(const file of ['data.js','core.js','app.js']){
  html=html.replace(`<script src="src/${file}" defer></script>`,()=>'<script>\n'+fs.readFileSync(path.join(root,'src',file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
}
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'harf.html'),html);
console.log('Built dist/harf.html: one self-contained, offline HTML file.');
