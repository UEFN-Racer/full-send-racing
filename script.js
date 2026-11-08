const tracks=[
 {name:"Pandora Islands",state:"listed"},
 {name:"Corn Maze",state:"listed"},
 {name:"Kraken Cove",state:"listed"},
 {name:"Lake Canyon",state:"listed"},
 {name:"Skull Rock Curves",state:"listed"},
 {name:"Easy Sands",state:"listed"},
 {name:"Magtown V2",state:"listed"},
 {name:"Slurp Canyon",state:"listed"},
 {name:"Escape Pompeii",state:"listed"},
 {name:"Block World",state:"listed"},
 {name:"Olympia",state:"listed"},
 {name:"Neon Nights",state:"listed"},
 {name:"Spooky Death Run",state:"listed"},
 {name:"Vipers Run",state:"unconfirmed"},
 {name:"Submersion",state:"unconfirmed"}
];
const grid=document.getElementById("trackGrid");
const search=document.getElementById("trackSearch");
const empty=document.getElementById("emptyTracks");
function drawTracks(){
 const query=search.value.trim().toLocaleLowerCase();
 const filtered=tracks.filter(track=>track.name.toLocaleLowerCase().includes(query));
 grid.innerHTML=filtered.map((track,index)=>'<article class="track-card" data-num="'+String(index+1).padStart(2,"0")+'"><span class="track-number">ROUTE / '+String(index+1).padStart(2,"0")+'</span><h3>'+track.name+'</h3>'+(track.state==="unconfirmed"?'<span class="pending">AVAILABILITY UNCONFIRMED</span>':"")+'</article>').join("");
 empty.hidden=filtered.length!==0;
}
search.addEventListener("input",drawTracks);
drawTracks();
document.getElementById("copy").addEventListener("click",async event=>{
 const button=event.currentTarget;
 try{await navigator.clipboard.writeText("0400-9013-9315");button.textContent="COPIED ✓"}
 catch{button.textContent="0400-9013-9315"}
});
