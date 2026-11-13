/* GRAFIPLOT · 27 iconos vectoriales personalizados para el catálogo.
   No modifica las herramientas: solo reemplaza los emojis del catálogo. */
(() => {
"use strict";
const sheet=(body)=>'<svg class="gp-app-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="presentation" aria-hidden="true"><defs><filter id="iconShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#102040" flood-opacity=".30"/></filter></defs><g stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#iconShadow)">'+body+'</g></svg>';
const paper='<rect x="32" y="16" width="58" height="81" rx="6" fill="#fff"/><path d="M42 34h38M42 44h35M42 55h30M42 68h36" stroke="#91a3c4" stroke-width="3"/>';
const pdf='<rect x="27" y="20" width="65" height="79" rx="7" fill="#fff"/><rect x="32" y="55" width="56" height="25" rx="5" fill="#d51532" stroke="none"/><text x="60" y="73" text-anchor="middle" fill="#fff" stroke="none" font-size="17" font-family="Arial" font-weight="900">PDF</text>';
const mini=(x,y,s=1)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="0" y="0" width="45" height="57" rx="5" fill="#fff"/><path d="M9 20h27M9 29h22M9 38h26" stroke="#9cabca" stroke-width="3"/></g>';
const art=[
paper+'<path d="m18 72 12 11 23-26" fill="none" stroke="#19af81" stroke-width="7"/><path d="m77 90 20-23" stroke="#182e5b" stroke-width="8"/>',
'<rect x="24" y="21" width="70" height="64" rx="6" fill="#fff"/><path d="M29 73 49 50l11 11 11-16 19 28z" fill="#38b26e" stroke="#208b54"/><circle cx="78" cy="38" r="6" fill="#f9c844" stroke="none"/><path d="M24 50h70M59 21v64" stroke="#c4d5e7" stroke-width="2"/>',
mini(11,27,.95)+mini(60,21,.95)+'<path d="m41 18 26 0m-7-7 7 7-7 7" fill="none" stroke="#ffdf70" stroke-width="6"/><text x="62" y="111" font-size="19" font-weight="900" text-anchor="middle" stroke="none" fill="#fff">1 2 3</text>',
'<rect x="19" y="14" width="82" height="91" rx="6" fill="#fff"/><path d="M29 41c13-23 20-5 26 1 15 13 28 7 33-3M32 81c12-18 26-18 48-4" fill="none" stroke="#2b3547" stroke-width="4"/><path d="m76 88 21-31" stroke="#f3ad2a" stroke-width="9"/>',
paper+'<path d="m18 40 23-16 23 16-23 15z" fill="#fbbe38" stroke="#2b385b"/><path d="M26 46v20l15 8 15-8V46" fill="#6e3cc2" stroke="#2b385b"/><path d="m70 82 22-14" stroke="#26b6ae" stroke-width="5"/>',
mini(9,36,.9)+mini(62,24,.9)+'<text x="65" y="83" font-size="35" text-anchor="middle" fill="#fff" stroke="#fff" stroke-width="1" font-weight="bold">+</text>',
pdf+'<path d="m94 30 14 15-14 15" stroke="#ffef95" stroke-width="7" fill="none"/>',
paper+'<path d="M30 14a44 44 0 0 1 64 25" fill="none" stroke="#f9eb8b" stroke-width="7"/><path d="m95 22 0 20-19-5" fill="none" stroke="#f9eb8b" stroke-width="7"/>',
mini(13,26,.9)+mini(68,33,.8)+'<path d="m44 102 24-83m-11 10 11-10 9 13" fill="none" stroke="#fff" stroke-width="5"/>',
pdf+'<path d="M72 18V11m-19 0v7M42 88h38" stroke="#fff" stroke-width="5"/><path d="M25 32h70" stroke="#fbadc1" stroke-width="3"/>',
pdf+'<path d="m85 92 19 0m-9-9v18" stroke="#2ae4ca" stroke-width="7"/>',
mini(11,24,.9)+mini(70,24,.9)+'<path d="m38 92 45 0m-9-7 9 7-9 7" fill="none" stroke="#ffed8d" stroke-width="6"/>',
paper+'<text x="60" y="91" font-family="Arial" font-weight="900" font-size="32" text-anchor="middle" fill="#ef5246" stroke="none">123</text>',
paper+'<path d="M62 12C76 38 82 45 82 55a20 20 0 0 1-40 0c0-11 7-22 20-43z" fill="#1ab8ee" stroke="#1883c9"/>',
'<rect x="27" y="18" width="68" height="84" rx="5" fill="#fff"/><path d="M38 81 53 63 65 72 78 55 86 82z" fill="#4cca84" stroke="#369768"/><circle cx="47" cy="42" r="7" fill="#ffc742" stroke="none"/><path d="M29 86 95 20" stroke="#fff" stroke-width="6"/>',
pdf+'<path d="m80 89 24 0m-12-12v24" stroke="#30f4b4" stroke-width="6"/>',
'<rect x="28" y="29" width="65" height="64" rx="7" fill="#fff"/><path d="m27 21 0-8m-8 17h-8m94-8 0-8m8 17h7M20 56h80M60 20v80" stroke="#f1f6ff" stroke-width="5"/><text x="60" y="48" font-size="17" text-anchor="middle" fill="#1261a4" stroke="none" font-weight="900">A4</text><text x="60" y="81" font-size="17" text-anchor="middle" fill="#1261a4" stroke="none" font-weight="900">A3</text>',
paper+'<circle cx="81" cy="84" r="17" fill="#f5d977" stroke="#fff"/><path d="M81 78v16m0-22v1" stroke="#78441a" stroke-width="5"/>',
pdf+'<rect x="29" y="54" width="62" height="28" rx="6" fill="#fff" stroke="none"/><path d="M35 80h45" stroke="#ed4128" stroke-width="5"/><path d="m35 92 50 0" stroke="#fff" stroke-width="5"/>',
paper+'<circle cx="81" cy="72" r="25" fill="#c7ecff" stroke="#fff"/><path d="m98 88 16 16" stroke="#fff" stroke-width="9"/><text x="81" y="78" font-size="19" font-weight="900" text-anchor="middle" stroke="none" fill="#14539d">OCR</text>',
'<rect x="17" y="28" width="61" height="63" rx="7" fill="#fff"/><path d="M24 77 42 56l10 12 12-16 11 25z" fill="#49bf7b" stroke="#35865d"/><path d="m80 57 24 0m-9-9 9 9-9 9" stroke="#fff" stroke-width="5"/>',
paper+'<text x="60" y="86" font-size="45" font-family="Georgia" font-weight="bold" text-anchor="middle" fill="#0e69ce" stroke="none">A</text>',
paper+'<path d="m37 80 14 9 30-40" fill="none" stroke="#2de49b" stroke-width="6"/><path d="M50 95l30 0" stroke="#2252b0" stroke-width="5"/>',
mini(13,21,1)+mini(67,32,.8)+'<path d="M48 12h40" stroke="#fff" stroke-width="6"/>',
'<rect x="27" y="18" width="63" height="82" rx="6" fill="#fff"/><path d="M42 35h34M42 46h26M42 60h29" stroke="#92a3c9"/><path d="M32 86h56" stroke="#ed2649" stroke-width="7"/><path d="M26 15h56" stroke="#fff" stroke-width="6"/>',
paper+'<path d="m46 91 19-19 15 14 21-24" fill="none" stroke="#fbd963" stroke-width="7"/>',
'<rect x="25" y="23" width="70" height="74" rx="8" fill="#fff"/><path d="M38 75V46m17 29V34m17 41V54" stroke="#3295db" stroke-width="8"/><path d="M30 87h57" stroke="#60759e" stroke-width="3"/>'
];
const icons = document.querySelectorAll(".tile .picture .emoji");
icons.forEach((node,i)=>{
 const iconIndex=i<5?i:i+19;
 if(art[iconIndex])node.innerHTML=sheet(art[iconIndex]);
 node.classList.add("gp-custom-icon");
});
})();