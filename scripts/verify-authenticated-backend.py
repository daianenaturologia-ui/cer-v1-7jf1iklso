"""Authenticated REST checks on the complete reference schema and hooks.
Only generated fixtures, loopback, PocketBase 0.26.1 or 0.36.0; never contacts Skip.
Run: CER_POCKETBASE_BINARY=/absolute/path/pocketbase python scripts/verify-authenticated-backend.py
"""
import json, os, pathlib, re, secrets, shutil, socket, subprocess, tempfile, time
import urllib.request, urllib.error

binary = os.environ.get('CER_POCKETBASE_BINARY', '')
assert pathlib.Path(binary).is_absolute(), 'Provide an absolute binary path'
expected_version = os.environ.get('CER_POCKETBASE_VERSION', '0.26.1')
assert expected_version in ('0.26.1', '0.36.0'), 'Unsupported reference version'
assert subprocess.check_output([binary, '--version'], text=True).strip() == 'pocketbase version '+expected_version
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
      save('cer_library_curators',{author_id:users.p.id});
      const adminPerson=save('persons',{full_name:'Disposable Role Administrator',email:'role-admin@example.invalid'});
      const roleAdmin=new Record(app.findCollectionByNameOrId('users'));
      roleAdmin.set('email','role-admin@example.invalid');roleAdmin.setPassword('FixtureRoleAdmin123!');
      roleAdmin.set('person_id',adminPerson.id);roleAdmin.set('status','active');app.save(roleAdmin);
      save('user_roles',{user_id:roleAdmin.id,role:'admin',is_active:true});
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
    (hooks/'998_reference_library_rollback.pb.js').write_text('''onRecordUpdate((e)=>{
      const payload=JSON.parse(e.record.getString('payload'));
      if(payload.title==='ROLLBACK_LIBRARY_PROBE'&&e.record.getString('status')==='approved')throw new BadRequestError('Reference library rollback');
      e.next();
    },'cer_library_submissions');''')
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
        role_admin_probe=subprocess.run(['node','--input-type=module','-e',
            "import { disposableRoleAdmin } from './src/services/disposableRoleAdmin.ts';"
            "const client=await disposableRoleAdmin(process.env.VITE_POCKETBASE_URL);"
            "const records=await client.collection('user_roles').getFullList();"
            "const target=records.find(r=>r.role==='interagente');"
            "if(!target)throw new Error('Missing fixture role');"
            "await client.collection('user_roles').update(target.id,{is_active:true});"
            "process.stdout.write('ROLE_ADMIN_OK');"],capture_output=True,text=True,
            env={**os.environ,'VITE_POCKETBASE_URL':base,'CER_ALLOW_MUTABLE_TESTS':'true'})
        check('Disposable role administrator works with active request hooks',lambda:require(role_admin_probe.returncode==0 and role_admin_probe.stdout=='ROLE_ADMIN_OK'))
        actors={n:ok('/api/collections/users/auth-with-password',method='POST',body={'identity':n+'@example.invalid','password':password}) for n in ['a','b','p','q']}
        tokens={n:v['token'] for n,v in actors.items()}
        enrollments=record('enrollments',admin)['items']
        enroll={n:next(e for e in enrollments if e['person_id']==actors[n]['record']['person_id'])['id'] for n in ['a','b']}
        # Opt-in library: only reviewed versions are exposed; no clinical/account identifiers in DTOs.
        lib='/backend/v1/cer/library'
        def library(actor, action, **body):
            return ok(lib,tokens[actor],'POST',{'action':action,**body})
        def denied_library(actor, action, code, **body):
            return require(request(lib,tokens.get(actor,''),'POST',{'action':action,**body})[0]==code)
        practice={'title':'Fictional pause','theme':'Presence','duration':'One minute','instructions':'Look at a fictional tree. Pause when needed.','experience':'FICTIONAL_EXPERIENCE','display_name':'Fictional alias'}
        check('Library unauthenticated request rejected',lambda:denied_library('guest','feed',401))
        check('Library only assigned active professional is curator',lambda:require(library('p','access')['curator'] and not library('q','access')['curator'] and not library('a','access')['curator']))
        draft=library('a','save',payload=practice,submit=False,consent=False)
        check('Library draft absent from feed and curator queue',lambda:require(library('b','feed')['items']==[] and library('p','queue')['items']==[]))
        check('Library own draft not returned to another person',lambda:require(library('b','mine')['items']==[] and library('a','mine')['items'][0]['id']==draft['id']))
        for col in ['cer_library_submissions','cer_library_posts','cer_library_comments','cer_library_curators','cer_library_reviews']:
            check('Library raw API locked '+col,lambda col=col:require(request('/api/collections/'+col+'/records',tokens['a'])[0]==403 and request('/api/collections/'+col+'/records',tokens['p'],'POST',{'author_id':actors['p']['record']['id']})[0]==403))
        check('Library submission requires explicit consent',lambda:denied_library('a','save',400,id=draft['id'],revision=draft['revision'],payload=practice,submit=True,consent=False))
        check('Library another user cannot edit draft',lambda:denied_library('b','save',403,id=draft['id'],revision=draft['revision'],payload=practice,submit=False))
        pending=library('a','save',id=draft['id'],revision=draft['revision'],payload=practice,submit=True,consent=True)
        check('Library pending practice not visible to community',lambda:require(library('b','feed')['items']==[] and library('p','queue')['items'][0]['status']=='pending'))
        check('Library noncurator professional cannot review',lambda:denied_library('q','review',403,id=pending['id'],revision=pending['revision'],decision='approve',note=''))
        check('Library author cannot approve or view queue',lambda:require(request(lib,tokens['a'],'POST',{'action':'review','id':pending['id'],'revision':pending['revision'],'decision':'approve','note':''})[0]==403 and request(lib,tokens['a'],'POST',{'action':'queue'})[0]==403))
        check('Library stale reviewer cannot approve changed version',lambda:denied_library('p','review',400,id=pending['id'],revision=draft['revision'],decision='approve',note=''))
        check('Library rejection requires meaningful feedback',lambda:denied_library('p','review',400,id=pending['id'],revision=pending['revision'],decision='request_changes',note=' '))
        changes=library('p','review',id=pending['id'],revision=pending['revision'],decision='request_changes',note='Fictional revision requested')
        check('Library feedback returned privately to author',lambda:require(library('a','mine')['items'][0]['review_note']=='Fictional revision requested' and library('b','feed')['items']==[]))
        pending=library('a','save',id=changes['id'],revision=changes['revision'],payload=practice,submit=True,consent=True)
        approved=library('p','review',id=pending['id'],revision=pending['revision'],decision='approve',note='Fictional approval')
        public=library('b','feed')['items'][0]
        check('Library publishes exactly approved payload without private account fields',lambda:require(public['payload']==practice and set(public)=={'id','payload','created'} and actors['a']['record']['id'] not in json.dumps(public)))
        check('Library repeat approval cannot duplicate publication',lambda:denied_library('p','review',400,id=approved['id'],revision=approved['revision'],decision='approve',note=''))
        key='community:'+public['id']
        check('Library comment requires explicit public consent',lambda:denied_library('b','comment',400,target_key=key,display_name='Fictional reader',body='FICTIONAL_COMMENT',consent=False))
        comment=library('b','comment',target_key=key,display_name='Fictional reader',body='FICTIONAL_COMMENT',consent=True)
        shared_comments=library('a','comments',target_key=key)['items']
        check('Library readers see comments without author account identifiers',lambda:require(shared_comments[0]['body']=='FICTIONAL_COMMENT' and not shared_comments[0]['mine'] and set(shared_comments[0])=={'id','display_name','body','created','mine'} and actors['b']['record']['id'] not in json.dumps(shared_comments)))
        check('Library other reader cannot remove comment',lambda:denied_library('a','remove_comment',403,id=comment['id']))
        check('Library curator comment moderation requires a reason',lambda:denied_library('p','remove_comment',400,id=comment['id']))
        library('p','remove_comment',id=comment['id'],note='Fictional moderation')
        check('Library moderated comments no longer visible',lambda:require(library('b','comments',target_key=key)['items']==[]))
        own_comment=library('a','comment',target_key='catalog:cer-ritmo-v1',display_name='Alias',body='FICTIONAL_CATALOG_COMMENT',consent=True)
        library('a','remove_comment',id=own_comment['id'])
        check('Library author can withdraw comment from catalog',lambda:require(library('b','comments',target_key='catalog:cer-ritmo-v1')['items']==[]))
        check('Library comments cannot target unknown/private resource',lambda:denied_library('a','comment',404,target_key='catalog:nonexistent0000',display_name='Alias',body='fiction',consent=True))
        edited=library('a','save',id=approved['id'],revision=approved['revision'],payload={**practice,'instructions':'UNREVIEWED_CHANGE'},submit=False)
        check('Library editing approved content withdraws it until new approval',lambda:require(library('b','feed')['items']==[] and edited['status']=='draft'))
        check('Library comments of removed practice cannot be read',lambda:denied_library('b','comments',404,target_key=key))
        check('Library comments of removed practice cannot be added',lambda:denied_library('b','comment',404,target_key=key,display_name='Alias',body='fiction',consent=True))
        pending=library('a','save',id=edited['id'],revision=edited['revision'],payload=practice,submit=True,consent=True)
        approved2=library('p','review',id=pending['id'],revision=pending['revision'],decision='approve',note='Fictional second approval')
        new_public=library('b','feed')['items'][0]
        check('Library new approved version has own comment thread',lambda:require(new_public['id']!=public['id'] and library('b','comments',target_key='community:'+new_public['id'])['items']==[]))
        library('a','withdraw',id=approved2['id'],revision=approved2['revision'])
        check('Library withdrawal immediately removes public practice',lambda:require(library('b','feed')['items']==[]))
        history=library('p','history',id=pending['id'])['items']
        check('Library audit preserves approvals and owner withdrawal',lambda:require(any(h['decision']=='approve' for h in history) and any(h['decision']=='withdrawn' for h in history)))
        check('Library audit is unavailable to another participant',lambda:denied_library('b','history',403,id=pending['id']))
        check('Library rejects invented fields and malformed payloads',lambda:require(request(lib,tokens['a'],'POST',{'action':'save','payload':{**practice,'clinical_record':'FORGED'},'submit':True,'consent':True})[0]==400 and request(lib,tokens['a'],'POST',{'action':'save','payload':{**practice,'instructions':'x'*6001},'submit':True,'consent':True})[0]==400))
        # Atomic publication: failed submission save must also roll back the newly inserted public post.
        rollback_draft=library('a','save',payload={**practice,'title':'ROLLBACK_LIBRARY_PROBE'},submit=True,consent=True)
        check('Library failed approval rolls back its entire transaction',lambda:require(request(lib,tokens['p'],'POST',{'action':'review','id':rollback_draft['id'],'revision':rollback_draft['revision'],'decision':'approve','note':''})[0]==400 and library('b','feed')['items']==[] and library('a','mine')['items'][0]['status']=='pending'))
        record('users',admin,'PATCH',{'status':'suspended'},actors['b']['record']['id'])
        check('Library reloads account status for previously issued token',lambda:denied_library('b','feed',403))
        record('users',admin,'PATCH',{'status':'active'},actors['b']['record']['id'])
        # Written development plan: private preparation, immutable sharing and explicit routine commands.
        plan_doc={'title':'Fictional Development Plan','moment':'FICTIONAL_SHARED_SYNTHESIS','priorities':'Fictional priority','goals':[{'id':'goal-one','title':'Fictional goal','progress':'Fictional sign','actions':[{'id':'action-one','title':'Fictional action','context':'Fictional context','fallback':''}]}],'next_session':'Review together'}
        care_goal={'id':'cer-integrative-care','title':'Fictional individual care','progress':'Fictional comfort observation','actions':[{'id':'care-action-one','title':'Fictional recovery practice','context':'Fictional professional guidance','fallback':'Fictional adaptation'}]}
        plan_doc['goals'].append(care_goal)
        draft_url='/api/collections/cer_development_plan_drafts/records'
        version_url='/api/collections/cer_development_plan_versions/records'
        routine_url='/api/collections/cer_development_plan_routines/records'
        plan_draft=record('cer_development_plan_drafts',tokens['p'],'POST',{'enrollment_id':enroll['a'],'author_id':actors['p']['record']['id'],'revision':1,'document':plan_doc,'private_notes':'FICTIONAL_PRIVATE_PROFESSIONAL'})
        check('Plan professional draft persists',lambda:require(record('cer_development_plan_drafts',tokens['p'],id=plan_draft['id'])['private_notes']=='FICTIONAL_PRIVATE_PROFESSIONAL'))
        for actor in ['a','b','q']:
            check('Plan private draft denied to '+actor,lambda actor=actor:require(request(draft_url+'/'+plan_draft['id'],tokens[actor])[0]==404))
        check('Plan anonymous draft denied',lambda:require(request(draft_url+'/'+plan_draft['id'])[0]==404))
        check('Plan participant cannot create professional draft',lambda:require(request(draft_url,tokens['a'],'POST',{'enrollment_id':enroll['a'],'author_id':actors['a']['record']['id'],'revision':1,'document':plan_doc})[0] in (400,403)))
        check('Plan stale revision rejected',lambda:require(request(draft_url+'/'+plan_draft['id'],tokens['p'],'PATCH',{'document':plan_doc,'revision':1})[0]==400))
        check('Plan cannot change author or enrollment',lambda:require(request(draft_url+'/'+plan_draft['id'],tokens['p'],'PATCH',{'author_id':actors['q']['record']['id'],'revision':2})[0]==404 and request(draft_url+'/'+plan_draft['id'],tokens['p'],'PATCH',{'enrollment_id':enroll['b'],'revision':2})[0]==404))
        presented=record('cer_development_plan_versions',tokens['p'],'POST',{'draft_id':plan_draft['id'],'enrollment_id':enroll['a'],'revision':1,'stage':'building','document':{'forged':'client'}})
        check('Plan sharing uses server document without private notes',lambda:require(record('cer_development_plan_versions',tokens['a'],id=presented['id'])['document']==plan_doc and 'FICTIONAL_PRIVATE_PROFESSIONAL' not in json.dumps(presented)))
        for actor in ['b','q']:
            check('Plan shared version denied to '+actor,lambda actor=actor:require(request(version_url+'/'+presented['id'],tokens[actor])[0]==404))
        check('Plan shared version immutable for professional and participant',lambda:require(request(version_url+'/'+presented['id'],tokens['p'],'PATCH',{'stage':'agreed'})[0] in (403,404) and request(version_url+'/'+presented['id'],tokens['a'],'DELETE')[0] in (403,404)))
        schedule={'days':[1,3],'time':'09:00','duration':20,'timezone':'America/Sao_Paulo'}
        day=time.strftime('%Y-%m-%d',time.gmtime())
        routine_body={'enrollment_id':enroll['a'],'version_id':presented['id'],'action_id':'action-one','effective_day':day,'enabled':True,'schedule':schedule,'command_key':'fictional-command-one'}
        check('Plan building version cannot create routines',lambda:require(request(routine_url,tokens['a'],'POST',routine_body)[0]==400))
        bridge='/backend/v1/cer/care-plan-for-cycle'
        check('Cycle bridge denies anonymous request',lambda:require(request(bridge,method='POST',body={'enrollment_id':enroll['a']})[0]==401))
        for actor in ['a','b','q']:
            check('Cycle bridge denies unauthorized '+actor,lambda actor=actor:require(request(bridge,tokens[actor],'POST',{'enrollment_id':enroll['a']})[0]==403))
        check('Cycle bridge does not activate building document',lambda:require(request(bridge,tokens['p'],'POST',{'enrollment_id':enroll['a']})[0]==400))
        changed={**plan_doc,'moment':'FICTIONAL_REVISED_SYNTHESIS'}
        record('cer_development_plan_drafts',tokens['p'],'PATCH',{'document':changed,'revision':2},plan_draft['id'])
        check('Plan private revision does not change visible shared version',lambda:require(record('cer_development_plan_versions',tokens['a'],id=presented['id'])['document']['moment']=='FICTIONAL_SHARED_SYNTHESIS'))
        agreed=record('cer_development_plan_versions',tokens['p'],'POST',{'draft_id':plan_draft['id'],'enrollment_id':enroll['a'],'revision':2,'stage':'agreed'})
        operational=ok(bridge,tokens['p'],'POST',{'enrollment_id':enroll['a']})
        check('Cycle bridge uses agreed document without private notes',lambda:require(record('cer_care_plans',tokens['p'],id=operational['id'])['development_version_id']==agreed['id'] and 'FICTIONAL_PRIVATE_PROFESSIONAL' not in json.dumps(record('cer_care_plans',tokens['p'],id=operational['id']))))
        check('Cycle bridge retry reuses one active anchor',lambda:require(ok(bridge,tokens['p'],'POST',{'enrollment_id':enroll['a']})['id']==operational['id'] and len(record('cer_care_plans',tokens['p'])['items'])==1))
        care_cycle=record('cer_care_cycles',tokens['p'],'POST',{'enrollment_id':enroll['a'],'plan_id':operational['id'],'cycle_number':1,'created_by_user_id':actors['p']['record']['id'],'status':'planned','review_event_type':'participant_checkin'})
        check('Cycle can start directly from agreed document anchor',lambda:require(record('cer_care_cycles',tokens['p'],'PATCH',{'status':'active'},care_cycle['id'])['status']=='active'))
        routine_body={**routine_body,'version_id':agreed['id']}
        routine=record('cer_development_plan_routines',tokens['a'],'POST',{**routine_body,'snapshot':{'forged':'client'}})
        check('Plan routine snapshot derived from agreed action',lambda:require(routine['snapshot']['action']['title']=='Fictional action' and routine['snapshot']['goal']=='Fictional goal'))
        care_routine=record('cer_development_plan_routines',tokens['a'],'POST',{**routine_body,'action_id':'care-action-one','command_key':'fictional-care-command'})
        check('Plan care chapter can be explicitly scheduled from agreed snapshot',lambda:require(care_routine['snapshot']['goal']=='Fictional individual care' and care_routine['snapshot']['action']['context']=='Fictional professional guidance'))
        bounded=record('cer_development_plan_routines',tokens['a'],'POST',{**routine_body,'schedule':{**schedule,'until':'2099-12-31'},'command_key':'bounded-routine-command'})
        check('Routine preserves explicit ending date',lambda:require(bounded['schedule']['until']=='2099-12-31'))
        check('Routine rejects ending before start',lambda:require(request(routine_url,tokens['a'],'POST',{**routine_body,'schedule':{**schedule,'until':'2020-01-01'},'command_key':'bad-end-command'})[0]==400))
        check('Plan duplicate routine command rejected',lambda:require(request(routine_url,tokens['a'],'POST',routine_body)[0]==400))
        check('Plan routine cannot use another enrollment',lambda:require(request(routine_url,tokens['b'],'POST',{**routine_body,'enrollment_id':enroll['b'],'command_key':'foreign-command'})[0]==400))
        check('Plan routine cannot invent an action',lambda:require(request(routine_url,tokens['a'],'POST',{**routine_body,'action_id':'foreign-action','command_key':'foreign-action-command'})[0]==400))
        check('Plan invalid schedule rejected',lambda:require(request(routine_url,tokens['a'],'POST',{**routine_body,'schedule':{**schedule,'days':[9]},'command_key':'bad-days-command'})[0]==400))
        check('Plan past schedule cannot rewrite history',lambda:require(request(routine_url,tokens['a'],'POST',{**routine_body,'effective_day':'2020-01-01','command_key':'past-command'})[0]==400))
        check('Plan routines are append only',lambda:require(request(routine_url+'/'+routine['id'],tokens['a'],'PATCH',{'enabled':False})[0] in (403,404)))
        for actor in ['b','q']:
            check('Plan routine denied to '+actor,lambda actor=actor:require(request(routine_url+'/'+routine['id'],tokens[actor])[0]==404))
        check('Plan linked professional can view routine',lambda:require(record('cer_development_plan_routines',tokens['p'],id=routine['id'])['snapshot']['action']['id']=='action-one'))
        incomplete={**changed,'goals':[care_goal]}
        record('cer_development_plan_drafts',tokens['p'],'PATCH',{'document':incomplete,'revision':3},plan_draft['id'])
        check('Plan care alone cannot replace the main goal in an agreement',lambda:require(request(version_url,tokens['p'],'POST',{'draft_id':plan_draft['id'],'enrollment_id':enroll['a'],'revision':3,'stage':'agreed'})[0]==400))
        building=record('cer_development_plan_versions',tokens['p'],'POST',{'draft_id':plan_draft['id'],'enrollment_id':enroll['a'],'revision':3,'stage':'building'})
        check('Plan old agreement cannot schedule silently after revision',lambda:require(request(routine_url,tokens['a'],'POST',{**routine_body,'command_key':'old-agreement-command'})[0]==400))
        paused=record('cer_development_plan_routines',tokens['p'],'POST',{**routine_body,'enabled':False,'command_key':'pause-old-command'})
        check('Plan historical action may be explicitly paused',lambda:require(not paused['enabled'] and record('cer_development_plan_versions',tokens['a'],id=agreed['id'])['document']==changed))
        multi={**plan_doc,'goals':[plan_doc['goals'][0],{**plan_doc['goals'][0],'id':'another-goal','actions':[{'id':'another-action','title':'Another fictional action','context':'Another context','fallback':''}]},care_goal]}
        record('cer_development_plan_drafts',tokens['p'],'PATCH',{'document':multi,'revision':4},plan_draft['id'])
        check('Plan multiple main goals cannot be agreed simultaneously',lambda:require(request(version_url,tokens['p'],'POST',{'draft_id':plan_draft['id'],'enrollment_id':enroll['a'],'revision':4,'stage':'agreed'})[0]==400))
        plan_link=next(v for v in record('professional_enrollment_access',admin)['items'] if v['enrollment_id']==enroll['a'] and v['professional_user_id']==actors['p']['record']['id'])
        record('professional_enrollment_access',admin,'PATCH',{'is_active':False},plan_link['id'])
        check('Plan revoked professional loses draft and shared access',lambda:require(request(draft_url+'/'+plan_draft['id'],tokens['p'])[0]==404 and request(version_url+'/'+agreed['id'],tokens['p'])[0]==404 and request(routine_url+'/'+routine['id'],tokens['p'])[0]==404))
        record('professional_enrollment_access',admin,'PATCH',{'is_active':True},plan_link['id'])
        concurrent_draft=record('cer_development_plan_drafts',tokens['q'],'POST',{'enrollment_id':enroll['b'],'author_id':actors['q']['record']['id'],'revision':1,'document':plan_doc})
        from concurrent.futures import ThreadPoolExecutor
        def concurrent_edit(marker):
            return request(draft_url+'/'+concurrent_draft['id'],tokens['q'],'PATCH',{'document':{**plan_doc,'moment':marker},'revision':2})[0]
        with ThreadPoolExecutor(max_workers=2) as executor:
            concurrent_results=list(executor.map(concurrent_edit,['first edit','second edit']))
        check('Plan concurrent edits preserve one revision',lambda:require(sorted(concurrent_results)==[200,400]))
        # Progressive educational library: drafts, material metadata, snapshots and author isolation.
        library_url='/api/collections/cer_development_resources/records'
        draft_body={'author_user_id':actors['p']['record']['id'],'title':'FICTIONAL_FUTURE_AUDIO','status':'draft','instructions':[]}
        draft=record('cer_development_resources',tokens['p'],'POST',draft_body)
        check('Library incomplete draft survives reload',lambda:require(record('cer_development_resources',tokens['p'],id=draft['id'])['title']=='FICTIONAL_FUTURE_AUDIO'))
        for actor in ['a','b','q']:
            check('Library draft hidden from '+actor,lambda actor=actor:require(request(library_url+'/'+draft['id'],tokens[actor])[0]==404))
        check('Library participant cannot author content',lambda:require(request(library_url,tokens['a'],'POST',{**draft_body,'author_user_id':actors['a']['record']['id']})[0] in (400,403)))
        check('Library incomplete publication denied',lambda:require(request(library_url+'/'+draft['id'],tokens['p'],'PATCH',{'status':'published'})[0]==400))
        material={'format':'audio','url':'https://example.org/fictional-audio.mp3','author':'Fictional Author','references':'Fictional source','conditions':'Fictional instructions'}
        ready={'lesson':'Fictional educational lesson','instructions':['Read the fictional instructions.'],'material':material,'status':'published'}
        check('Library executable material URL denied',lambda:require(request(library_url+'/'+draft['id'],tokens['p'],'PATCH',{**ready,'material':{**material,'url':'javascript:alert(1)'}})[0]==400))
        check('Library author cannot be replaced',lambda:require(request(library_url+'/'+draft['id'],tokens['q'],'PATCH',ready)[0]==404))
        published=record('cer_development_resources',tokens['p'],'PATCH',ready,draft['id'])
        check('Library published audio visible to participant',lambda:require(record('cer_development_resources',tokens['a'],id=draft['id'])['material']==material))
        snapshot={k:published[k] for k in ['id','title','lesson','instructions','material']}
        development=record('cer_development_experiments',tokens['a'],'POST',{'enrollment_id':enroll['a'],'resource_snapshot':snapshot,'goal':'Fictional goal','action':'Fictional action','context':'Fictional context','status':'planned','access_class':'participant_private'})
        check('Library published material cannot be replaced in place',lambda:require(request(library_url+'/'+draft['id'],tokens['p'],'PATCH',{'material':{**material,'url':'https://example.org/changed.mp3'},'status':'archived'})[0]==400))
        record('cer_development_resources',tokens['p'],'PATCH',{'status':'archived'},draft['id'])
        check('Library retired resource hidden from new participant lookup',lambda:require(request(library_url+'/'+draft['id'],tokens['a'])[0]==404))
        check('Library snapshot keeps original material after retirement',lambda:require(record('cer_development_experiments',tokens['a'],id=development['id'])['resource_snapshot']['material']==material))
        check('Library participant snapshot cannot be rewritten',lambda:require(request('/api/collections/cer_development_experiments/records/'+development['id'],tokens['a'],'PATCH',{'resource_snapshot':{**snapshot,'material':{**material,'url':'https://example.org/changed.mp3'}}})[0]==400))
        # Cycle journal: real reference REST rules and request hooks, fictional fixtures only.
        cycle_url='/api/collections/cer_cycle_entries/records'
        profile_url='/api/collections/cer_cycle_profiles/records'
        profile=record('cer_cycle_profiles',tokens['a'],'POST',{'enrollment_id':enroll['a'],'context':'natural','cycle_length':30,'lunar_reflections':True,'planner_reminders':True})
        cycle_body={'enrollment_id':enroll['a'],'day':'2026-01-01','energy':2,'emotions':['Tranquila'],'reflection':'FICTIONAL_CYCLE_PRIVATE','thoughts':'FICTIONAL_DAY_THOUGHT','cycle_signs':['TPM percebida'],'bleeding':'Leve','period_start':True,'access_class':'participant_private'}
        cycle=record('cer_cycle_entries',tokens['a'],'POST',cycle_body)
        check('Cycle owner can reload persistent private entry',lambda:require(record('cer_cycle_entries',tokens['a'],id=cycle['id'])['reflection']=='FICTIONAL_CYCLE_PRIVATE'))
        check('Cycle thoughts and perceived signs persist',lambda:require(record('cer_cycle_entries',tokens['a'],id=cycle['id'])['thoughts']=='FICTIONAL_DAY_THOUGHT' and record('cer_cycle_entries',tokens['a'],id=cycle['id'])['cycle_signs']==['TPM percebida']))
        check('Cycle unknown signs rejected',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['a'],'PATCH',{'cycle_signs':['invented phase']})[0]==400))
        check('Cycle unknown and perceived signs cannot coexist',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['a'],'PATCH',{'cycle_signs':['Não sei identificar','TPM percebida']})[0]==400))
        for actor in ['b','p','q']:
            check('Cycle private entry denied to '+actor,lambda actor=actor:require(request(cycle_url+'/'+cycle['id'],tokens[actor])[0]==404 and record('cer_cycle_entries',tokens[actor])['items']==[]))
            check('Cycle preferences stay private from '+actor,lambda actor=actor:require(request(profile_url+'/'+profile['id'],tokens[actor])[0]==404))
        check('Cycle anonymous reads denied',lambda:require(request(cycle_url+'/'+cycle['id'])[0]==404))
        check('Cycle duplicate day rejected',lambda:require(request(cycle_url,tokens['a'],'POST',cycle_body)[0]==400))
        check('Cycle impossible date rejected by request hook',lambda:require(request(cycle_url,tokens['a'],'POST',{**cycle_body,'day':'2026-02-30'})[0]==400))
        check('Cycle start without menstrual flow rejected',lambda:require(request(cycle_url,tokens['a'],'POST',{**cycle_body,'day':'2026-01-02','bleeding':'Escape'})[0]==400))
        check('Cycle cannot bind to another owner',lambda:require(request(cycle_url,tokens['a'],'POST',{**cycle_body,'enrollment_id':enroll['b']})[0]==400))
        record('cer_cycle_entries',tokens['a'],'PATCH',{'access_class':'participant_shared'},cycle['id'])
        check('Cycle explicit sharing allows assigned active professional',lambda:require(record('cer_cycle_entries',tokens['p'],id=cycle['id'])['reflection']=='FICTIONAL_CYCLE_PRIVATE'))
        check('Cycle sharing still excludes unrelated or revoked actors',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['b'])[0]==404 and request(cycle_url+'/'+cycle['id'],tokens['q'])[0]==404))
        check('Cycle professional cannot write or delete shared entry',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['p'],'PATCH',{'reflection':'tampered'})[0]==404 and request(cycle_url+'/'+cycle['id'],tokens['p'],'DELETE')[0]==404))
        check('Cycle owner cannot change enrollment or date',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['a'],'PATCH',{'enrollment_id':enroll['b']})[0]==404 and request(cycle_url+'/'+cycle['id'],tokens['a'],'PATCH',{'day':'2026-01-02'})[0]==404))
        cycle_link=next(v for v in record('professional_enrollment_access',admin)['items'] if v['enrollment_id']==enroll['a'] and v['professional_user_id']==actors['p']['record']['id'])
        record('professional_enrollment_access',admin,'PATCH',{'is_active':False},cycle_link['id'])
        check('Cycle access revocation takes effect on existing session',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['p'])[0]==404))
        record('professional_enrollment_access',admin,'PATCH',{'is_active':True},cycle_link['id'])
        record('users',admin,'PATCH',{'status':'suspended'},actors['p']['record']['id'])
        check('Cycle suspended professional denied with old token',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['p'])[0]==404))
        record('users',admin,'PATCH',{'status':'active'},actors['p']['record']['id'])
        record('cer_cycle_entries',tokens['a'],'PATCH',{'access_class':'participant_private'},cycle['id'])
        check('Cycle withdrawal immediately hides shared record',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['p'])[0]==404))
        record('cer_cycle_entries',tokens['a'],'DELETE',id=cycle['id'])
        check('Cycle owner can delete their daily record',lambda:require(request(cycle_url+'/'+cycle['id'],tokens['a'])[0]==404))
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
        revised=record('cer_next_session_messages',tokens['a'],'POST',{'enrollment_id':enroll['a'],'participant_user_id':actors['a']['record']['id'],'message_text':'Fictional revised initial intake','summary_text':'Revised intake','status':'draft','access_class':'participant_private'})
        revised_path='/api/collections/cer_next_session_messages/records/'+revised['id']
        check('Intake revision remains private before explicit send',lambda:require(request(revised_path,tokens['p'])[0]==404 and record('cer_next_session_messages',tokens['a'],id=revised['id'])['message_text']=='Fictional revised initial intake'))
        record('cer_next_session_messages',tokens['a'],'PATCH',{'status':'approved'},revised['id'])
        check('Intake revision shared with assigned professional',lambda:require(record('cer_next_session_messages',tokens['p'],id=revised['id'])['message_text']=='Fictional revised initial intake'))
        check('Intake previous sent version preserved',lambda:require(record('cer_next_session_messages',tokens['a'],id=message['id'])['message_text']=='Fictional shared summary' and record('cer_next_session_messages',tokens['p'],id=message['id'])['status']=='approved'))
        check('Intake revision remains blocked for unrelated accounts',lambda:require(request(revised_path,tokens['q'])[0]==404 and request(revised_path,tokens['b'])[0]==404))
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
        direction_body={'enrollment_id':enroll['a'],'kind':'future','horizon':'open','title':'Fictional goal to archive','narrative':'','meaning':'','resources':'','limits':'','first_step':'','access_class':'participant_shared'}
        direction=record('cer_life_directions',tokens['a'],'POST',direction_body)
        direction_url='/api/collections/cer_life_directions/records/'+direction['id']
        check('Other participant and professional cannot exclude a goal',lambda:require(request(direction_url,tokens['b'],'PATCH',{'archived':True})[0]==404 and request(direction_url,tokens['p'],'PATCH',{'archived':True})[0]==404))
        check('Goal exclusion cannot transfer ownership',lambda:require(request(direction_url,tokens['a'],'PATCH',{'enrollment_id':enroll['b'],'archived':True})[0]==404))
        check('Owner can exclude goal with partial update',lambda:require(record('cer_life_directions',tokens['a'],'PATCH',{'archived':True},direction['id'])['archived'] is True))
        check('Excluded goal stays recoverable and leaves active list',lambda:require(record('cer_life_directions',tokens['a'],id=direction['id'])['title']=='Fictional goal to archive' and direction['id'] not in [v['id'] for v in ok('/api/collections/cer_life_directions/records?filter=archived=false',tokens['a'])['items']]))
        check('Owner can restore excluded goal without losing content',lambda:require(record('cer_life_directions',tokens['a'],'PATCH',{'archived':False},direction['id'])['title']==direction_body['title']))
        daily_body={'enrollment_id':enroll['a'],'day_label':'Fictional weekday','moments':[{'time':'07:00','activity':'Wake up'},{'time':'00:30','activity':'Sleep'}],'access_class':'participant_private'}
        daily=record('cer_daily_routines',tokens['a'],'POST',daily_body)
        daily_url='/api/collections/cer_daily_routines/records/'+daily['id']
        check('Daily routine preserves narrated order across midnight',lambda:require(record('cer_daily_routines',tokens['a'],id=daily['id'])['moments']==daily_body['moments']))
        check('Daily routine private from linked and inactive professionals and other participants',lambda:require(all(request(daily_url,tokens[u])[0]==404 for u in ['p','q','b'])))
        check('Daily routine cannot be duplicated',lambda:require(request('/api/collections/cer_daily_routines/records',tokens['a'],'POST',daily_body)[0]==400))
        check('Daily routine shared only by owner partial update',lambda:require(record('cer_daily_routines',tokens['a'],'PATCH',{'access_class':'participant_shared'},daily['id'])['access_class']=='participant_shared' and record('cer_daily_routines',tokens['p'],id=daily['id'])['moments']==daily_body['moments']))
        check('Daily routine inactive and unrelated readers still denied after share',lambda:require(all(request(daily_url,tokens[u])[0]==404 for u in ['q','b'])))
        check('Daily routine professional cannot change or create',lambda:require(request(daily_url,tokens['p'],'PATCH',{'day_label':'forged'})[0]==404 and request('/api/collections/cer_daily_routines/records',tokens['p'],'POST',daily_body)[0]==400))
        check('Daily routine ownership cannot be transferred',lambda:require(request(daily_url,tokens['a'],'PATCH',{'enrollment_id':enroll['b']})[0]==404))
        check('Daily routine rejects malformed times and empty activities',lambda:require(all(request(daily_url,tokens['a'],'PATCH',{'moments':m})[0]==400 for m in [[],[{'time':'25:00','activity':'sleep'}],[{'time':'','activity':' '}],{'unsafe':'shape'}])))
        check('Daily routine remains editable and accepts approximate unknown times',lambda:require(record('cer_daily_routines',tokens['a'],'PATCH',{'moments':[{'time':'','activity':'Lunch when possible'}]},daily['id'])['moments'][0]['time']==''))
        check('Daily routine revoked sharing takes effect immediately',lambda:require(record('cer_daily_routines',tokens['a'],'PATCH',{'access_class':'participant_private'},daily['id'])['access_class']=='participant_private' and request(daily_url,tokens['p'])[0]==404))
        check('Daily routine physical deletion blocked',lambda:require(request(daily_url,tokens['a'],'DELETE')[0]==403))
        life_body={'enrollment_id':enroll['a'],'title':'Fictional life event','time_kind':'year','time_value':'2000','emotions':['Alegria'],'narrative':'FICTIONAL_LIFE_MARKER','access_class':'participant_private'}
        check('Life event blocked before six dimensions completed',lambda:require(request('/api/collections/cer_life_events/records',tokens['b'],'POST',{**life_body,'enrollment_id':enroll['b']})[0]==400))
        life=record('cer_life_events',tokens['a'],'POST',life_body)
        check('Life event accepts a freely written feeling and preserves it',lambda:require(record('cer_life_events',tokens['a'],'PATCH',{'emotion_note':'Saudade e esperança, sem caber na lista.'},life['id'])['emotion_note']=='Saudade e esperança, sem caber na lista.'))
        check('Life event rejects oversized feeling without losing the saved note',lambda:require(request('/api/collections/cer_life_events/records/'+life['id'],tokens['a'],'PATCH',{'emotion_note':'x'*2001})[0]==400 and record('cer_life_events',tokens['a'],id=life['id'])['emotion_note']=='Saudade e esperança, sem caber na lista.'))
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
    print(json.dumps({'engine':'PocketBase '+expected_version+' reference only','scope':'Complete repository migrations/hooks, generated fictional fixtures; NOT live Skip homologation','scenarios':results,'allPassed':all(v['status']=='PASS' for v in results)},indent=2))
    assert all(v['status']=='PASS' for v in results), 'One or more authenticated lifecycle checks failed'
finally:
    if proc is not None and proc.poll() is None:proc.terminate();proc.wait(timeout=5)
    shutil.rmtree(root)
