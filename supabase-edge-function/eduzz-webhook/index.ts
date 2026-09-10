import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const PRODUCT_ID = "3103335";
async function hmacHex(secret:string,body:string){const enc=new TextEncoder();const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,enc.encode(body));return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("");}
Deno.serve(async(req)=>{
 if(req.method!=="POST") return new Response("Method not allowed",{status:405});
 const raw=await req.text(); const secret=Deno.env.get("EDUZZ_WEBHOOK_SECRET")||""; const received=req.headers.get("x-signature")||"";
 if(!secret||!received) return new Response("Missing signature",{status:401});
 const expected=await hmacHex(secret,raw); if(expected.toLowerCase()!==received.toLowerCase()) return new Response("Invalid signature",{status:401});
 let payload:any; try{payload=JSON.parse(raw)}catch{return new Response("Invalid JSON",{status:400})}
 const event=payload?.event||""; const data=payload?.data||{}; const email=String(data?.buyer?.email||data?.student?.email||"").trim().toLowerCase(); const buyerName=String(data?.buyer?.name||data?.student?.name||"").trim(); const invoiceId=String(data?.id||""); const items=Array.isArray(data?.items)?data.items:[]; const hasProduct=items.some((i:any)=>String(i?.productId)===PRODUCT_ID);
 if(!email||!hasProduct) return new Response(JSON.stringify({ok:true,ignored:true}),{headers:{"content-type":"application/json"}});
 const active=event==="myeduzz.invoice_paid"; const revoke=new Set(["myeduzz.invoice_refunded","myeduzz.invoice_canceled","myeduzz.invoice_chargeback"]); if(!active&&!revoke.has(event)) return new Response(JSON.stringify({ok:true,ignored:true}),{headers:{"content-type":"application/json"}});
 const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); const {error}=await sb.from("customer_access").upsert({email,product_id:PRODUCT_ID,active,invoice_id:invoiceId,buyer_name:buyerName,updated_at:new Date().toISOString()},{onConflict:"email,product_id"});
 if(error)return new Response(JSON.stringify({ok:false,error:error.message}),{status:500,headers:{"content-type":"application/json"}}); return new Response(JSON.stringify({ok:true,email,active}),{headers:{"content-type":"application/json"}});
});
