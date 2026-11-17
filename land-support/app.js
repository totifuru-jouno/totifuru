'use strict';
const $=id=>document.getElementById(id),catalog=window.LAND_INDEX,{norm,classify}=window.LandCore;
let records=[],selected=null,layer=null,map=null,currentArea='',busy=false,currentTown=null;
const edition='配布名2026／内部名称2025（年度整合未確認）';
if(window.L){
 map=L.map('map',{scrollWheelZoom:false}).setView([37.146,140.446],11);
 const std=L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',{maxZoom:18,attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'});
 const photo=L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',{maxZoom:18,attribution:'国土地理院'});std.addTo(map);
 L.control.layers({'地形図':std,'航空写真':photo}).addTo(map);
 for(const t of [std,photo])t.on('tileerror',()=>{$('map-error').textContent='背景地図を取得できない部分があります。通信状況をご確認ください。';});
}else $('map-error').textContent='地図表示用プログラムを読み込めません。ページを再読み込みしてください。';
function setConsult(area='',lot=''){
 const subject='【土地フル合同会社】相続した土地の位置調査についてのご相談';
 const body='土地フル合同会社 ご担当者様\n\n土地の所在：'+(currentTown?currentTown.fullName:'福島県石川郡')+' '+area+'\n地番：'+lot+'\n\nご相談内容：\n\nお名前：\nご連絡先：';
 $('consult').href='mailto:totifuru@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
function clearSelection(){selected=null;if(layer){layer.remove();layer=null;}$('download').hidden=true;$('gsi').hidden=true;$('selected').textContent='土地はまだ選択されていません。';$('map-caption').textContent=(currentTown?currentTown.fullName:'石川郡')+'周辺の背景地図です。検索した土地の位置ではありません。';}
function fillAreas(filter=''){
 const old=$('area').value;$('area').replaceChildren(new Option('大字・字を選んでください',''));
 for(const a of currentTown.areas.filter(a=>norm(a.label).includes(norm(filter))))$('area').add(new Option(a.label+'（'+a.count+'件）',a.id));
 if([...$('area').options].some(o=>o.value===old))$('area').value=old;
}
function changeTown(){
 currentTown=catalog.towns.find(t=>t.code===$('town').value);currentArea='';records=[];
 $('area-filter').value='';$('lot').value='';$('results').replaceChildren();clearSelection();fillAreas();setConsult();
 $('status').textContent=currentTown.name+'：'+currentTown.areas.length.toLocaleString()+'地区・'+currentTown.count.toLocaleString()+'件から検索できます。';
 $('town-info').textContent='選択中：'+currentTown.fullName+'（'+currentTown.code+'）';
 if(map){const b=currentTown.bbox;map.fitBounds([[b[1],b[0]],[b[3],b[2]]],{padding:[12,12],maxZoom:12});}
}
function choose(r){
 clearSelection();selected=r;
 if(map){layer=L.geoJSON(r.feature,{style:{color:'#c05b22',weight:3,fillColor:'#efad43',fillOpacity:.28}}).addTo(map);map.fitBounds(layer.getBounds(),{padding:[28,28],maxZoom:18});const c=layer.getBounds().getCenter();$('gsi').href='https://maps.gsi.go.jp/#17/'+c.lat.toFixed(6)+'/'+c.lng.toFixed(6)+'/';$('gsi').hidden=false;}
 $('selected').textContent=currentTown.fullName+' '+r.area+' '+r.lot+' ／ '+edition;
 $('map-caption').textContent='オレンジ色：選択した公開データの筆形状（参考表示）';$('download').hidden=false;setConsult(r.area,r.lot);
}
function loadArea(entry){
 if(currentArea===entry.id)return Promise.resolve(records);
 const code=currentTown.code;
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');let timer;
  const clean=()=>{clearTimeout(timer);script.remove();window.receiveLandChunk=()=>{};};
  window.receiveLandChunk=d=>{if(d.id!==entry.id||d.code!==code)return;try{
   const next=d.features.map(f=>classify(f,code));
   if(next.some(r=>r.reason||r.area!==entry.label)||next.length!==entry.count)throw Error('地区データの照合に失敗しました。');
   records=next;currentArea=entry.id;clean();resolve(records);
  }catch(e){clean();reject(e);}};
  script.charset='utf-8';script.src='data-five/'+entry.id+'.js?v='+encodeURIComponent(catalog.version);
  script.onerror=()=>{clean();reject(Error('地区データを読み込めません。通信状況を確認して、再度お試しください。'));};
  timer=setTimeout(()=>{clean();reject(Error('データの読み込みが時間切れになりました。再度検索してください。'));},15000);
  document.body.append(script);
 });
}
if(catalog?.towns?.length===5){
 $('town').replaceChildren(...catalog.towns.map(t=>new Option(t.name,t.code)));for(const id of ['town','area','lot','submit'])$(id).disabled=false;changeTown();
}else $('status').textContent='検索用データを読み込めませんでした。ページを再読み込みしてください。';
$('town').onchange=changeTown;
$('area-filter').oninput=()=>{if(currentTown){fillAreas($('area-filter').value);clearSelection();$('results').replaceChildren();setConsult();$('status').textContent='大字・字の候補を絞りました。地区を選び、地番を入力してください。';}};
$('area').onchange=()=>{clearSelection();$('results').replaceChildren();const a=currentTown.areas.find(a=>a.id===$('area').value);setConsult(a?.label||'',$('lot').value);$('status').textContent='地番を入力して検索してください。';};
$('search').onsubmit=async e=>{
 e.preventDefault();if(busy||!currentTown)return;
 const entry=currentTown.areas.find(a=>a.id===$('area').value);if(!entry)return;const key=norm($('lot').value);
 if(!key){$('status').textContent='地番を入力してください。';return;}
 busy=true;for(const id of ['submit','town','area','area-filter','lot'])$(id).disabled=true;
 clearSelection();$('results').replaceChildren();setConsult(entry.label,$('lot').value);$('status').textContent='地区のデータを検索しています…';
 try{await loadArea(entry);const found=records.filter(r=>r.key===key);
  if(!found.length){$('status').textContent='収録データでは見つかりませんでした。字・地番の表記や収録時点の違いをご確認ください。土地が存在しないという意味ではありません。';return;}
  $('status').textContent=found.length+'件の候補が見つかりました。'+(found.length>1?'図面名などを比較し、候補を選択してください。':'該当する公開データを表示しました。');
  found.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.textContent=r.area+' '+r.lot+(found.length>1?'（候補'+(i+1)+'／図面：'+(r.feature.properties['地図名']||'不明')+'）':'');b.onclick=()=>choose(r);$('results').append(b);});
  if(found.length===1)choose(found[0]);
 }catch(e){$('status').textContent=e.message;}finally{busy=false;for(const id of ['submit','town','area','area-filter','lot'])$(id).disabled=false;}
};
$('download').onclick=()=>{if(!selected)return;const obj={type:'FeatureCollection',name:currentTown.name+'の位置確認用参考図',source:currentTown.sourceUrl,edition,features:[selected.feature]};const url=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download=currentTown.code+'-land.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
