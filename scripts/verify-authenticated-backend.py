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
      const practice=save('cer_practices',{internal_name:'Reference resource',participant_facing_name_base:'Reference resource',family:'reference',governance_modes:['self_guided'],status:'draft',created_by_user_id:users.p.id,item_nature:'support_resource'});
      const version=save('cer_practice_versions',{practice_id:practice.id,version_number:1,participant_title:'Reference resource',intensity:'low',consent_required:'not_required',author_user_id:users.p.id,status:'draft'});
      save('cer_practice_version_assets',{practice_version_id:version.id,asset_type:'document',title:'Reference protected file'});
      for(const pair of [['a','p'],['b','q']]){
        const e=save('enrollments',{interagente:users[pair[0]].id,profissional:users[pair[1]].id,person_id:people[pair[0]].id,product:'Reference only',status:'active'});
        save('professional_enrollment_access',{enrollment_id:e.id,professional_user_id:users[pair[1]].id,access_role:'primary',is_active:true});
        if(pair[0]==='a'){
          save('professional_enrollment_access',{enrollment_id:e.id,professional_user_id:users.q.id,access_role:'collaborator',is_active:false});
          for(const code of ['corpo_fisiologia_ayurveda','mente_emocoes_cer','regulacao_respostas_cer','relacoes_cer','sexualidade_cer','sentido_conexao_cer']){
            let experience;
            try{experience=app.findFirstRecordByData('cer_experiences','code',code)}catch(_){
              const dim=app.findFirstRecordByData('cer_dimensions','code','corpo_fisiologia');
              experience=save('cer_experiences',{dimension_id:dim.id,code,title:code,order_index:1,version:1});
            }
            save('enrollment_experiences',{enrollment_id:e.id,experience_id:experience.id,release_status:'completed',progress_status:'completed'});
          }
        }
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
    # Fault injection only in the disposable bench, to prove the complete transaction rolls back.
    (hooks/'999_reference_rollback.pb.js').write_text('''onRecordCreate((e)=>{
      const enrollment=e.app.findRecordById('enrollments',e.record.getString('enrollment_id'));
      const person=e.app.findRecordById('persons',enrollment.getString('person_id'));
      if(person.getString('email')==='rollback@example.invalid')throw new BadRequestError('Reference rollback probe');
      e.next();
    },'journey_states');''')
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
        try:
            fn();results.append({'name':name,'status':'PASS'});print('PASS '+name,flush=True)
        except AssertionError as err:
            results.append({'name':name,'status':'FAIL','detail':str(err)});print('FAIL '+name+': '+str(err),flush=True)
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
        invite_endpoint='/backend/v1/cer/invite-participant'
        product=record('cer_products',admin)['items'][0]
        invite_body={'fullName':'Reference invited person','email':'fresh@example.invalid','productId':product['id'],'professionalUserId':actors['p']['record']['id']}
        check('Anonymous and patient cannot invite',lambda:require(request(invite_endpoint,method='POST',body=invite_body)[0] in (401,403) and request(invite_endpoint,tokens['a'],'POST',invite_body)[0]==403))
        check('Invitation cannot name another professional',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'professionalUserId':actors['q']['record']['id']})[0]==403))
        check('Invalid product creates no account',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'productId':'nonexistent0000'})[0]==400))
        check('Invitation rejects malformed email and short credential',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'email':'invalid'})[0]==400 and request(invite_endpoint,tokens['p'],'POST',{**invite_body,'temporaryPassword':'short'})[0]==400))
        counted=['persons','users','enrollments','user_roles','professional_enrollment_access','journey_states']
        before_counts={col:record(col,admin)['totalItems'] for col in counted}
        check('Failure at journey creation rolls back complete invitation',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'email':'rollback@example.invalid'})[0]==400 and before_counts=={col:record(col,admin)['totalItems'] for col in counted}))
        invited_result=ok(invite_endpoint,tokens['p'],'POST',invite_body)
        fresh=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'fresh@example.invalid','password':invited_result['tempPasswordGenerated']})
        fresh_enrollment=invited_result['enrollment']['id']
        check('Invitation creates linked invited account and unverified email',lambda:require(fresh['record']['status']=='invited' and fresh['record']['person_id']==invited_result['person']['id'] and fresh['record']['verified'] is False))
        check('Invitation persists role, professional link and journey',lambda:require(any(v['user_id']==fresh['record']['id'] and v['role']=='interagente' for v in record('user_roles',admin)['items']) and any(v['enrollment_id']==fresh_enrollment and v['professional_user_id']==actors['p']['record']['id'] and v['is_active'] for v in record('professional_enrollment_access',admin)['items']) and any(v['enrollment_id']==fresh_enrollment for v in record('journey_states',admin)['items'])))
        check('Professional can read new scoped person and enrollment',lambda:require(request('/api/collections/persons/records/'+invited_result['person']['id'],tokens['p'])[0]==200 and request('/api/collections/enrollments/records/'+fresh_enrollment,tokens['p'])[0]==200))
        retry=ok(invite_endpoint,tokens['p'],'POST',invite_body)
        check('Retry reuses enrollment without issuing or changing credential',lambda:require(retry['enrollment']['id']==fresh_enrollment and 'tempPasswordGenerated' not in retry and request('/api/collections/users/auth-with-password',method='POST',body={'identity':'fresh@example.invalid','password':invited_result['tempPasswordGenerated']})[0]==200))
        check('Retry preserves account and invitation audit privacy',lambda:require(len([v for v in record('users',admin)['items'] if v['email']=='fresh@example.invalid'])==1 and len([v for v in record('enrollments',admin)['items'] if v['person_id']==invited_result['person']['id']])==1 and invited_result['tempPasswordGenerated'] not in json.dumps(ok('/api/collections/audit_events/records?perPage=500',admin)['items'])))
        orphan=record('persons',admin,'POST',{'full_name':'Reference unclaimed','email':'unclaimed@example.invalid'})
        check('Invitation does not silently claim existing unlinked person',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'email':'unclaimed@example.invalid'})[0]==403))
        check('Other professional cannot claim existing invited person',lambda:require(request(invite_endpoint,tokens['q'],'POST',{**invite_body,'professionalUserId':actors['q']['record']['id']})[0]==403))
        record('users',admin,'PATCH',{'status':'suspended'},actors['p']['record']['id'])
        check('Suspended professional cannot invite with old token',lambda:require(request(invite_endpoint,tokens['p'],'POST',{**invite_body,'email':'suspended-invite@example.invalid'})[0]==403))
        record('users',admin,'PATCH',{'status':'active'},actors['p']['record']['id'])
        check('Client cannot bypass invitation route to create account',lambda:require(request('/api/collections/users/records',tokens['p'],'POST',{'email':'bypass@example.invalid','password':password,'passwordConfirm':password,'status':'invited','person_id':invited_result['person']['id']})[0]==403))
        check('Professional cannot elevate participant role',lambda:require(request('/api/collections/user_roles/records',tokens['p'],'POST',{'user_id':fresh['record']['id'],'role':'admin','is_active':True})[0] in (400,403)))
        ok('/backend/v1/cer/first-login',fresh['token'],'POST',{'newPassword':password,'passwordConfirm':password})
        active_fresh=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'fresh@example.invalid','password':password})
        fresh_role=next(v for v in record('user_roles',admin)['items'] if v['user_id']==fresh['record']['id'] and v['role']=='interagente')
        check('Scoped professional can maintain participant role',lambda:require(request('/api/collections/user_roles/records/'+fresh_role['id'],tokens['p'],'PATCH',{'is_active':True})[0]==200))
        check('Unlinked professional cannot maintain participant role',lambda:require(request('/api/collections/user_roles/records/'+fresh_role['id'],tokens['q'],'PATCH',{'is_active':True})[0] in (403,404)))
        check('Invited participant activates and reads own enrollment',lambda:require(request('/api/collections/enrollments/records/'+fresh_enrollment,active_fresh['token'])[0]==200))
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
        life_body={'enrollment_id':enroll['a'],'title':'Fictional life event','time_kind':'year','time_value':'2000','emotions':['Alegria'],'narrative':'FICTIONAL_LIFE_MARKER','access_class':'participant_private'}
        check('Life event blocked before six dimensions completed',lambda:require(request('/api/collections/cer_life_events/records',tokens['b'],'POST',{**life_body,'enrollment_id':enroll['b']})[0]==400))
        life=record('cer_life_events',tokens['a'],'POST',life_body)
        life_endpoint='/api/collections/cer_life_events/records/'+life['id']
        check('Owner can read own private life event',lambda:require(request(life_endpoint,tokens['a'])[0]==200))
        check('Other patient and linked professional cannot read private life event',lambda:require(request(life_endpoint,tokens['b'])[0]==404 and request(life_endpoint,tokens['p'])[0]==404))
        check('Owner can change life sharing with partial update',lambda:require(request(life_endpoint,tokens['a'],'PATCH',{'access_class':'participant_shared'})[0]==200))
        check('Shared life event visible to active linked professional',lambda:require(request(life_endpoint,tokens['p'])[0]==200))
        check('Inactive link cannot borrow another professionals active link',lambda:require(request(life_endpoint,tokens['q'])[0]==404))
        check('Inactive link cannot read session through another active link',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],tokens['q'])[0]==404))
        multi_links=record('professional_enrollment_access',admin)['items']
        q_link=next(v for v in multi_links if v['enrollment_id']==enroll['a'] and v['professional_user_id']==actors['q']['record']['id'])
        record('professional_enrollment_access',admin,'PATCH',{'is_active':True},q_link['id'])
        check('Two active professionals can read shared life event',lambda:require(request(life_endpoint,tokens['p'])[0]==200 and request(life_endpoint,tokens['q'])[0]==200))
        check('Collaborator cannot read another authors session note',lambda:require(request('/api/collections/cer_session_notes/records/'+note['id'],tokens['q'])[0]==404))
        check('Owner cannot transfer life event to other enrollment',lambda:require(request(life_endpoint,tokens['a'],'PATCH',{'enrollment_id':enroll['b']})[0]==404))
        check('Invalid calendar date refused in life edit',lambda:require(request(life_endpoint,tokens['a'],'PATCH',{'time_kind':'date','time_value':'2000-02-31'})[0]==400))
        check('User cannot self-change status or person association',lambda:require(request('/api/collections/users/records/'+actors['a']['record']['id'],tokens['a'],'PATCH',{'status':'suspended'})[0]==403 and request('/api/collections/users/records/'+actors['a']['record']['id'],tokens['a'],'PATCH',{'person_id':actors['b']['record']['person_id']})[0]==403))
        check('Professional cannot edit life narrative',lambda:require(request(life_endpoint,tokens['p'],'PATCH',{'narrative':'tampered'})[0]==404))
        check('Owner can withdraw life sharing with partial update',lambda:require(request(life_endpoint,tokens['a'],'PATCH',{'access_class':'participant_private'})[0]==200))
        check('Life sharing withdrawal blocks existing token',lambda:require(request(life_endpoint,tokens['p'])[0]==404))
        suspension_message=record('cer_next_session_messages',tokens['a'],'POST',{'enrollment_id':enroll['a'],'participant_user_id':actors['a']['record']['id'],'message_text':'Fictional suspension probe','summary_text':'Fictional suspension probe','status':'approved','access_class':'shared_care'})
        record('users',admin,'PATCH',{'status':'suspended'},actors['a']['record']['id'])
        check('Participant suspension persists with hooks loaded',lambda:require(record('users',admin,id=actors['a']['record']['id'])['status']=='suspended'))
        check('Suspended participant cannot read journal with old token',lambda:require(request('/api/collections/cer_journal_entries/records/'+journal['id'],tokens['a'])[0]==404))
        check('Suspended participant cannot read history with old token',lambda:require(record('cer_journal_entry_versions',tokens['a'])['items']==[]))
        check('Suspended participant cannot read or edit life event',lambda:require(request(life_endpoint,tokens['a'])[0]==404 and request(life_endpoint,tokens['a'],'PATCH',{'title':'changed'})[0]==404))
        check('Suspended participant cannot read or update approved message',lambda:require(request('/api/collections/cer_next_session_messages/records/'+suspension_message['id'],tokens['a'])[0]==404 and request('/api/collections/cer_next_session_messages/records/'+suspension_message['id'],tokens['a'],'PATCH',{'message_text':'changed'})[0]==404))
        check('Suspended participant cannot create life event',lambda:require(request('/api/collections/cer_life_events/records',tokens['a'],'POST',life_body)[0]==400))
        record('users',admin,'PATCH',{'status':'active'},actors['a']['record']['id'])
        record('users',admin,'PATCH',{'status':'suspended'},actors['p']['record']['id'])
        check('Professional suspension persists with hooks loaded',lambda:require(record('users',admin,id=actors['p']['record']['id'])['status']=='suspended'))
        check('Suspended professional cannot read session or note',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],tokens['p'])[0]==404 and request('/api/collections/cer_session_notes/records/'+note['id'],tokens['p'])[0]==404))
        record('cer_life_events',tokens['a'],'PATCH',{'access_class':'participant_shared'},life['id'])
        check('Suspended professional cannot read shared life or approved message',lambda:require(request(life_endpoint,tokens['p'])[0]==404 and request('/api/collections/cer_next_session_messages/records/'+suspension_message['id'],tokens['p'])[0]==404))
        record('cer_life_events',tokens['a'],'PATCH',{'access_class':'participant_private'},life['id'])
        record('users',admin,'PATCH',{'status':'active'},actors['p']['record']['id'])
        links=record('professional_enrollment_access',admin)['items']
        link=next(v for v in links if v['enrollment_id']==enroll['a'] and v['professional_user_id']==actors['p']['record']['id'])
        record('professional_enrollment_access',admin,'PATCH',{'is_active':False},link['id'])
        check('Revocation persists',lambda:require(record('professional_enrollment_access',admin,id=link['id'])['is_active'] is False))
        check('Revocation blocks session and note with existing token',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],tokens['p'])[0]==404 and request('/api/collections/cer_session_notes/records/'+note['id'],tokens['p'])[0]==404))
        record('cer_life_events',tokens['a'],'PATCH',{'access_class':'participant_shared'},life['id'])
        check('Revoked P cannot borrow still-active Q access to shared life',lambda:require(request(life_endpoint,tokens['p'])[0]==404 and request(life_endpoint,tokens['q'])[0]==200))
        check('Revoked P cannot borrow Q access to approved message',lambda:require(request('/api/collections/cer_next_session_messages/records/'+suspension_message['id'],tokens['p'])[0]==404 and request('/api/collections/cer_next_session_messages/records/'+suspension_message['id'],tokens['q'])[0]==200))
        record('cer_life_events',tokens['a'],'PATCH',{'access_class':'participant_private'},life['id'])
        reset_endpoint='/backend/v1/cer/reset-participant-access'
        reset_body={'target_user_id':actors['a']['record']['id']}
        check('Revoked professional cannot reset participant access',lambda:require(request(reset_endpoint,tokens['p'],'POST',reset_body)[0]==403))
        check('Patient and anonymous caller cannot reset participant access',lambda:require(request(reset_endpoint,tokens['b'],'POST',reset_body)[0]==403 and request(reset_endpoint,method='POST',body=reset_body)[0] in (401,403)))
        reset_status,reset_value=request(reset_endpoint,tokens['q'],'POST',reset_body)
        check('Active collaborator can reset access despite earlier revoked link',lambda:require(reset_status==200))
        if reset_status==200:
            credential=reset_value['temporaryCredential']
            invited=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'a@example.invalid','password':credential})
            check('Reset persists invited and invalidates old password',lambda:require(invited['record']['status']=='invited' and request('/api/collections/users/auth-with-password',method='POST',body={'identity':'a@example.invalid','password':password})[0]==400))
            check('Invited account cannot read clinical journal',lambda:require(request('/api/collections/cer_journal_entries/records/'+journal['id'],invited['token'])[0]==404))
            check('First login rejects mismatched confirmation',lambda:require(request('/backend/v1/cer/first-login',invited['token'],'POST',{'newPassword':password,'passwordConfirm':'mismatch'})[0]==400))
            check('First login rejects short password',lambda:require(request('/backend/v1/cer/first-login',invited['token'],'POST',{'newPassword':'short','passwordConfirm':'short'})[0]==400))
            activation=ok('/backend/v1/cer/first-login',invited['token'],'POST',{'newPassword':password,'passwordConfirm':password,'target_user_id':actors['b']['record']['id']})
            activated=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'a@example.invalid','password':password})
            check('First login activates only caller and persists new credential',lambda:require(activation['userId']==actors['a']['record']['id'] and activated['record']['status']=='active' and record('users',admin,id=actors['b']['record']['id'])['status']=='active'))
            tokens['a']=activated['token']
            check('Active account cannot repeat first-login activation',lambda:require(request('/backend/v1/cer/first-login',tokens['a'],'POST',{'newPassword':password,'passwordConfirm':password})[0]==400))
            reset_audit=ok('/api/collections/audit_events/records?perPage=500',admin)['items']
            check('Reset and first-login audit contain no passwords',lambda:require({'ACCESS_RESET_BY_PROFESSIONAL','FIRST_LOGIN_COMPLETED'}.issubset({v['action'] for v in reset_audit}) and credential not in json.dumps(reset_audit) and password not in json.dumps(reset_audit)))
        asset=record('cer_practice_version_assets',admin)['items'][0]
        boundary='cer-fixture-'+secrets.token_hex(8)
        payload=('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="reference.txt"\r\nContent-Type: text/plain\r\n\r\nFICTIONAL_PROTECTED_FILE\r\n--'+boundary+'--\r\n').encode()
        req=urllib.request.Request(base+'/api/collections/cer_practice_version_assets/records/'+asset['id'],data=payload,headers={'Authorization':admin,'Content-Type':'multipart/form-data; boundary='+boundary},method='PATCH')
        with urllib.request.urlopen(req,timeout=8) as response:asset=json.loads(response.read())
        from urllib.parse import urlencode
        def download_asset(file_token=''):
            url=base+'/api/files/'+asset['collectionId']+'/'+asset['id']+'/'+asset['file']+('?' + urlencode({'token':file_token}) if file_token else '')
            try:
                with urllib.request.urlopen(url,timeout=8) as res:return res.status,res.read()
            except urllib.error.HTTPError as err:return err.code,b''
        check('Protected file blocks anonymous and unassigned participant',lambda:require(download_asset()[0] in (403,404) and request('/api/collections/cer_practice_version_assets/records/'+asset['id'],tokens['b'])[0]==404))
        b_file_token=ok('/api/files/token',tokens['b'],'POST',{})['token']
        check('Unassigned participant file token cannot download asset',lambda:require(download_asset(b_file_token)[0] in (403,404)))
        p_file_token=ok('/api/files/token',tokens['p'],'POST',{})['token']
        check('Active professional can retrieve protected fixture file',lambda:require(download_asset(p_file_token)==(200,b'FICTIONAL_PROTECTED_FILE')))
        record('users',admin,'PATCH',{'status':'suspended'},actors['p']['record']['id'])
        check('Suspended professional cannot download with old file token',lambda:require(download_asset(p_file_token)[0] in (403,404)))
        record('users',admin,'PATCH',{'status':'active'},actors['p']['record']['id'])
        # P has a revoked care link but is an active library professional; suspension must still deny reset.
        record('users',admin,'PATCH',{'status':'suspended'},actors['q']['record']['id'])
        check('Suspended active collaborator cannot reset access',lambda:require(request(reset_endpoint,tokens['q'],'POST',{'target_user_id':actors['b']['record']['id']})[0]==403))
        record('users',admin,'PATCH',{'status':'active'},actors['q']['record']['id'])
        record('users',admin,'PATCH',{'status':'suspended'},actors['b']['record']['id'])
        check('Active professional cannot reactivate suspended patient through reset',lambda:require(request(reset_endpoint,tokens['q'],'POST',{'target_user_id':actors['b']['record']['id']})[0]==403 and record('users',admin,id=actors['b']['record']['id'])['status']=='suspended'))
        record('users',admin,'PATCH',{'status':'active'},actors['b']['record']['id'])
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
            check('Restored private life remains inaccessible to professional',lambda:require(request(life_endpoint,restored_p)[0]==404 and request(life_endpoint,restored_a)[0]==200))
            restored_file_token=ok('/api/files/token',restored_p,'POST',{})['token']
            check('Restored protected file preserves content and anonymous denial',lambda:require(download_asset(restored_file_token)==(200,b'FICTIONAL_PROTECTED_FILE') and download_asset()[0] in (403,404)))
            check('Restored history preserved',lambda:require(any(v['content']=='FICTIONAL_PRIVATE_MARKER' for v in record('cer_journal_entry_versions',restored_a)['items'])))
            check('Restored revoked scope and withdrawal preserved',lambda:require(request('/api/collections/cer_sessions/records/'+session['id'],restored_p)[0]==404 and request(endpoint,restored_p)[0]==404))
            proc.terminate();proc.wait(timeout=5)
    errors=re.findall(r'^.*(?:ReferenceError|SyntaxError|TypeError).*$',(root/'server.log').read_text()+(root/'restore.log').read_text(),re.MULTILINE)
    assert not errors, 'Runtime hook errors: '+str(errors)
    print(json.dumps({'engine':'PocketBase 0.26.1 reference only','scope':'Complete repository migrations/hooks, generated fictional fixtures; NOT live Skip homologation','scenarios':results,'allPassed':all(v['status']=='PASS' for v in results)},indent=2))
    assert all(v['status']=='PASS' for v in results), 'One or more authenticated lifecycle checks failed'
finally:
    if proc is not None and proc.poll() is None:proc.terminate();proc.wait(timeout=5)
    shutil.rmtree(root)
