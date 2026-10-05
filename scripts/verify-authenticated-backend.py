"""Authenticated REST checks on the complete reference schema and hooks.
Only generated fixtures, loopback, PocketBase 0.26.1; never contacts Skip.
Run: CER_POCKETBASE_BINARY=/absolute/path/pocketbase python scripts/verify-authenticated-backend.py
"""
import json, os, pathlib, re, secrets, shutil, socket, subprocess, tempfile, time
import urllib.request, urllib.error

binary = os.environ.get('CER_POCKETBASE_BINARY', '')
assert pathlib.Path(binary).is_absolute(), 'Provide an absolute binary path'
assert subprocess.check_output([binary, '--version'], text=True).strip() == 'pocketbase version 0.26.1'
root = pathlib.Path(tempfile.mkdtemp(prefix='cer-authenticated-reference-'))
password = secrets.token_hex(24)
proc = None
results = []
try:
    migrations, hooks, data = [root / p for p in ['migrations', 'hooks', 'data']]
    migrations.mkdir(); hooks.mkdir()
    for src in sorted(pathlib.Path('pocketbase/migrations').glob('*.js')):
        shutil.copy(src, migrations / src.name)
    fixture = '''migrate((app)=>{
      const save=(col, values)=>{const r=new Record(app.findCollectionByNameOrId(col));for(const k in values)r.set(k,values[k]);app.save(r);return r;};
      const people={}, users={};
      for(const name of ['a','b','p','q']){
        people[name]=save('persons',{full_name:'Reference '+name,email:name+'@example.invalid'});
        const u=new Record(app.findCollectionByNameOrId('users'));
        u.set('email',name+'@example.invalid');u.setPassword(PASSWORD);u.set('person_id',people[name].id);u.set('status','active');app.save(u);users[name]=u;
        save('user_roles',{user_id:u.id,role:['p','q'].includes(name)?'profissional':'interagente',is_active:true});
      }
      for(const pair of [['a','p'],['b','q']]){
        const e=save('enrollments',{interagente:users[pair[0]].id,profissional:users[pair[1]].id,person_id:people[pair[0]].id,product:'Reference only',status:'active'});
        save('professional_enrollment_access',{enrollment_id:e.id,professional_user_id:users[pair[1]].id,access_role:'primary',is_active:true});
      }
    },()=>{});'''.replace('PASSWORD', json.dumps(password))
    (migrations / '9999_reference_fixtures.js').write_text(fixture)
    applied = subprocess.run([binary, 'migrate', 'up', '--dir='+str(data), '--migrationsDir='+str(migrations), '--hooksDir='+str(hooks)], capture_output=True, text=True)
    assert applied.returncode == 0 and 'Error: Failed' not in applied.stdout+applied.stderr and len(re.findall(r'^Applied ',applied.stdout,re.MULTILINE))==len(list(migrations.glob('*.js'))), 'Migration fixtures failed: '+(applied.stdout+applied.stderr)[-500:]
    setup = subprocess.run([binary, 'superuser', 'upsert', 'admin@example.invalid', password,
        '--dir='+str(data), '--migrationsDir='+str(migrations), '--hooksDir='+str(hooks)], capture_output=True, text=True)
    assert setup.returncode == 0, 'Fixture reconstruction failed: '+setup.stdout+setup.stderr
    for src in pathlib.Path('pocketbase/hooks').glob('*.js'):
        shutil.copy(src, hooks / (src.stem + '.pb.js'))
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
    base='http://127.0.0.1:'+str(port)
    def request(endpoint, token='', method='GET', body=None):
        assert base.startswith('http://127.0.0.1:')
        req=urllib.request.Request(base+endpoint, data=json.dumps(body).encode() if body is not None else None,
            headers={'Content-Type':'application/json', **({'Authorization':token} if token else {})}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=8) as res:
                raw=res.read(); return res.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read())
    def ok(endpoint, token='', method='GET', body=None):
        status,value=request(endpoint,token,method,body)
        assert status in (200,204), str((endpoint,status,value))
        return value
    def record(col, token='', method='GET', body=None, id=''):
        return ok('/api/collections/'+col+'/records'+('/'+id if id else ''),token,method,body)
    def check(name, fn):
        fn();results.append({'name':name,'status':'PASS'}); print('PASS '+name,flush=True)
    def require(condition):
        assert condition, 'Expected isolation or lifecycle invariant'
    with (root/'server.log').open('w') as log:
        proc=subprocess.Popen([binary,'serve','--dir='+str(data),'--migrationsDir='+str(migrations),
            '--hooksDir='+str(hooks),'--http=127.0.0.1:'+str(port)], stdout=log,stderr=log)
        for _ in range(100):
            assert proc.poll() is None, 'Reference server exited; no live service contacted'
            try:
                if request('/api/health')[0]==200:break
            except urllib.error.URLError: time.sleep(.1)
        else: raise RuntimeError('Health timeout')
        admin=ok('/api/collections/_superusers/auth-with-password',method='POST',body={'identity':'admin@example.invalid','password':password})['token']
        actors={n:ok('/api/collections/users/auth-with-password',method='POST',body={'identity':n+'@example.invalid','password':password}) for n in ['a','b','p','q']}
        tokens={n:v['token'] for n,v in actors.items()}
        enrollments=record('enrollments',admin)['items']
        enroll={n:next(e for e in enrollments if e['person_id']==actors[n]['record']['person_id'])['id'] for n in ['a','b']}
        journal=record('cer_journal_entries',tokens['a'],'POST',{'enrollment_id':enroll['a'],'participant_user_id':actors['a']['record']['id'],'content':'FICTIONAL_PRIVATE_MARKER','status':'active','access_class':'participant_private','version_number':1})
        check('Journal persists and is forced private',lambda:require(record('cer_journal_entries',tokens['a'],id=journal['id'])['access_class']=='participant_private'))
        for n in ['b','p','q']:
            check('Journal denied to '+n,lambda n=n:require(request('/api/collections/cer_journal_entries/records/'+journal['id'],tokens[n])[0]==404))
        updated=record('cer_journal_entries',tokens['a'],'PATCH',{'content':'FICTIONAL_UPDATED_MARKER','access_class':'shared_care'},journal['id'])
        versions=record('cer_journal_entry_versions',tokens['a'])['items']
        check('Edit preserves private previous version',lambda:require(updated['version_number']==2 and any(v['content']=='FICTIONAL_PRIVATE_MARKER' for v in versions)))
        check('Professional cannot list private history',lambda:require(record('cer_journal_entry_versions',tokens['p'])['items']==[]))
        check('Journal cannot bind to another enrollment',lambda:require(request('/api/collections/cer_journal_entries/records',tokens['a'],'POST',{'enrollment_id':enroll['b'],'participant_user_id':actors['a']['record']['id'],'content':'fiction','status':'active','access_class':'participant_private','version_number':1})[0]==400))
        message=record('cer_next_session_messages',tokens['a'],'POST',{'enrollment_id':enroll['a'],'participant_user_id':actors['a']['record']['id'],'message_text':'Fictional shared summary','summary_text':'Fictional shared summary','status':'draft','access_class':'participant_private'})
        endpoint='/api/collections/cer_next_session_messages/records/'+message['id']
        check('Draft invisible to linked professional',lambda:require(request(endpoint,tokens['p'])[0]==404))
        approved=record('cer_next_session_messages',tokens['a'],'PATCH',{'status':'approved'},message['id'])
        check('Approval shares and stamps message',lambda:require(approved['approved_at'] and record('cer_next_session_messages',tokens['p'],id=message['id'])['access_class']=='shared_care'))
        check('Unlinked professional cannot read approved message',lambda:require(request(endpoint,tokens['q'])[0]==404))
        record('cer_next_session_messages',tokens['a'],'PATCH',{'status':'withdrawn'},message['id'])
        check('Withdrawal blocks previously issued professional token',lambda:require(request(endpoint,tokens['p'])[0]==404))
        check('Withdrawn message cannot be reapproved',lambda:require(request(endpoint,tokens['a'],'PATCH',{'status':'approved'})[0]==400))
        session=record('cer_sessions',tokens['p'],'POST',{'enrollment_id':enroll['a'],'professional_user_id':actors['p']['record']['id'],'status':'scheduled'})
        check('Session persisted for authorized professional',lambda:require(record('cer_sessions',tokens['p'],id=session['id'])['status']=='scheduled'))
        check('Participant cannot read professional session',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],tokens['a'])[0]==404))
        note=record('cer_session_notes',tokens['p'],'POST',{'session_id':session['id'],'enrollment_id':enroll['a'],'author_user_id':actors['p']['record']['id'],'text':'FICTIONAL_SESSION_MARKER'})
        check('Session note persists',lambda:require(record('cer_session_notes',tokens['p'],id=note['id'])['text']=='FICTIONAL_SESSION_MARKER'))
        record('cer_sessions',tokens['p'],'PATCH',{'status':'in_progress'},session['id'])
        completed=record('cer_sessions',tokens['p'],'PATCH',{'status':'completed'},session['id'])
        check('Session completion stamps time',lambda:require(bool(completed['completed_at'])))
        check('Completed session note is immutable',lambda:require(request('/api/collections/cer_session_notes/records/'+note['id'],tokens['p'],'PATCH',{'text':'changed'})[0]==400))
        audit=ok('/api/collections/audit_events/records?perPage=500',admin)['items']
        check('Audit events produced without private content',lambda:require({'JOURNAL_ENTRY_CREATED','SESSION_NOTE_CREATED','SESSION_COMPLETED','NEXT_SESSION_MESSAGE_WITHDRAWN'}.issubset({e['action'] for e in audit}) and not any(marker in json.dumps(audit) for marker in ['FICTIONAL_PRIVATE_MARKER','FICTIONAL_UPDATED_MARKER','FICTIONAL_SESSION_MARKER'])))
        links=record('professional_enrollment_access',admin)['items']
        link=next(v for v in links if v['enrollment_id']==enroll['a'] and v['professional_user_id']==actors['p']['record']['id'])
        record('professional_enrollment_access',admin,'PATCH',{'is_active':False},link['id'])
        check('Revocation persists',lambda:require(record('professional_enrollment_access',admin,id=link['id'])['is_active'] is False))
        check('Revocation blocks session and note with existing token',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],tokens['p'])[0]==404 and request('/api/collections/cer_session_notes/records/'+note['id'],tokens['p'])[0]==404))
        check('Create complete fictional backend backup',lambda:require(request('/api/backups',admin,'POST',{'name':'reference.zip'})[0]==204))
        import zipfile
        archive=data/'backups'/'reference.zip'
        for _ in range(100):
            try:
                with zipfile.ZipFile(archive) as z:
                    if z.testzip() is None: break
            except (FileNotFoundError,zipfile.BadZipFile):pass
            time.sleep(.1)
        else:raise RuntimeError('Backup did not finish')
        proc.terminate();proc.wait(timeout=5)
        restored=root/'restored';restored.mkdir()
        with zipfile.ZipFile(archive) as z:
            for name in z.namelist():
                assert (restored/name).resolve().is_relative_to(restored.resolve()), 'Unsafe backup path'
            z.extractall(restored)
        with (root/'restore.log').open('w') as restore_log:
            proc=subprocess.Popen([binary,'serve','--dir='+str(restored),'--migrationsDir='+str(migrations),
                '--hooksDir='+str(hooks),'--http=127.0.0.1:'+str(port)],stdout=restore_log,stderr=restore_log)
            for _ in range(100):
                assert proc.poll() is None, 'Restored server exited'
                try:
                    if request('/api/health')[0]==200:break
                except urllib.error.URLError:time.sleep(.1)
            else:raise RuntimeError('Restore health timeout')
            restored_a=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'a@example.invalid','password':password})['token']
            restored_p=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'p@example.invalid','password':password})['token']
            check('Restored login and journal content preserved',lambda:require(record('cer_journal_entries',restored_a,id=journal['id'])['content']=='FICTIONAL_UPDATED_MARKER'))
            check('Restored history preserved',lambda:require(any(v['content']=='FICTIONAL_PRIVATE_MARKER' for v in record('cer_journal_entry_versions',restored_a)['items'])))
            check('Restored revoked scope and withdrawal preserved',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],restored_p)[0]==404 and request(endpoint,restored_p)[0]==404))
            proc.terminate();proc.wait(timeout=5)
    errors=re.findall(r'^.*(?:ReferenceError|SyntaxError|TypeError).*$',(root/'server.log').read_text()+(root/'restore.log').read_text(),re.MULTILINE)
    assert not errors, 'Runtime hook errors: '+str(errors)
    print(json.dumps({'engine':'PocketBase 0.26.1 reference only','scope':'Complete repository migrations/hooks, generated fictional fixtures; NOT live Skip homologation','scenarios':results,'allPassed':True},indent=2))
finally:
    if proc is not None and proc.poll() is None:proc.terminate();proc.wait(timeout=5)
    shutil.rmtree(root)
