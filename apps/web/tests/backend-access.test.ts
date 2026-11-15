import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../api/_lib/db',()=>({getUserFromRequest:vi.fn(),db:{getProfile:vi.fn(),getDeck:vi.fn(),listFlashcards:vi.fn(),gGet:vi.fn(),getConversationMessages:vi.fn(),createSession:vi.fn(),gQuery:vi.fn(),gInsert:vi.fn(),gUpdate:vi.fn()}}));
import { db, getUserFromRequest } from '../api/_lib/db';
import deck from '../api/profiles/[id]/flashcards/[fid]/index';
import review from '../api/profiles/[id]/flashcards/review';
import conversation from '../api/profiles/[id]/lia/conversations/[cid]/index';
import sessions from '../api/profiles/[id]/sessions/index';

const res=()=>({statusCode:200,body:undefined as any,status(code:number){this.statusCode=code;return this;},json(value:unknown){this.body=value;return this;}} as any);
const req=(path:string,method='GET',body?:unknown)=>({url:path,method,body,headers:{},query:{id:'profile-a',fid:'deck-a',cid:'conversation-b'}} as any);
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getUserFromRequest).mockResolvedValue({id:'user-a',email:'coelhobenicio19@gmail.com'});vi.mocked(db.getProfile).mockResolvedValue({id:'profile-a',user_id:'user-a'} as any);});
describe('isolamento das contas privadas',()=>{
  it('não permite abrir uma coleção de um perfil de outro usuário',async()=>{
    vi.mocked(db.getProfile).mockResolvedValue({id:'profile-a',user_id:'user-b'} as any);vi.mocked(db.getDeck).mockResolvedValue({id:'deck-a',profile_id:'profile-a'} as any);
    const response=res();await deck(req('/api/profiles/profile-a/flashcards/deck-a'),response);
    expect(response.statusCode).toBe(403);
  });
  it('não permite ler uma conversa de outro perfil pela URL do próprio perfil',async()=>{
    vi.mocked(db.gGet).mockResolvedValue({id:'conversation-b',profile_id:'profile-b'} as any);
    const response=res();await conversation(req('/api/profiles/profile-a/lia/conversations/conversation-b'),response);
    expect(response.statusCode).toBe(404);expect(db.getConversationMessages).not.toHaveBeenCalled();
  });
  it('não envia à RPC um flashcard de outro perfil',async()=>{
    vi.mocked(db.gGet).mockResolvedValue({id:'card-b',profile_id:'profile-b'} as any);const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    const response=res();await review(req('/api/profiles/profile-a/flashcards/review','POST',{card_id:'card-b',rating:3}),response);
    expect(response.statusCode).toBe(404);expect(fetcher).not.toHaveBeenCalled();vi.unstubAllGlobals();
  });
  it('converte a duração em minutos da interface para interval do PostgreSQL',async()=>{
    vi.mocked(db.createSession).mockResolvedValue({id:'s1'} as any);
    const response=res();await sessions(req('/api/profiles/profile-a/sessions','POST',{type:'learn',planned_duration:25}),response);
    expect(response.statusCode).toBe(201);expect(db.createSession).toHaveBeenCalledWith(expect.objectContaining({planned_duration:'25 minutes'}));
  });
});
