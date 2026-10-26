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
  // $$...$$ w plikach testu oznacza wzór w TEJ SAMEJ LINII co tekst.
  // MathJax używa tu jawnie trybu inline \( ... \), także przy złamaniu linii.
  let html=escapeHTML(txt).replace(/\$\$([\s\S]*?)\$\$/g,(_,latex)=>'\\('+latex.trim()+'\\)').replace(/\\n/g,'<br>').replace(/\n/g,'<br>');
  obrazy.forEach((img,i)=>{html=html.replace(`@@OBRAZ${i}@@`,img);});
  return `<span class="teksty">${html}</span>`;
}
function wczytajTest(zawartosc){
 const bloki=zawartosc.replace(/\r\n?/g,'\n').trim().split(/\n\s*\n+/);
 return bloki.map((blok,idx)=>{
  const linie=blok.split('\n').map(s=>s.trim()).filter(Boolean);
  const typ=linie.shift();
  if(!['@ABC','@PF','@UZ','@LUKI'].includes(typ))throw Error(`Zadanie ${idx+1}: nieznany typ ${typ}`);
  const tresc=[],odp=[],zdania=[],uzasadnienia=[];let poprawna='';
  let ostatnie=null; // Pozwala kontynuować również długie odpowiedzi w kolejnych wierszach.
  for(const linia of linie){
   let m;
   if((m=linia.match(/^POPRAWNA:\s*(\S+)\s*$/i))){poprawna=m[1].toUpperCase();ostatnie=null;continue;}
   if(typ==='@PF'&&(m=linia.match(/^([12]):\s*(.*?)\s*\|\s*([PF])$/i))){zdania.push({id:m[1],tekst:m[2],poprawna:m[3].toUpperCase()});ostatnie=zdania[zdania.length-1];continue;}
   if((m=linia.match(/^([ABCDE]):\s*(.*)$/))){odp.push({id:m[1],tekst:m[2]});ostatnie=odp[odp.length-1];continue;}
   if(typ==='@UZ'&&(m=linia.match(/^([123]):\s*(.*)$/))){uzasadnienia.push({id:m[1],tekst:m[2]});ostatnie=uzasadnienia[uzasadnienia.length-1];continue;}
   if(ostatnie && linia!=='---'){ostatnie.tekst+='\n'+linia;}
   else {tresc.push(linia);ostatnie=null;}
  }
  if(typ==='@ABC'&&(![4,5].includes(odp.length)||!odp.some(o=>o.id===poprawna)))throw Error(`Zadanie ${idx+1}: wymagane A–D i POPRAWNA`);
  if(typ==='@PF'&&(zdania.length!==2||new Set(zdania.map(z=>z.id)).size!==2))throw Error(`Zadanie ${idx+1}: wymagane dwa zdania P/F`);
  if(typ==='@LUKI'){
   if(odp.length!==4||new Set(odp.map(o=>o.id)).size!==4|| !/^[AB][CD]$/.test(poprawna))throw Error(`Zadanie ${idx+1}: wymagane A, B, C, D i POPRAWNA: np. AC`);
   if(!tresc.join('\n').includes('[[AB]]')||!tresc.join('\n').includes('[[CD]]'))throw Error(`Zadanie ${idx+1}: wstaw w treści [[AB]] i [[CD]]`);
  }
  if(typ==='@UZ'&&(odp.length!==2||uzasadnienia.length!==3||!odp.some(o=>o.id===poprawna[0])||!uzasadnienia.some(o=>o.id===poprawna[1])))throw Error(`Zadanie ${idx+1}: wymagane A–B, 1–3 i POPRAWNA: np. A1`);
  return {typ,tresc:tresc.join('\n'),odp:wymieszaj(odp),zdania:wymieszaj(zdania),uzasadnienia:wymieszaj(uzasadnienia),pary:typ==='@LUKI'?[wymieszaj(odp.filter(o=>'AB'.includes(o.id))),wymieszaj(odp.filter(o=>'CD'.includes(o.id)))]:[],poprawna};
 });
}
function litera(i){return 'ABCDE'[i];}
function tabelaWyborow(numer,elementy,grupa,baza,etykiety){
 return `<div class="tabela-wrap"><table class="tabela-odpowiedzi"><tbody>${elementy.map((o,i)=>`<tr class="wiersz-opcji" data-wybor="${o.id}"><th scope="row" class="symbol">${etykiety[i]}</th><td class="opis-opcji">${pokazTekst(o.tekst,baza)}</td><td class="pole-wyboru"><label class="pole-radio"><input type="radio" name="z${numer}_${grupa}" value="${o.id}" aria-label="Wybierz odpowiedź ${etykiety[i]}"><span aria-hidden="true">●</span></label></td></tr>`).join('')}</tbody></table></div>`;
}
function rysuj(test,baza){
 $('zadania').innerHTML=test.map((z,i)=>{
  let html=`<section class="zadanie" id="zadanie-${i}"><div class="naglowek"><h3>Zadanie ${i+1} <small>(1 pkt)</small></h3><span class="ocena" aria-live="polite"></span></div><div class="tresc-zadania">${pokazTekst(z.tresc,baza)}</div>`;
  if(z.typ==='@ABC')html+=`<div class="opcje-abc">${z.odp.map((o,j)=>`<label class="kafelek" data-wybor="${o.id}"><input type="radio" name="z${i}_abc" value="${o.id}"><b>${litera(j)}.</b> ${pokazTekst(o.tekst,baza)}</label>`).join('')}</div>`;
  if(z.typ==='@PF')html+=`<div class="tabela-wrap"><table class="tabela-pf"><thead><tr><th scope="col">Zdanie</th><th scope="col">P</th><th scope="col">F</th></tr></thead><tbody>${z.zdania.map((p,j)=>`<tr data-pf="${p.id}"><td><b>${j+1}.</b> ${pokazTekst(p.tekst,baza)}</td>${['P','F'].map(v=>`<td class="pole-pf"><label><input type="radio" name="z${i}_pf${p.id}" value="${v}" aria-label="Zdanie ${j+1}: ${v==='P'?'prawda':'fałsz'}"><span aria-hidden="true">●</span></label></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(z.typ==='@UZ')html+=`<div class="tabela-wrap"><table class="tabela-uz" aria-label="Wybierz odpowiedź i uzasadnienie"><tbody><tr><td class="uz-lewa"><table class="uz-czesci"><tbody>${z.odp.map((o,j)=>`<tr data-wybor="${o.id}"><th scope="row" class="uz-symbol"><label class="uz-wybor-symbol"><input type="radio" id="z${i}_wybor_${j}" name="z${i}_wybor" value="${o.id}"><span>${'AB'[j]}.</span></label></th><td><label class="uz-opcja" for="z${i}_wybor_${j}">${pokazTekst(o.tekst,baza)}</label></td></tr>`).join('')}</tbody></table></td><td class="uz-poniewaz">ponieważ</td><td class="uz-prawa"><table class="uz-czesci"><tbody>${z.uzasadnienia.map((o,j)=>`<tr data-wybor="${o.id}"><th scope="row" class="uz-symbol"><label class="uz-wybor-symbol"><input type="radio" id="z${i}_uz_${j}" name="z${i}_uz" value="${o.id}"><span>${j+1}.</span></label></th><td><label class="uz-opcja" for="z${i}_uz_${j}">${pokazTekst(o.tekst,baza)}</label></td></tr>`).join('')}</tbody></table></td></tr></tbody></table></div>`;
  if(z.typ==='@LUKI'){
    // Dwie niezależne pary odpowiedzi w treści, podobnie jak w arkuszu CKE.
    // Każdy widoczny symbol wskazuje losowo przyporządkowaną odpowiedź.
    const grupy=['AB','CD'];
    const wstaw=(tekst)=>{
      const czesci=tekst.split(/(\[\[(?:AB|CD)\]\])/g);
      return czesci.map(c=>{
        if(!/^\[\[(?:AB|CD)\]\]$/.test(c))return pokazTekst(c,baza);
        const grupa=c.slice(2,4),g=grupy.indexOf(grupa);
        return `<span class="luki-inline" role="group" aria-label="Wybierz ${grupa}">${z.pary[g].map((o,j)=>`<label class="luka-przycisk" data-wybor="${o.id}"><input type="radio" name="z${i}_luka${g}" value="${o.id}" aria-label="${grupa[j]}"><span>${grupa[j]}</span></label>`).join('')}</span>`;
      }).join('');
    };
    // Zadania można podzielić linią --- na krótkie akapity; bez pustych wierszy.
    const czesci=z.tresc.split(/\n---\n/);
    html=`<section class="zadanie" id="zadanie-${i}"><div class="naglowek"><h3>Zadanie ${i+1} <small>(1 pkt)</small></h3><span class="ocena" aria-live="polite"></span></div>`+
      czesci.map(tekst=>{
        const grp=tekst.includes('[[AB]]')?0:tekst.includes('[[CD]]')?1:-1;
        return `<div class="luki-akapit">${wstaw(tekst)}</div>`+(grp<0?'':`<div class="luki-para" data-grupa="${grp}">${z.pary[grp].map((o,j)=>`<label class="luki-odpowiedz" data-wybor="${o.id}"><b>${grupy[grp][j]}.</b> ${pokazTekst(o.tekst,baza)}</label>`).join('')}</div>`);
      }).join('');
  }
  return html+'</section>';
 }).join('');
 if(window.MathJax?.typesetPromise)MathJax.typesetPromise([$('zadania')]).catch(console.error);
}
function wybor(nazwa){return document.querySelector(`input[name="${nazwa}"]:checked`)?.value??null;}
function zaznacz(element,dobrze){if(element)element.classList.add(dobrze?'dobrze':'zle');}
function ocen(){
 let punkty=0;
 for(let i=0;i<aktywne.length;i++){
  const z=aktywne[i],karta=$(`zadanie-${i}`);let ok=false;
  if(z.typ==='@ABC'){
   const wsk=wybor(`z${i}_abc`);ok=wsk===z.poprawna;
   zaznacz([...karta.querySelectorAll('.kafelek')].find(el=>el.dataset.wybor===wsk),ok);
   if(!ok)zaznacz([...karta.querySelectorAll('.kafelek')].find(el=>el.dataset.wybor===z.poprawna),true);
  }
  if(z.typ==='@PF'){
   const czesci=z.zdania.map(p=>({p,wsk:wybor(`z${i}_pf${p.id}`)}));
   ok=czesci.every(({p,wsk})=>wsk===p.poprawna);
   czesci.forEach(({p,wsk})=>{
    const w=karta.querySelector(`tr[data-pf="${p.id}"]`);
    if(wsk===p.poprawna)zaznacz(w,true);
    else{zaznacz(w,false);const poprawny=w.querySelector(`input[value="${p.poprawna}"]`);poprawny?.closest('td')?.classList.add('poprawna-komorka');}
   });
  }
  if(z.typ==='@LUKI'){
   const wybor1=wybor(`z${i}_luka0`),wybor2=wybor(`z${i}_luka1`);
   ok=wybor1===z.poprawna[0]&&wybor2===z.poprawna[1];
   [wybor1,wybor2].forEach((w,g)=>{
    const poprawne=z.poprawna[g];
    const para=karta.querySelector(`.luki-para[data-grupa="${g}"]`);
    const odp=[...para.querySelectorAll('.luki-odpowiedz')];
    zaznacz(odp.find(el=>el.dataset.wybor===w),w===poprawne);
    if(w!==poprawne)zaznacz(odp.find(el=>el.dataset.wybor===poprawne),true);
    const przyciski=karta.querySelector(`.luki-inline[aria-label="Wybierz ${g===0?'AB':'CD'}"]`).querySelectorAll('.luka-przycisk');
    for(const el of przyciski){
     if(el.dataset.wybor===w)zaznacz(el,w===poprawne);
     if(el.dataset.wybor===poprawne&&w!==poprawne)el.classList.add('poprawna-komorka');
    }
   });
  }
  if(z.typ==='@UZ'){
   const wy=wybor(`z${i}_wybor`),uz=wybor(`z${i}_uz`);
   const okWy=wy===z.poprawna[0],okUz=uz===z.poprawna[1];ok=okWy&&okUz;
   for(const [pole,wsk,poprawne] of [['wybor',wy,z.poprawna[0]],['uz',uz,z.poprawna[1]]]){
    const grupa=karta.querySelector(`input[name="z${i}_${pole}"]`)?.closest('.uz-czesci');
    const wiersze=[...(grupa?.querySelectorAll('tr[data-wybor]')||[])];
    zaznacz(wiersze.find(el=>el.dataset.wybor===wsk),wsk===poprawne);
    if(wsk!==poprawne)zaznacz(wiersze.find(el=>el.dataset.wybor===poprawne),true);
   }
  }
  if(ok)punkty++;
  karta.classList.add('ocenione');
  const etykieta=karta.querySelector('.ocena');
  etykieta.textContent=ok?'1/1 pkt':'0/1 pkt';etykieta.classList.add(ok?'wynik-ok':'wynik-zero');
 }
 const procent=Math.round(punkty/aktywne.length*100);
 $('wynik').innerHTML=`Wynik: <strong>${punkty}/${aktywne.length} pkt — ${procent}%</strong><p class="legenda"><span class="legenda-ok">Zielone</span> — poprawne odpowiedzi lub części odpowiedzi. <span class="legenda-zle">Czerwone</span> — błędne zaznaczenia. Punkt jest tylko za całe zadanie.</p>`;
 $('formularz').querySelectorAll('input').forEach(el=>el.disabled=true);
 $('formularz').querySelector('button[type="submit"]').disabled=true;
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
   $('nazwa').textContent=t.nazwa;rysuj(aktywne,url);$('formularz').hidden=false;$('wynik').textContent='';$('formularz').querySelector('button[type="submit"]').disabled=false;
  }catch(e){$('komunikat').textContent=e.message;}
 });
 $('formularz').addEventListener('submit',e=>{e.preventDefault();ocen();});
 }catch(e){$('wybor').innerHTML='<option value="">Nie udało się pobrać listy</option>';$('komunikat').textContent=`Błąd listy testów: ${e.message}`;}
})();
