const BASE="https://api.fortnite.com/ecosystem/v1";
const CODE="0400-9013-9315";
const METRICS=["peak-ccu","plays","unique-players","minutes-played","minutes-per-player","favorites","recommends","retention-d1","retention-d7"];
const INTERVALS=["minute","hour","day"];
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Cache-Control":"public, max-age=60"};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors}})}
function auth(req,env){const value=req.headers.get("Authorization")||"";return !!env.ADMIN_TOKEN&&value==="Bearer "+env.ADMIN_TOKEN}
async function readInterval(code,interval){
 const url=BASE+"/islands/"+encodeURIComponent(code)+"/metrics/"+interval;
 const response=await fetch(url,{headers:{"Accept":"application/json"},cf:{cacheTtl:0}});
 if(!response.ok) throw new Error("Epic API returned "+response.status);
 return await response.json();
}
const aliases={
 "peak-ccu":["peakCCU","peakCcu","peak-ccu","peak_ccu"],
 "plays":["plays"],
 "unique-players":["uniquePlayers","unique-players","unique_players"],
 "minutes-played":["minutesPlayed","minutes-played","minutes_played"],
 "minutes-per-player":["minutesPerPlayer","minutes-per-player","minutes_per_player"],
 "favorites":["favorites"],
 "recommends":["recommends","recommendations"],
 "retention-d1":["retentionD1","retention-d1","retention_d1"],
 "retention-d7":["retentionD7","retention-d7","retention_d7"]
};
function metricSeries(body){
 const source=body?.metrics||body?.data||body;
 const result=[];
 if(Array.isArray(source)){
  for(const item of source){
   const key=item.metric||item.name||item.key;
   const canonical=METRICS.find(name=>aliases[name].includes(key));
   if(!canonical)continue;
   const series=item.data||item.values||item.points||item.results||[item];
   if(Array.isArray(series))for(const point of series)result.push({metric:canonical,point});
  }
 }else if(source&&typeof source==="object"){
  for(const metric of METRICS){
   const key=aliases[metric].find(candidate=>candidate in source);
   if(!key)continue;
   const raw=source[key];
   const series=Array.isArray(raw)?raw:(raw?.data||raw?.values||raw?.points||[]);
   if(Array.isArray(series))for(const point of series)result.push({metric,point});
  }
 }
 return result;
}
async function collect(env){
 let stored=0,errors=[];
 for(const interval of INTERVALS){
  try{
   const body=await readInterval(CODE,interval);
   for(const {metric,point} of metricSeries(body)){
    const at=point.timestamp||point.date||point.time;
    if(!at)continue;
    await env.DB.prepare("INSERT OR IGNORE INTO island_metrics (island_code,metric,interval,observed_at,value) VALUES (?,?,?,?,?)").bind(CODE,metric,interval,new Date(at).toISOString(),point.value==null?null:Number(point.value)).run();
    stored++;
   }
  }catch(error){errors.push(interval+": "+String(error))}
  await new Promise(resolve=>setTimeout(resolve,300));
 }
 return {stored,errors};
}
async function snapshot(env,url){
 const interval=["minute","hour","day"].includes(url.searchParams.get("interval"))?url.searchParams.get("interval"):"minute";
 const rows=await env.DB.prepare("SELECT metric,observed_at,value FROM island_metrics WHERE island_code=? AND interval=? ORDER BY observed_at DESC LIMIT 500").bind(CODE,interval).all();
 const latest={};
 for(const row of rows.results||[])if(!(row.metric in latest))latest[row.metric]=row;
 return {islandCode:CODE,interval,source:"Epic Fortnite Data API",observedAt:Object.values(latest).map(x=>x.observed_at).sort().at(-1)||null,metrics:latest,history:rows.results||[]};
}
function csvEscape(value){const s=String(value??"");return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s}
async function importCsv(req,env){
 if(!auth(req,env))return json({error:"Unauthorized"},401);
 const text=await req.text();
 if(text.length>2_000_000)return json({error:"CSV exceeds 2MB limit"},413);
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);
 if(lines.length<2)return json({error:"CSV must include a header and at least one data row"},400);
 const parse=line=>{const out=[];let v="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q&&c==='"'&&line[i+1]==='"'){v+='"';i++}else if(c==='"')q=!q;else if(c===","&&!q){out.push(v);v=""}else v+=c}out.push(v);return out};
 const headers=parse(lines[0]).map(x=>x.trim().toLowerCase());
 const col=(...names)=>headers.findIndex(x=>names.includes(x));
 const trackCol=col("track","track_name","track_key");
 const eventCol=col("event_type","event","type");
 const timeCol=col("occurred_at","timestamp","date","time");
 const modeCol=col("mode","race_mode");
 if([trackCol,eventCol,timeCol].some(i=>i<0))return json({error:"Expected CSV columns: track, event_type, occurred_at; optional mode, session_key, checkpoint_key, duration_ms"},400);
 const sessionCol=col("session_key","session_id");
 const checkpointCol=col("checkpoint_key","checkpoint");
 const durationCol=col("duration_ms","race_duration_ms");
 const batch=crypto.randomUUID();
 await env.DB.prepare("INSERT INTO import_batches(batch_id,source_name,status) VALUES(?,?,?)").bind(batch,req.headers.get("X-Import-Name")||"creator-portal.csv","importing").run();
 let imported=0;
 for(let i=1;i<lines.length;i++){
  const row=parse(lines[i]);
  const type=String(row[eventCol]||"").toLowerCase();
  if(!["vote","start","finish","dnf","checkpoint"].includes(type))continue;
  const time=new Date(row[timeCol]);
  if(Number.isNaN(time.getTime()))continue;
  await env.DB.prepare("INSERT INTO track_events(island_code,track_key,event_type,mode,session_key,checkpoint_key,duration_ms,occurred_at,source,import_batch) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .bind(CODE,row[trackCol],type,modeCol>=0?row[modeCol]||null:null,sessionCol>=0?row[sessionCol]||null:null,checkpointCol>=0?row[checkpointCol]||null:null,durationCol>=0&&row[durationCol]?Number(row[durationCol]):null,time.toISOString(),"creator_portal_csv",batch).run();
  imported++;
 }
 await env.DB.prepare("UPDATE import_batches SET rows_seen=?,rows_imported=?,status='complete' WHERE batch_id=?").bind(lines.length-1,imported,batch).run();
 return json({batch,rowsSeen:lines.length-1,rowsImported:imported});
}
export default{
 async scheduled(event,env,ctx){ctx.waitUntil(collect(env))},
 async fetch(req,env){
  const url=new URL(req.url);
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(url.pathname==="/api/health")return json({ok:true,service:"Full Send Racing analytics",dataConfigured:true});
  if(url.pathname==="/api/snapshot"&&req.method==="GET")return json(await snapshot(env,url));
  if(url.pathname==="/api/import.csv"&&req.method==="POST")return importCsv(req,env);
  if(url.pathname==="/api/admin/collect"&&req.method==="POST"){if(!auth(req,env))return json({error:"Unauthorized"},401);return json(await collect(env))}
  if(url.pathname==="/api/admin/events"&&req.method==="GET"){if(!auth(req,env))return json({error:"Unauthorized"},401);const rows=await env.DB.prepare("SELECT * FROM track_events ORDER BY occurred_at DESC LIMIT 500").all();return json(rows.results||[])}
  if(url.pathname==="/api/admin/export.csv"&&req.method==="GET"){
   if(!auth(req,env))return json({error:"Unauthorized"},401);
   const result=await env.DB.prepare("SELECT island_code,track_key,event_type,mode,session_key,checkpoint_key,duration_ms,occurred_at,source FROM track_events ORDER BY occurred_at").all();
   const rows=result.results||[],keys=["island_code","track_key","event_type","mode","session_key","checkpoint_key","duration_ms","occurred_at","source"];
   return new Response([keys.join(","),...rows.map(row=>keys.map(k=>csvEscape(row[k])).join(","))].join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=full-send-track-events.csv",...cors}});
  }
  return json({error:"Not found"},404)
 }
};