"use strict";
const byId=id=>document.getElementById(id),subject='【土地フル合同会社】石川郡以外の土地の所在地・位置調査のご相談';
function updateMail(){byId('mail').href='mailto:totifuru@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(byId('draft').value);}
byId('location-form').addEventListener('submit',e=>{e.preventDefault();const val=id=>byId(id).value.trim()||'不明・未記入';byId('draft').value='土地フル合同会社 ご担当者様\n\n石川郡以外の土地について相談します。\n\n都道府県：'+val('prefecture')+'\n市区町村：'+val('municipality')+'\n大字・字など：'+val('district')+'\n地番：'+val('parcel')+'\n土地の種類：'+val('land-kind')+'\n\nお手元の資料・ご相談内容：\n'+val('details')+'\n\nお名前：'+val('person')+'\nご連絡先：'+val('contact')+'\n\nよろしくお願いいたします。';byId('review').hidden=false;byId('feedback').textContent='まだ送信されていません。内容をご確認ください。';updateMail();byId('draft').focus();});
byId('draft').addEventListener('input',updateMail);
byId('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(byId('draft').value);byId('feedback').textContent='相談文をコピーしました。メールに貼り付けてお送りください。';}catch{byId('draft').focus();byId('draft').select();byId('feedback').textContent='相談文を選択しました。長押しなどでコピーしてください。';}});
