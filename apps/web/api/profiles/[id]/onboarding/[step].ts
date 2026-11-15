import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';
export default async function handler(req: VercelRequest,res:VercelResponse){
 const user=await requireUser(req,res);if(!user)return;
 const profileId=Array.isArray(req.query.id)?req.query.id[0]:req.query.id;
 const profile=await db.getProfile(profileId);if(!profile||profile.user_id!==user.id)return error(res,403,'Acesso negado','FORBIDDEN');
 const step=Array.isArray(req.query.step)?req.query.step[0]:req.query.step;
 if(!step||!/^[a-zA-Z0-9_-]{1,80}$/.test(step))return error(res,400,'Etapa inválida','VALIDATION');
 const rows=await db.gQuery<{id:string;step:string}>('onboarding_progress',`profile_id=eq.${profileId}&step=eq.${encodeURIComponent(step)}`);
 const current=rows.find((row)=>row.step===step);
 if(req.method==='GET')return json(res,200,current??null);
 if(req.method==='PUT'||req.method==='POST'||req.method==='PATCH'){
  const body=await readBody(req);const patch={data:body.data??{},completed:body.completed===true};
  const row=current?await db.gUpdate('onboarding_progress',current.id,patch):await db.gInsert('onboarding_progress',{...patch,profile_id:profileId,step});
  return json(res,200,row);
 }
 return methodNotAllowed(res);
}
