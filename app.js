'use strict';
const $ = id => document.getElementById(id);
let aktywne = [];
const wymieszaj = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
const escapeHTML = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function pokazTekst(txt, baza){
  // Zamieniaj obrazy przed kodowaniem HTML; ścieżki tylko względne, wewnątrz folderu danego testu.
  const obrazy=[];
  txt=txt.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,opis,nazwa)=>{
    const p=nazwa.trim();
    if (!/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[\p{L}\p{N}_.\-\/ ]+\.(?:png|jpg|jpeg|gif|svg|webp)$/iu.test(p)) return '[Nieprawidłowa nazwa obrazu]';
    const token=`@@OBRAZ${obrazy.length}@@`;
    obrazy.push(`<img loading="lazy" src="${escapeHTML(new URL(p,baza).href)}" alt="${escapeHTML(opis)}">`);
    return token;
  });
  let html=escapeHTML(txt).replace(/\n/g,'<br>');
  obrazy.forEach((img,i)=>{html=html.replace(`@@OBRAZ${i}@@`,img);});
  return `<span class="teksty">${html}</span>`;
}
function wczytajTest(zawartosc){
 const bloki=zawartosc.replace(/\r\n?/g,'\n').trim().split(/\n\s*\n+/);
 return bloki.map((blok,idx)=>{
  const linie=blok.split('\n').map(s=>s.trim()).filter(Boolean);
  const typ=linie.shift();
  if(!['@ABC','@PF','@UZ'].includes(typ))throw Error(`Zadanie ${idx+1}: nieznany typ ${typ}`);
  const tresc=[],odp=[],zdania=[],uzasadnienia=[];let poprawna='';
  for(const linia of linie){
   let m;
   if((m=linia.match(/^POPRAWNA:\s*(\S+)\s*$/i))){poprawna=m[1].toUpperCase();continue;}
   if(typ==='@PF'&&(m=linia.match(/^([12]):\s*(.*?)\s*\|\s*([PF])$/i))){zdania.push({id:m[1],tekst:m[2],poprawna:m[3].toUpperCase()});continue;}
   if((m=linia.match(/^([ABCD]):\s*(.*)$/))){odp.push({id:m[1],tekst:m[2]});continue;}
   if(typ==='@UZ'&&(m=linia.match(/^([123]):\s*(.*)$/))){uzasadnienia.push({id:m[1],tekst:m[2]});continue;}
   tresc.push(linia);
  }
  if(typ==='@ABC'&&(odp.length!==4||!odp.some(o=>o.id===poprawna)))throw Error(`Zadanie ${idx+1}: wymagane A–D i POPRAWNA`);
  if(typ==='@PF'&&(zdania.length!==2||new Set(zdania.map(z=>z.id)).size!==2))throw Error(`Zadanie ${idx+1}: wymagane dwa zdania P/F`);
  if(typ==='@UZ'&&(odp.length!==2||uzasadnienia.length!==3||!odp.some(o=>o.id===poprawna[0])||!uzasadnienia.some(o=>o.id===poprawna[1])))throw Error(`Zadanie ${idx+1}: wymagane A–B, 1–3 i POPRAWNA: np. A1`);
  return {typ,tresc:tresc.join('\n'),odp:wymieszaj(odp),zdania:wymieszaj(zdania),uzasadnienia:wymieszaj(uzasadnienia),poprawna};
 });
}
function opisyWyborow(numer,elementy,grupa,baza,literowanie){
 return elementy.map((o,i)=>`<label class="wybor"><input type="radio" name="z${numer}_${grupa}" value="${o.id}"><b>${literowanie[i]}.</b> ${pokazTekst(o.tekst,baza)}</label>`).join('');
}
function rysuj(test,baza){
 $('zadania').innerHTML=test.map((z,i)=>{
  let html=`<section class="zadanie"><h3>Zadanie ${i+1} (1 pkt)</h3><p>${pokazTekst(z.tresc,baza)}</p>`;
  if(z.typ==='@ABC')html+=opisyWyborow(i,z.odp,'abc',baza,['A','B','C','D']);
  if(z.typ==='@PF')html+=z.zdania.map((p,j)=>`<div class="pf"><span>${j+1}. ${pokazTekst(p.tekst,baza)}</span><label><input type="radio" name="z${i}_pf${p.id}" value="P">P</label><label><input type="radio" name="z${i}_pf${p.id}" value="F">F</label></div>`).join('');
  if(z.typ==='@UZ'){
   html+='<p><b>Wybierz odpowiedź:</b></p>'+opisyWyborow(i,z.odp,'wybor',baza,['A','B']);
   html+='<p><b>Wybierz uzasadnienie:</b></p>'+opisyWyborow(i,z.uzasadnienia,'uz',baza,['1','2','3']);
  }
  return html+'</section>';
 }).join('');
 if(window.MathJax?.typesetPromise)MathJax.typesetPromise([$('zadania')]).catch(console.error);
}
function wybor(nazwa){return document.querySelector(`input[name="${nazwa}"]:checked`)?.value??null;}
function ocen(){
 let punkty=0;
 for(let i=0;i<aktywne.length;i++){
  const z=aktywne[i];let ok=false;
  if(z.typ==='@ABC')ok=wybor(`z${i}_abc`)===z.poprawna;
  if(z.typ==='@PF')ok=z.zdania.every(p=>wybor(`z${i}_pf${p.id}`)===p.poprawna);
  if(z.typ==='@UZ')ok=wybor(`z${i}_wybor`)+wybor(`z${i}_uz`)===z.poprawna;
  if(ok)punkty++;
 }
 const procent=Math.round(punkty/aktywne.length*100);
 $('wynik').textContent=`Wynik: ${punkty}/${aktywne.length} pkt — ${procent}%`;
 $('wynik').scrollIntoView({behavior:'smooth',block:'center'});
}
async function tekst(url){const odp=await fetch(url,{cache:'no-store'});if(!odp.ok)throw Error(`Nie udało się pobrać pliku (${odp.status})`);return odp.text();}
function ustaleniaRepozytorium(){
 const cfg=window.KONFIGURACJA||{};
 const host=location.hostname;
 const pages=/^([a-z0-9-]+)\.github\.io$/i.exec(host);
 const owner=(cfg.owner||pages?.[1]||'').trim();
 const segment=decodeURIComponent(location.pathname.split('/').filter(Boolean)[0]||'');
 const repo=(cfg.repo||(pages ? (segment||`${owner}.github.io`) : '')).trim();
 const branch=(cfg.branch||'main').trim();
 const folder=(cfg.folder||'testy').trim().replace(/^\/+|\/+$/g,'');
 if(!owner||!repo)throw Error('Nie mogę rozpoznać repozytorium. Wpisz owner i repo w config.js (podczas pracy lokalnej jest to konieczne).');
 for(const [k,v] of Object.entries({owner,repo,branch})){
  if(!/^[a-zA-Z0-9._-]+$/.test(v))throw Error(`Niedozwolona wartość ${k} w config.js`);
 }
 if(!/^[\p{L}\p{N}_\-]+$/u.test(folder))throw Error('Nieprawidłowa nazwa folderu testów.');
 return {owner,repo,branch,folder};
}
async function pobierzListeGitHub(){
 const cfg=ustaleniaRepozytorium();
 const klucz=`testy-api-v2:${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.folder}`;
 try{
  const pamiec=JSON.parse(sessionStorage.getItem(klucz)||'null');
  if(pamiec&&Date.now()-pamiec.czas<10*60*1000)return pamiec.testy;
 }catch(_){/* pamięć niedostępna */}
 const adres=`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/trees/${encodeURIComponent(cfg.branch)}?recursive=1`;
 const odp=await fetch(adres,{headers:{Accept:'application/vnd.github+json'}});
 if(!odp.ok){
  if(odp.status===403||odp.status===429)throw Error('Limit zapytań GitHub API. Spróbuj ponownie później.');
  if(odp.status===404)throw Error('Nie znaleziono publicznego repozytorium albo gałęzi. Sprawdź config.js i ustawienia GitHub Pages.');
  throw Error(`GitHub API: błąd HTTP ${odp.status}`);
 }
 const dane=await odp.json();
 if(dane.truncated)throw Error('Repozytorium jest zbyt duże, aby automatycznie odczytać pełną listę testów.');
 const prefiks=`${cfg.folder}/`;
 const testy=(dane.tree||[]).filter(p=>p.type==='blob'&&p.path.startsWith(prefiks)&&p.path.endsWith('/test.txt'))
   .map(p=>p.path.slice(prefiks.length,-'/test.txt'.length))
   .filter(n=>n&&!n.includes('/')&&!n.startsWith('.'))
   .map(n=>({nazwa:n.replace(/[_-]+/g,' '),plik:`${cfg.folder}/${n}/test.txt`}))
   .sort((a,b)=>a.nazwa.localeCompare(b.nazwa,'pl'));
 try{sessionStorage.setItem(klucz,JSON.stringify({czas:Date.now(),testy}));}catch(_){}
 return testy;
}
(async()=>{
 try{
 const poprawne=await pobierzListeGitHub();
 if(!poprawne.length)throw Error('Nie znaleziono testów. Dodaj folder testy/NAZWA/test.txt w repozytorium.');
 $('wybor').innerHTML='<option value="">— wybierz test —</option>';
 poprawne.forEach((t,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=t.nazwa;$('wybor').append(opt);});
 $('wybor').addEventListener('change',()=>{$('start').disabled=!$('wybor').value;$('formularz').hidden=true;$('wynik').textContent='';});
 $('start').addEventListener('click',async()=>{
  try{
   $('komunikat').textContent='';
   const t=poprawne[Number($('wybor').value)];const url=new URL(t.plik,document.baseURI);
   aktywne=wczytajTest(await tekst(url));if(!aktywne.length)throw Error('Pusty test');
   $('nazwa').textContent=t.nazwa;rysuj(aktywne,url);$('formularz').hidden=false;$('wynik').textContent='';
  }catch(e){$('komunikat').textContent=e.message;}
 });
 $('formularz').addEventListener('submit',e=>{e.preventDefault();ocen();});
 }catch(e){$('wybor').innerHTML='<option value="">Nie udało się pobrać listy</option>';$('komunikat').textContent=`Błąd listy testów: ${e.message}`;}
})();
