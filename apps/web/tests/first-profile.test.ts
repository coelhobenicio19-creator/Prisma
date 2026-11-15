import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../api/_lib/db',()=>({getUserFromRequest:vi.fn(),db:{getProfile:vi.fn(),getProfileSettings:vi.fn(),upsertProfileSettings:vi.fn(),gGet:vi.fn(async()=>null),gQuery:vi.fn(),gInsert:vi.fn(),gUpdate:vi.fn()}}));
import {db,getUserFromRequest} from '../api/_lib/db';
import onboarding from '../api/profiles/[id]/onboarding/[step]';
const response=()=>({statusCode:200,body:undefined as any,status(code:number){this.statusCode=code;return this;},json(value:unknown){this.body=value;return this;}} as any);
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getUserFromRequest).mockResolvedValue({id:'u1',email:'coelhobenicio19@gmail.com'});vi.mocked(db.getProfile).mockResolvedValue({id:'p1',user_id:'u1'} as any);});
it('salva a etapa textual do onboarding sem usá-la como UUID',async()=>{
 vi.mocked(db.gQuery).mockResolvedValue([]);vi.mocked(db.gInsert).mockResolvedValue({id:'step-id',step:'welcome'});
 const res=response();await onboarding({url:'/api/profiles/p1/onboarding/welcome',method:'PUT',headers:{},query:{id:'p1',step:'welcome'},body:{data:{ready:true},completed:true}} as any,res);
 expect(res.statusCode).toBe(200);expect(db.gInsert).toHaveBeenCalledWith('onboarding_progress',expect.objectContaining({profile_id:'p1',step:'welcome',completed:true}));
});
it('oferece a rota de preferências usada na criação do primeiro perfil',async()=>{
 const {default:settings}=await import('../api/profiles/[id]/settings');vi.mocked(db.upsertProfileSettings).mockResolvedValue({profile_id:'p1',theme:'dark'});
 const res=response();await settings({url:'/api/profiles/p1/settings',method:'PUT',headers:{},query:{id:'p1'},body:{theme:'dark',profile_id:'p2',id:'malicious'}} as any,res);
 expect(res.statusCode).toBe(200);expect(db.upsertProfileSettings).toHaveBeenCalledWith('p1',{theme:'dark'});
});
