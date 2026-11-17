/* Data validation and matching shared by browser and checks. */
(function(root){
'use strict';
function norm(s){return String(s??'').normalize('NFKC').replace(/[‐‑‒–—―ー−]/g,'-').replace(/番地|番/g,'-').replace(/号/g,'').replace(/\s/g,'').replace(/-$/,'');}
function value(p,names){for(const n of names)if(p[n]!==undefined&&p[n]!==null&&String(p[n]).trim()!=='')return String(p[n]).trim();return '';}
function classify(f,code){
 const p=f.properties||{};
 if(value(p,['市区町村C','市区町村コード','市町村コード']).padStart(5,'0')!==code)return {reason:'市町村が一致しません'};
 if(value(p,['座標系','座標系名']).includes('任意'))return {reason:'任意座標'};
 const area=['大字名','丁目名','小字名','予備名'].map(k=>value(p,[k])).filter(Boolean).join('');const lot=value(p,['地番']);
 if(!area||!lot)return {reason:'地区・地番が不足'};
 const g=f.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type))return {reason:'非対応図形'};
 const rings=g.type==='Polygon'?g.coordinates:g.coordinates.flat();
 if(!rings.length||!rings.every(r=>r.length>=4&&r.every(c=>Number.isFinite(c[0])&&Number.isFinite(c[1])&&c[0]>139&&c[0]<142&&c[1]>36&&c[1]<39)))return {reason:'座標確認要'};
 return {area,lot,key:norm(lot),feature:f};
}
const api={norm,classify};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LandCore=api;
})(typeof window==='undefined'?{}:window);
