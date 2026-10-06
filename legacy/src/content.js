export const MISSIONS=[
 {id:'valley',size:28,waves:3,title:['Долина Янтаря','Amber Valley'],description:['Освойте долину и отразите три осады. Дополнительная цель: доведите население до 24 жителей.','Settle the valley and survive three sieges. Bonus: reach a population of 24.']},
 {id:'bridge',size:32,waves:3,title:['Каменный мост','Stone Bridge'],description:['Удержите переправу через реку и отразите три осады. Мост должен уцелеть.','Hold the river crossing through three sieges. The bridge must survive.']},
 {id:'village',size:32,waves:4,title:['Последний рубеж','The Last Frontier'],description:['Отразите четыре осады и сохраните хотя бы два дома. Спасите обоз и восстановите шахту для дополнительных наград.','Survive four sieges and preserve at least two cottages. Rescue the convoy and restore the mine for bonus rewards.']}
];
export const DIFFICULTIES={easy:{combat:.7,delay:1.3},normal:{combat:1,delay:1},hard:{combat:1.3,delay:.8}};
export function landAt(x,y,map='legacy'){
 const size=map==='legacy'?22:(MISSIONS.find(m=>m.id===map)?.size||22);if(x<0||y<0||x>=size||y>=size)return'void';
 if(map==='bridge'&&x>=17&&x<=19)return y===11?'bridge':'water';
 if(map!=='bridge'&&x>=(map==='legacy'?19:map==='valley'?24:29)||(map==='legacy'&&x===18&&y>12))return'water';
 if((x<5&&y<9)||(y>17&&x<10)||(x>13&&y<5)||(map!=='legacy'&&x>25&&y>20))return'forest';
 if(x>=14&&x<=17&&y>=13&&y<=16||map==='village'&&x>=24&&x<=26&&y>=14&&y<=18)return'rock';
 return'grass';
}
