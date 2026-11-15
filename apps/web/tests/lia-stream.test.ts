import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConversation, liaChat } from '../src/services/api';
afterEach(() => vi.unstubAllGlobals());
const respond=(chunks:string[])=>new Response(new ReadableStream({start(controller){chunks.forEach((chunk)=>controller.enqueue(new TextEncoder().encode(chunk)));controller.close();}}),{status:200,headers:{'Content-Type':'text/event-stream'}});
describe('contrato da conversa LIA',()=>{
  it('reúne eventos divididos entre pacotes sem perder tokens',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>respond(['data: {"conversation_id":"c1"}\n\ndata: {"to','ken":"Olá "}\n\ndata: {"token":"mundo"}\n\ndata: [DONE]\n\n'])));
    const tokens:string[]=[];
    const result=await liaChat('p1',null,'Olá',(token)=>tokens.push(token));
    expect(result).toEqual({conversation_id:'c1',full_text:'Olá mundo'});
    expect(tokens.join('')).toBe('Olá mundo');
  });
  it('apresenta a falha do provedor recebida dentro do stream em HTTP 200',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>respond(['data: {"error":"NVIDIA 429"}\n\ndata: [DONE]\n\n'])));
    await expect(liaChat('p1',null,'Olá',()=>{})).rejects.toThrow('NVIDIA 429');
  });
  it('não transforma um stream sem resposta em sucesso',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>respond(['data: {"conversation_id":"c1"}\n\ndata: [DONE]\n\n'])));
    await expect(liaChat('p1',null,'Olá',()=>{})).rejects.toThrow();
  });
  it('abre as mensagens no endpoint implementado pelo backend',async()=>{
    const fetcher=vi.fn(async()=>new Response('[]',{status:200}));vi.stubGlobal('fetch',fetcher);
    await expect(getConversation('p1','c1')).resolves.toEqual([]);
    expect(fetcher.mock.calls[0][0]).toBe('/api/profiles/p1/lia/conversations/c1');
  });
});
