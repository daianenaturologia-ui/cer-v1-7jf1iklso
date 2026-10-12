"""Authenticated questionnaire lifecycle on the complete reference schema and hooks.
Only generated fixtures, loopback, PocketBase 0.26.1; never contacts Skip.
Run: CER_POCKETBASE_BINARY=/absolute/path/pocketbase python scripts/verify-authenticated-questionnaires.py
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
        endpoint='/backend/v1/cer/questionnaires/prepare'
        body={'enrollment_id':enroll['b'],'experience_id':'exp-corpo-fisiologia-07b','prompt_id':'ayv_c1_p1_estrutura_corporal'}
        check('Anonymous preparation denied',lambda:require(request(endpoint,method='POST',body=body)[0] in (401,403)))
        check('Another participant and unlinked professional denied',lambda:require(request(endpoint,tokens['a'],'POST',body)[0]==403 and request(endpoint,tokens['p'],'POST',body)[0]==403))
        check('Linked professional cannot answer on behalf of participant',lambda:require(request(endpoint,tokens['q'],'POST',body)[0]==403))
        first=ok(endpoint,tokens['b'],'POST',body)
        check('Fresh enrollment resolves catalog relations',lambda:require(len(first['experience_id'])==15 and len(first['prompt_id'])==15 and first['enrollment_experience']['release_status']=='available'))
        repeated=ok(endpoint,tokens['b'],'POST',body)
        check('Preparation resumes same progress record',lambda:require(first['enrollment_experience']['id']==repeated['enrollment_experience']['id']))
        response_body={'enrollment_id':enroll['b'],'experience_id':first['experience_id'],'prompt_id':first['prompt_id'],'respondent_user_id':actors['b']['record']['id'],'response_type':'ChoiceCards','access_class':'shared_care','prompt_version':1,'version':1,'status':'saved','structured_value':{'choice':'intermediate','revision_number':1,'metadata':{'prompt_key':'ayv_c1_p1_estrutura_corporal'}}}
        answer=record('experience_responses',tokens['b'],'POST',response_body)
        check('Authenticated answer persists and restores logical key',lambda:require(record('experience_responses',tokens['b'],id=answer['id'])['structured_value']['choice']=='intermediate' and ok('/api/collections/experience_responses/records/'+answer['id']+'?expand=prompt_id',tokens['b'])['expand']['prompt_id']['schema_config']['cer_logical_prompt_id']==body['prompt_id']))
        check('Another participant cannot read answer',lambda:require(request('/api/collections/experience_responses/records/'+answer['id'],tokens['a'])[0]==404))
        updated=record('experience_responses',tokens['b'],'PATCH',{'structured_value':{'choice':'slender','revision_number':1}},answer['id'])
        versions=ok('/api/collections/experience_response_versions/records?perPage=500',tokens['b'])['items']
        check('Answer edit preserves previous value',lambda:require(updated['version']==2 and any(v['response_id']==answer['id'] and v['structured_value']['choice']=='intermediate' for v in versions)))
        revision_body={**body,'prompt_id':body['prompt_id']+'_rev2'}
        check('Revision cannot start before chapter completion',lambda:require(request(endpoint,tokens['b'],'POST',revision_body)[0]==400))
        completion_prompt=ok(endpoint,tokens['b'],'POST',{**body,'prompt_id':'ayv_c1_chapter1_completion'})
        completion_value={'completed':True,'revision_number':1,'metadata':{'prompt_key':'ayv_c1_chapter1_completion','revision_number':1}}
        completion=record('experience_responses',tokens['b'],'POST',{**response_body,'prompt_id':completion_prompt['prompt_id'],'response_type':'ChapterCompletion','structured_value':completion_value})
        check('Chapter completion persists',lambda:require(record('experience_responses',tokens['b'],id=completion['id'])['structured_value']['completed'] is True))
        resumed=ok('/api/collections/users/auth-with-password',method='POST',body={'identity':'b@example.invalid','password':password})['token']
        check('New login restores answer and completion',lambda:require(record('experience_responses',resumed,id=answer['id'])['structured_value']['choice']=='slender' and record('experience_responses',resumed,id=completion['id'])['structured_value']['completed'] is True))
        # A second completion write exercises the same immutable history path as retry.
        status,completion_update=request('/api/collections/experience_responses/records/'+completion['id'],tokens['b'],'PATCH',{'structured_value':completion_value})
        check('Completion retry preserves history',lambda:require(status==200 and completion_update['version']==2))
        revision=ok(endpoint,tokens['b'],'POST',revision_body)
        revised=record('experience_responses',tokens['b'],'POST',{**response_body,'prompt_id':revision['prompt_id'],'structured_value':{'choice':'broad','revision_number':2}})
        check('Revision uses new prompt and retains original answer',lambda:require(revised['prompt_id']!=answer['prompt_id'] and record('experience_responses',tokens['b'],id=answer['id'])['structured_value']['choice']=='slender'))
        check('Revision jump refused',lambda:require(request(endpoint,tokens['b'],'POST',{**body,'prompt_id':body['prompt_id']+'_rev3'})[0]==400))
        check('Cross-questionnaire prompt refused',lambda:require(request(endpoint,tokens['b'],'POST',{**body,'prompt_id':'me_01_mundo_emocional'})[0] in (400,404)))
        progress_id=first['enrollment_experience']['id']
        record('enrollment_experiences',admin,'PATCH',{'release_status':'locked'},progress_id)
        check('Locked progress is not reopened',lambda:require(request(endpoint,tokens['b'],'POST',body)[0]==403 and record('enrollment_experiences',admin,id=progress_id)['release_status']=='locked'))
        record('enrollment_experiences',admin,'PATCH',{'release_status':'available'},progress_id)
        record('enrollments',admin,'PATCH',{'status':'paused'},enroll['b'])
        check('Paused enrollment refuses preparation',lambda:require(request(endpoint,tokens['b'],'POST',body)[0]==403))
        record('enrollments',admin,'PATCH',{'status':'active'},enroll['b'])
        record('users',admin,'PATCH',{'status':'suspended'},actors['b']['record']['id'])
        check('Suspended participant cannot prepare with existing token',lambda:require(request(endpoint,tokens['b'],'POST',body)[0]==403))
        record('users',admin,'PATCH',{'status':'active'},actors['b']['record']['id'])
        record('users',admin,'PATCH',{'status':'suspended'},actors['q']['record']['id'])
        check('Suspended professional cannot prepare with existing token',lambda:require(request(endpoint,tokens['q'],'POST',{**body,'prompt_id':''})[0]==403))
        proc.terminate();proc.wait(timeout=5)
    errors=re.findall(r'^.*(?:ReferenceError|SyntaxError|TypeError).*$',(root/'server.log').read_text(),re.MULTILINE)
    assert not errors, 'Runtime hook errors: '+str(errors)
    print(json.dumps({'engine':'PocketBase 0.26.1 reference only','scope':'Authenticated questionnaire fixtures, complete schema/hooks; NOT live Skip homologation','scenarios':results,'allPassed':all(v['status']=='PASS' for v in results)},indent=2))
    assert all(v['status']=='PASS' for v in results), 'One or more authenticated questionnaire checks failed'
finally:
    if proc is not None and proc.poll() is None:proc.terminate();proc.wait(timeout=5)
    shutil.rmtree(root)
