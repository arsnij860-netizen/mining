(() => {
'use strict';
const $ = id => document.getElementById(id);
const defaults = {coins:1250,btc:0,eth:0,running:true,gpus:[1,1,0,0],cooling:0,psu:0,software:0,last:Date.now()};
const gpuTypes = [
{name:'RX 6600',desc:'28 MH/s · 95 W · стартовая видеокарта',hash:28,watts:95,temp:59,cost:650,icon:'▰'},
{name:'RTX 3060',desc:'42 MH/s · 125 W · сбалансированная',hash:42,watts:125,temp:63,cost:1250,icon:'▰'},
{name:'RTX 4070',desc:'62 MH/s · 160 W · высокая эффективность',hash:62,watts:160,temp:65,cost:2800,icon:'▰'},
{name:'RX 7900 XTX',desc:'92 MH/s · 280 W · мощный риг',hash:92,watts:280,temp:72,cost:5200,icon:'▰'}];
let state=load();
function load(){try{const s=JSON.parse(localStorage.getItem('gpuMiningSave'));if(s&&Array.isArray(s.gpus))return {...defaults,...s};}catch(e){}return {...defaults,gpus:[1,1,0,0]};}
function save(){state.last=Date.now();try{localStorage.setItem('gpuMiningSave',JSON.stringify(state));}catch(e){}}
function n(v,d=2){return Number(v).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});}
function total(field){return gpuTypes.reduce((s,g,i)=>s+g[field]*state.gpus[i],0);}
function gpuCount(){return state.gpus.reduce((a,b)=>a+b,0);}
function hash(){return total('hash')*(1+state.software*.15);}
function watts(){return total('watts')*(1-state.psu*.1);}
function temp(){return gpuCount()?Math.round(Math.max(28,total('temp')/gpuCount()-state.cooling*8+Math.max(0,gpuCount()-3)*2)):28;}
function rateBTC(){return 2500000;} function rateETH(){return 145000;}
function hourly(){const h=hash();return {btc:h*.00000000085,eth:h*.000000011,gcoin:h*.19-Math.max(0,watts())*.012};}
function drawRigs(){
 const count=Math.max(1,Math.min(8,gpuCount()));$('rigs').innerHTML='';
 for(let i=0;i<count;i++){const g=gpuTypes[state.gpus.findIndex(v=>v>0)]||gpuTypes[0];const el=document.createElement('div');el.className='rig';
 el.innerHTML='<span class="rig-label">RIG-'+String(i+1).padStart(2,'0')+'</span><div class="gpu-board"><i class="fan"></i><i class="fan"></i></div><div class="gpu-board"><i class="fan"></i><i class="fan"></i></div><span class="rig-label">'+g.name+'</span><div class="rig-leds"><i></i><i></i><i></i></div>';$('rigs').appendChild(el);}
}
function renderShop(){$('shop').innerHTML='';gpuTypes.forEach((g,i)=>{const el=document.createElement('article');el.className='gpu-item';el.innerHTML='<div class="gpu-art">'+g.icon+'</div><div class="gpu-details"><strong>'+g.name+'</strong><small>'+g.desc+'<br>Установлено: '+state.gpus[i]+'</small></div><button class="buy-btn">'+n(g.cost,0)+' G</button>';const btn=el.querySelector('button');btn.disabled=state.coins<g.cost;btn.addEventListener('click',()=>buyGPU(i));$('shop').appendChild(el);});}
function render(){
 $('coins').textContent=n(state.coins);$('btc').textContent=n(state.btc,6);$('eth').textContent=n(state.eth,5);
 $('hash').textContent=n(hash(),0)+' MH/s';$('watts').textContent=n(watts(),0)+' W';$('temp').textContent=temp()+'°C';
 const p=hourly().gcoin;$('profit').textContent=(p>=0?'+':'')+n(p)+' G';$('profit').className=p>=0?'green':'';
 $('gpuCount').textContent=gpuCount()+' GPU';$('status').textContent=state.running?'РАБОТАЕТ':'ВЫКЛЮЧЕНА';
 $('powerBtn').classList.toggle('off',!state.running);$('powerBtn').innerHTML='⏻ <span>'+(state.running?'ФЕРМА ВКЛ':'ФЕРМА ВЫКЛ')+'</span>';
 $('coolLevel').textContent='Уровень '+state.cooling;$('psuLevel').textContent='Уровень '+state.psu;$('softLevel').textContent='Уровень '+state.software;
 $('coolBtn').textContent=n(250*(state.cooling+1),0)+' G';$('psuBtn').textContent=n(350*(state.psu+1),0)+' G';$('softBtn').textContent=n(500*(state.software+1),0)+' G';
 $('coolBtn').disabled=state.coins<250*(state.cooling+1);$('psuBtn').disabled=state.coins<350*(state.psu+1);$('softBtn').disabled=state.coins<500*(state.software+1);
 $('btcRate').textContent='1 BTC = '+n(rateBTC(),0)+' G';$('ethRate').textContent='1 ETH = '+n(rateETH(),0)+' G';$('sellBtc').disabled=state.btc<=0;$('sellEth').disabled=state.eth<=0;
 drawRigs();renderShop();
}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
function buyGPU(i){const g=gpuTypes[i];if(state.coins<g.cost)return toast('Недостаточно GCOIN');state.coins-=g.cost;state.gpus[i]++;save();render();toast(g.name+' добавлена в ферму');}
function upgrade(key,cost,label){if(state.coins<cost)return toast('Недостаточно GCOIN');state.coins-=cost;state[key]++;save();render();toast(label+' улучшено');}
$('powerBtn').addEventListener('click',()=>{state.running=!state.running;save();render();toast(state.running?'Майнинг запущен':'Ферма остановлена');});
$('coolBtn').addEventListener('click',()=>upgrade('cooling',250*(state.cooling+1),'Охлаждение'));
$('psuBtn').addEventListener('click',()=>upgrade('psu',350*(state.psu+1),'Блок питания'));
$('softBtn').addEventListener('click',()=>upgrade('software',500*(state.software+1),'Майнер'));
$('sellBtc').addEventListener('click',()=>{const a=state.btc*.25;if(a<=0)return;state.btc-=a;state.coins+=a*rateBTC();save();render();toast('Продано '+n(a,6)+' BTC');});
$('sellEth').addEventListener('click',()=>{const a=state.eth*.25;if(a<=0)return;state.eth-=a;state.coins+=a*rateETH();save();render();toast('Продано '+n(a,5)+' ETH');});
function tick(){if(state.running){const r=hourly();state.btc+=r.btc/3600;state.eth+=r.eth/3600;state.coins=Math.max(0,state.coins+r.gcoin/3600);}render();save();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const now=Date.now(),elapsed=Math.min(28800,Math.max(0,(now-(state.last||now))/1000));if(state.running){const r=hourly();state.btc+=r.btc/3600*elapsed;state.eth+=r.eth/3600*elapsed;state.coins=Math.max(0,state.coins+r.gcoin/3600*elapsed);}save();render();}});
document.querySelectorAll('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.mobile-nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');}));
render();setInterval(tick,1000);
})();