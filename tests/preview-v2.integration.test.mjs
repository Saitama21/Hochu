import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

async function freePort(){
  const server=net.createServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const port=server.address().port;
  server.close();
  await once(server,'close');
  return port;
}
async function waitReady(base,child){
  for(let i=0;i<70;i++){
    if(child.exitCode!==null)throw Error('Preview child exited early: '+child.exitCode);
    try{
      const resp=await fetch(base+'/api/health');
      if(resp.ok)return resp.json();
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,130));
  }
  throw Error('Preview server did not become ready');
}

test('preview demo is isolated, authenticated and editable', {timeout:20000}, async()=>{
  const port=await freePort();
  const base='http://127.0.0.1:'+port;
  const password='local-preview-smoke-test-only';
  const child=spawn(process.execPath,['server.js'],{
    cwd:new URL('../',import.meta.url).pathname,
    env:{...process.env, PORT:String(port),DATABASE_URL:'',ADMIN_USERNAME:'preview',ADMIN_NAME:'Preview Test',
      ADMIN_EMAIL:'preview@example.test',ADMIN_PASSWORD:password,PREVIEW_DEMO_ITEMS:'1',HOCHU_TEST:'0'},
    stdio:'ignore'
  });
  try{
    const health=await waitReady(base,child);
    assert.equal(health.database,'memory');
    assert.equal(health.previewDemo,true);
    assert.equal(health.app,'Список желаний');
    assert.equal(health.version,'2.0.0');
    const login=await fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:'preview',password})});
    assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie,'Session cookie must be created');
    const auth={cookie};
    const itemsResponse=await fetch(base+'/api/items',{headers:auth});
    assert.equal(itemsResponse.status,200);
    const items=await itemsResponse.json();
    assert.equal(items.length,6);
    assert.ok(items.every(item=>item.note.includes('Демонстрационный товар')));
    assert.ok(items.every(item=>item.image.includes('fm=webp')));
    const item=items[0];
    const modified={...item,saved:item.saved+500};
    const updated=await fetch(base+'/api/items/'+item.id,{
      method:'PUT',headers:{...auth,'content-type':'application/json'},body:JSON.stringify(modified)
    });
    assert.equal(updated.status,200);
    const itemAfter=await updated.json();
    assert.equal(itemAfter.saved,modified.saved);
  }finally{
    child.kill('SIGTERM');
    await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,1000))]);
  }
});

test('preview demos are not enabled merely by turning on a flag in a non-preview account', async()=>{
  const fs=await import('node:fs');
  const text=fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
  assert.match(text,/PREVIEW_DEMO_ITEMS === '1' && !DATABASE_URL/);
  assert.match(text,/ADMIN_USERNAME === 'preview'/);
  assert.match(text,/if \(PREVIEW_DEMO\) seedPreviewWishlist\(id\)/);
});
