// Real PocketBase reference-engine test. Never connects to Skip or patient data.
// Run: CER_POCKETBASE_BINARY=/absolute/path/pocketbase node scripts/verify-identity-access.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import assert from 'node:assert/strict'
import net from 'node:net'

const binary = process.env.CER_POCKETBASE_BINARY
if (!binary || !path.isAbsolute(binary)) throw new Error('Provide an absolute path to an official PocketBase binary.')
const version = spawnSync(binary, ['--version'], { encoding: 'utf8' })
if (version.status !== 0 || !version.stdout.includes('0.26.1')) throw new Error('This reference bench requires PocketBase 0.26.1; it does not identify the Skip runtime.')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cer-identity-reference-'))
const migrations = path.join(root, 'migrations')
const hooks = path.join(root, 'hooks')
const data = path.join(root, 'data')
fs.mkdirSync(migrations); fs.mkdirSync(hooks)
const password = randomBytes(24).toString('hex')
const adminEmail = 'bench-admin@example.invalid'
const results = []
const processes = []
const logHandles = []
const seed = `migrate((app) => {
  const persons = new Collection({ name:'persons', type:'base', fields:[{name:'name',type:'text'},{name:'email',type:'email'}] }); app.save(persons);
  let users; try { users=app.findCollectionByNameOrId('users') } catch { users=new Collection({name:'users',type:'auth'}) }
  users.fields.add(new RelationField({name:'person_id',collectionId:persons.id,maxSelect:1}));
  users.fields.add(new SelectField({name:'status',values:['active','invited','suspended','disabled'],maxSelect:1,required:true}));
  users.listRule='id = @request.auth.id'; users.viewRule=users.listRule; users.updateRule=null; users.deleteRule=null; app.save(users);
  const roles = new Collection({name:'user_roles',type:'base',fields:[{name:'user_id',type:'relation',collectionId:users.id,maxSelect:1},{name:'role',type:'select',values:['profissional','admin','interagente'],maxSelect:1},{name:'is_active',type:'bool'}]}); app.save(roles);
  const enrollments = new Collection({name:'enrollments',type:'base',fields:[{name:'person_id',type:'relation',collectionId:persons.id,maxSelect:1}]}); app.save(enrollments);
  const access = new Collection({name:'professional_enrollment_access',type:'base',fields:[{name:'enrollment_id',type:'relation',collectionId:enrollments.id,maxSelect:1},{name:'professional_user_id',type:'relation',collectionId:users.id,maxSelect:1},{name:'is_active',type:'bool'}]}); app.save(access);
  const people={}; const accounts={};
  for (const name of ['a','b','p','q','s']) {
    const person=new Record(persons); person.set('name',name); person.set('email',name+'@example.invalid'); app.save(person); people[name]=person;
    const user=new Record(users); user.set('email',name+'@example.invalid'); user.setPassword(${JSON.stringify(password)}); user.set('status',name==='s'?'suspended':'active'); user.set('person_id',person.id); app.save(user); accounts[name]=user;
    const role=new Record(roles); role.set('user_id',user.id); role.set('role',['p','q','s'].includes(name)?'profissional':'interagente'); role.set('is_active',true); app.save(role);
  }
  for(const pair of [['a','p'],['b','q'],['b','s']]) {
    const enrollment=new Record(enrollments); enrollment.set('person_id',people[pair[0]].id); app.save(enrollment);
    const link=new Record(access); link.set('enrollment_id',enrollment.id); link.set('professional_user_id',accounts[pair[1]].id); link.set('is_active',true); app.save(link);
  }
},()=>{})`
fs.writeFileSync(path.join(migrations, '0001_fixture.js'), seed, { mode: 0o600 })
fs.copyFileSync('pocketbase/migrations/0074_harden_identity_access.js', path.join(migrations, '0002_hardening.js'))

async function start(dir, port) {
  // Refuse an occupied port rather than accidentally testing another local service.
  await new Promise((resolve,reject)=>{
    const probe=net.createServer()
    probe.once('error',reject)
    probe.listen(port,'127.0.0.1',()=>probe.close(resolve))
  })
  const fd = fs.openSync(path.join(root, `server-${port}.log`), 'a', 0o600); logHandles.push(fd)
  const proc = spawn(binary, ['serve', `--dir=${dir}`, `--migrationsDir=${migrations}`, `--hooksDir=${hooks}`, `--http=127.0.0.1:${port}`], { stdio: ['ignore',fd,fd] }); processes.push(proc)
  const base = `http://127.0.0.1:${port}`
  for(let i=0;i<100;i++) {
    if(proc.exitCode !== null) throw new Error('Reference server failed during startup')
    try { if((await fetch(`${base}/api/health`)).ok) return { base, proc } } catch {}
    await new Promise(resolve=>setTimeout(resolve,100))
  }
  throw new Error('Local health check timed out')
}
async function request(base, endpoint, { token, method='GET', body }={}) {
  assert.match(base,/^http:\/\/127\.0\.0\.1:(18090|18091)$/)
  const response=await fetch(base+endpoint,{method,headers:{...(token?{Authorization:token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined})
  let value; try {value=await response.json()} catch {value={}}
  return {status:response.status,value}
}
async function login(base, name, collection='users') {
  const response=await request(base,`/api/collections/${collection}/auth-with-password`,{method:'POST',body:{identity:name,password}})
  assert.equal(response.status,200,`Login fixture ${name}`)
  return response.value
}
async function check(name, fn) {await fn(); results.push({name,status:'PASS'}); console.log(`PASS ${name}`)}
try {
  const setup=spawnSync(binary,['superuser','upsert',adminEmail,password,`--dir=${data}`,`--migrationsDir=${migrations}`,`--hooksDir=${hooks}`],{encoding:'utf8'})
  if(setup.status!==0) throw new Error('Fictional fixture setup failed before any access test')
  const first=await start(data,18090)
  const admin=await login(first.base,adminEmail,'_superusers')
  const people=(await request(first.base,'/api/collections/persons/records?perPage=100',{token:admin.token})).value.items
  const person=(name)=>people.find(p=>p.name===name)
  const actors={}
  for(const name of ['a','b','p','q','s']) actors[name]=await login(first.base,`${name}@example.invalid`)
  const list=async(actor)=> (await request(first.base,'/api/collections/persons/records?perPage=100',{token:actors[actor].token})).value.items.map(p=>p.name).sort()
  await check('Anonymous cannot list persons',async()=>{
    const response=await request(first.base,'/api/collections/persons/records')
    assert.equal(response.status,200)
    assert.deepEqual(response.value.items,[])
  })
  await check('Patient A sees only A',async()=>assert.deepEqual(await list('a'),['a']))
  await check('Patient A cannot read or update B',async()=>{
    assert.equal((await request(first.base,`/api/collections/persons/records/${person('b').id}`,{token:actors.a.token})).status,404)
    assert.equal((await request(first.base,`/api/collections/persons/records/${person('b').id}`,{token:actors.a.token,method:'PATCH',body:{name:'intrusion'}})).status,404)
  })
  await check('Professional P sees P and linked A, not Q-linked B',async()=>assert.deepEqual(await list('p'),['a','p']))
  await check('Professional Q sees Q and linked B, not P-linked A',async()=>assert.deepEqual(await list('q'),['b','q']))
  await check('Suspended account has no person access',async()=>assert.deepEqual(await list('s'),[]))
  await check('Own person name can be corrected; email change is denied',async()=>{
    assert.equal((await request(first.base,`/api/collections/persons/records/${person('a').id}`,{token:actors.a.token,method:'PATCH',body:{name:'a'}})).status,200)
    assert.equal((await request(first.base,`/api/collections/persons/records/${person('a').id}`,{token:actors.a.token,method:'PATCH',body:{email:'change@example.invalid'}})).status,404)
  })
  const newUser={email:'new@example.invalid',password,passwordConfirm:password,status:'active',person_id:person('a').id}
  await check('Anonymous and patient cannot create accounts',async()=>{
    assert.notEqual((await request(first.base,'/api/collections/users/records',{method:'POST',body:newUser})).status,200)
    assert.notEqual((await request(first.base,'/api/collections/users/records',{token:actors.a.token,method:'POST',body:newUser})).status,200)
  })
  await check('Professional cannot create an already-active account',async()=>assert.notEqual((await request(first.base,'/api/collections/users/records',{token:actors.p.token,method:'POST',body:newUser})).status,200))
  await check('Professional cannot invite a second account bound to patient A',async()=>assert.notEqual((await request(first.base,'/api/collections/users/records',{token:actors.p.token,method:'POST',body:{...newUser,status:'invited'}})).status,200))
  await check('Professional can create an invitation for a new unclaimed person',async()=>{
    const target=await request(first.base,'/api/collections/persons/records',{token:actors.p.token,method:'POST',body:{name:'invited'}})
    assert.equal(target.status,200)
    const invited=await request(first.base,'/api/collections/users/records',{token:actors.p.token,method:'POST',body:{...newUser,status:'invited',person_id:target.value.id}})
    assert.equal(invited.status,200)
  })
  const links=(await request(first.base,'/api/collections/professional_enrollment_access/records?perPage=100',{token:admin.token})).value.items
  const link=links.find(l=>l.professional_user_id===actors.p.record.id)
  await check('Revocation blocks access even with the existing token',async()=>{
    assert.equal((await request(first.base,`/api/collections/professional_enrollment_access/records/${link.id}`,{token:admin.token,method:'PATCH',body:{is_active:false}})).status,200)
    assert.deepEqual(await list('p'),['p'])
  })
  await check('Suspension blocks access even with a previously active token',async()=>{
    assert.equal((await request(first.base,`/api/collections/users/records/${actors.p.record.id}`,{token:admin.token,method:'PATCH',body:{status:'suspended'}})).status,200)
    assert.deepEqual(await list('p'),[])
    assert.equal((await request(first.base,`/api/collections/users/records/${actors.p.record.id}`,{token:admin.token,method:'PATCH',body:{status:'active'}})).status,200)
  })
  await check('Create a real local backup',async()=>assert.equal((await request(first.base,'/api/backups',{token:admin.token,method:'POST',body:{name:'cer-fixture.zip'}})).status,204))
  const archive=path.join(data,'backups','cer-fixture.zip')
  for(let i=0;i<100 && !fs.existsSync(archive);i++) await new Promise(resolve=>setTimeout(resolve,100))
  assert.ok(fs.existsSync(archive),'Backup archive completed')
  const restoredData=path.join(root,'restored'); fs.mkdirSync(restoredData)
  const extraction=spawnSync('unzip',['-q',archive,'-d',restoredData],{encoding:'utf8'})
  assert.equal(extraction.status,0,'Extract only the locally generated fictional-data backup')
  const restored=await start(restoredData,18091)
  await check('Independent restored instance preserves authentication and revoked scope',async()=>{
    const p=await login(restored.base,'p@example.invalid')
    const items=(await request(restored.base,'/api/collections/persons/records',{token:p.token})).value.items
    assert.deepEqual(items.map(i=>i.name),['p'])
    const a=await login(restored.base,'a@example.invalid')
    assert.equal((await request(restored.base,`/api/collections/persons/records/${person('b').id}`,{token:a.token})).status,404)
  })
  const report={engine:'PocketBase 0.26.1 reference only',scope:'Minimal identity schema + migration 0074, fictional data; NOT Skip verification or full app migration',scenarios:results,allPassed:true}
  console.log(JSON.stringify(report,null,2))
} finally {
  for(const proc of processes) {if(proc.exitCode===null) {proc.kill('SIGTERM'); await new Promise(resolve=>proc.once('exit',resolve))}}
  for(const fd of logHandles) fs.closeSync(fd)
  // Entire directory is generated by this script, with no patient files.
  fs.rmSync(root,{recursive:true,force:true})
}
