"""Disposable PocketBase REST checks. Only generated example.invalid accounts on loopback.
Run CER_POCKETBASE_BINARY=/path/pocketbase python scripts/verify-self-registration.py.
The mail hook intercepts synthetic verification messages; no email leaves the bench.
"""
import os, pathlib, tempfile, shutil, subprocess, socket, time, urllib.request, urllib.error, json, secrets, re
binary=os.environ['CER_POCKETBASE_BINARY']
assert pathlib.Path(binary).is_absolute(), 'Use an absolute PocketBase binary path'
version_output=subprocess.check_output([binary,'--version'],text=True).strip()
version=version_output.rsplit(' version ',1)[-1]
assert version in ['0.26.1','0.36.0'], 'Unsupported reference version'
root=pathlib.Path(tempfile.mkdtemp(prefix='cer-registration-'))
password=secrets.token_hex(20)
proc=None
passed=[]
success=False
try:
    migrations=root/'migrations'; hooks=root/'hooks'; data=root/'data'
    migrations.mkdir(); hooks.mkdir()
    for src in pathlib.Path('pocketbase/migrations').glob('*.js'):shutil.copy(src,migrations/src.name)
    fixture='''migrate((app)=>{
const save=(col,d)=>{const r=new Record(app.findCollectionByNameOrId(col));for(const k in d)r.set(k,d[k]);app.save(r);return r};
for(const name of ['professional','other','ordinary','legacy']){
const p=save('persons',{full_name:'Disposable '+name,email:name+'@example.invalid'});
const u=new Record(app.findCollectionByNameOrId('users'));u.set('email',name+'@example.invalid');u.set('name',name);u.setPassword(PASSWORD);u.set('person_id',p.id);u.set('status','active');u.set('verified',name!=='legacy');app.save(u);
save('user_roles',{user_id:u.id,role:name==='ordinary'?'interagente':'profissional',is_active:true});
}},()=>{});'''.replace('PASSWORD',json.dumps(password))
    (migrations/'9999_registration_fixture.js').write_text(fixture)
    cmd=[binary,'migrate','up','--dir='+str(data),'--migrationsDir='+str(migrations),'--hooksDir='+str(hooks)]
    run=subprocess.run(cmd,capture_output=True,text=True)
    assert run.returncode==0 and 'Error: Failed' not in run.stdout+run.stderr, 'Migration failed: '+(run.stdout+run.stderr)[-800:]
    run=subprocess.run([binary,'superuser','upsert','admin@example.invalid',password,'--dir='+str(data),'--migrationsDir='+str(migrations),'--hooksDir='+str(hooks)],capture_output=True,text=True)
    assert run.returncode==0, 'Bench administrator setup failed'
    for src in pathlib.Path('pocketbase/hooks').glob('*.js'):shutil.copy(src,hooks/(src.stem+'.pb.js'))
    mail=root/'verification.html'
    (hooks/'zz_registration_mail.pb.js').write_text("onMailerSend((e)=>{const email=e.message.to[0].address;if(email==='mail-failure@example.invalid')throw new Error('Synthetic mail failure');$os.writeFile("+json.dumps(str(mail))+",unescape(encodeURIComponent(email+'\\n'+e.message.html)).split('').map(c=>c.charCodeAt(0)),384)})")
    (hooks/'zz_registration_rollback.pb.js').write_text("""onRecordCreate((e)=>{
      const user=e.app.findRecordById('users',e.record.getString('user_id'));
      if(user.getString('email')==='rollback@example.invalid')throw new BadRequestError('Synthetic transaction failure');
      e.next();
    },'cer_registration_requests');
    onRecordCreate((e)=>{
      const enrollment=e.app.findRecordById('enrollments',e.record.getString('enrollment_id'));
      const person=e.app.findRecordById('persons',enrollment.getString('person_id'));
      if(person.getString('email')==='activation-failure@example.invalid')throw new BadRequestError('Synthetic activation failure');
      e.next();
    },'journey_states');""")
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    base='http://127.0.0.1:'+str(port)
    logs=open(root/'server.log','w+')
    proc=subprocess.Popen([binary,'serve','--http=127.0.0.1:'+str(port),'--dir='+str(data),'--migrationsDir='+str(migrations),'--hooksDir='+str(hooks)],stdout=logs,stderr=logs)
    def req(path,body=None,token='',method=None):
        assert base.startswith('http://127.0.0.1:')
        request=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json',**({'Authorization':token} if token else {})},method=method or ('POST' if body is not None else 'GET'))
        try:
            with urllib.request.urlopen(request,timeout=8) as r:return r.status,json.loads(r.read() or '{}')
        except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or '{}')
    for _ in range(80):
        try:
            if req('/api/health')[0]==200:break
        except OSError:pass
        time.sleep(.1)
    def wait_mail(email):
        for _ in range(80):
            if mail.exists() and mail.read_text().startswith(email+'\n'):return
            time.sleep(.05)
        raise AssertionError('Synthetic verification message did not reach interceptor')
    def check(ok,label):
        assert ok,label
        passed.append(label)
    def login(email):return req('/api/collections/users/auth-with-password',{'identity':email,'password':password})
    code,admin=req('/api/collections/_superusers/auth-with-password',{'identity':'admin@example.invalid','password':password})
    check(code==200,'bench admin authenticates')
    admin=admin['token']
    code,p=login('professional@example.invalid');check(code==200,'professional authenticates');p=p['token']
    code,q=login('other@example.invalid');check(code==200,'other professional authenticates');q=q['token']
    code,ordinary=login('ordinary@example.invalid');check(code==200,'existing participant login preserved');ordinary=ordinary['token']
    code,products=req('/api/collections/cer_products/records?filter=is_active%3Dtrue',token=admin)
    check(code==200 and products['items'],'active product fixture exists');product=products['items'][0]['id']
    endpoint='/backend/v1/cer/registration'
    check(req(endpoint,{'action':'create','productId':product})[0]==403,'anonymous cannot create professional link')
    check(req(endpoint,{'action':'create','productId':product},ordinary)[0]==403,'participant cannot create professional link')
    code,link=req(endpoint,{'action':'create','productId':product},p)
    check(code==200 and len(link.get('slug',''))==48,'professional creates scoped random link')
    check(req(endpoint,{'action':'create','productId':product},p)[1].get('id')==link['id'],'link creation retry is idempotent')
    check(req(endpoint,{'action':'revoke','id':link['id']},q)[0]==403,'another professional cannot revoke link')
    check(req(endpoint,{'action':'list'},q)[1]==[],'another professional cannot list link')
    check(req(endpoint,{'action':'info','slug':'invalid'})[0]==400,'invalid public link refused')
    code,info=req(endpoint,{'action':'info','slug':link['slug']})
    check(code==200 and set(info)=={'professionalName','productName'},'public link reveals only intended names')
    check(req('/api/collections/users/request-verification',{'email':'legacy@example.invalid'})[0]==204,'existing non-registration user retains native verification request')
    wait_mail('legacy@example.invalid')
    check(mail.exists(),'existing verification email produced asynchronously')
    check('confirmar-email#token=' not in mail.read_text(),'existing non-registration email template preserved')
    body={'action':'register','slug':link['slug'],'fullName':'Synthetic New Participant','email':'new@example.invalid','password':password,'passwordConfirm':password,'acceptLink':True,'website':'','role':'admin','verified':True,'professionalUserId':'forged'}
    check(req(endpoint,{**body,'acceptLink':False})[0]==400,'link association choice required')
    check(req(endpoint,{**body,'passwordConfirm':'different'})[0]==400,'password confirmation enforced')
    check(req(endpoint,{**body,'website':'spam'})[0]==400,'honeypot rejected')
    code,result=req(endpoint,body)
    assert code==200, 'Registration HTTP '+str(code)+' '+str(result)
    check(code==200 and result=={'next':'check_email'},'registration returns neither credential nor token')
    wait_mail('new@example.invalid')
    check(mail.exists(),'synthetic verification email generated and intercepted locally')
    check('https://cer-v1-1444e--preview.goskip.app/confirmar-email#token=' in mail.read_text(),'self-registration mail targets the served preview confirmation page')
    check('https://cer-v1-1444e.goskip.app' not in mail.read_text(),'self-registration mail does not link to unpublished production')
    check(login('new@example.invalid')[0]==403,'unverified account receives no auth token')
    def adminitems(col):
        status,result=req('/api/collections/'+col+'/records?perPage=200',token=admin)
        assert status==200,'Cannot inspect bench '+col
        return result['items']
    user=next(u for u in adminitems('users') if u['email']=='new@example.invalid')
    check(user['status']=='invited' and not user['verified'],'caller cannot forge active or verified status')
    check(not any(r['user_id']==user['id'] for r in adminitems('user_roles')),'no roles assigned before email confirmation')
    check(not any(r['person_id']==user['person_id'] for r in adminitems('enrollments')),'no enrollment before email confirmation')
    check(req(endpoint,body)[1]==result,'duplicate registration has generic response')
    check(len([u for u in adminitems('users') if u['email']=='new@example.invalid'])==1,'retry does not duplicate identity')
    tokens=re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',mail.read_text())
    check(bool(tokens),'verification message contains native verification token')
    check(req('/api/collections/users/confirm-verification',{'token':tokens[0]})[0]==204,'native email confirmation accepted')
    code,account=login('new@example.invalid')
    check(code==200 and account['record']['status']=='active','confirmed account activates on first login')
    token=account['token'];uid=account['record']['id']
    roles=[r for r in adminitems('user_roles') if r['user_id']==uid]
    check(len(roles)==1 and roles[0]['role']=='interagente','only participant role assigned despite forged input')
    enrollment=next(r for r in adminitems('enrollments') if r['person_id']==user['person_id'])
    accesses=[r for r in adminitems('professional_enrollment_access') if r['enrollment_id']==enrollment['id']]
    check(len(accesses)==1 and accesses[0]['is_active'],'one active professional link created')
    check(req('/api/collections/enrollments/records/'+enrollment['id'],token=token)[0]==200,'new participant reads own enrollment')
    check(req('/api/collections/enrollments/records/'+enrollment['id'],token=q)[0]==404,'other professional cannot read new enrollment')
    check(any(r['enrollment_id']==enrollment['id'] and r['current_stage']=='onboarding' for r in adminitems('journey_states')),'journey starts in onboarding')
    journey=next(r for r in adminitems('journey_states') if r['enrollment_id']==enrollment['id'])
    journey_path='/api/collections/journey_states/records/'+journey['id']
    check(req(journey_path,token=token)[0]==200,'new participant reads own initial journey')
    check(req(journey_path,{'current_stage':'consciousness'},token,method='PATCH')[0]>=400,'raw arbitrary journey editing stays blocked for participants')
    welcome_endpoint='/backend/v1/cer/onboarding/complete'
    welcome={'enrollment_id':enrollment['id']}
    check(req(welcome_endpoint,welcome)[0]>=400,'anonymous cannot complete welcome')
    check(req(welcome_endpoint,welcome,p)[0]>=400,'professional cannot complete welcome for participant')
    check(req(welcome_endpoint,welcome,q)[0]>=400,'unrelated professional cannot complete welcome')
    check(req(welcome_endpoint,welcome,ordinary)[0]>=400,'another participant cannot complete welcome')
    code,done=req(welcome_endpoint,{**welcome,'current_stage':'equilibrium_realization','user_id':'forged'},token)
    check(code==200 and done.get('completed') is True and done.get('current_stage')=='consciousness','participant completes only their own welcome without arbitrary stage input')
    resumed=login('new@example.invalid')[1]['token']
    code,reloaded=req(journey_path,token=resumed)
    check(code==200 and reloaded['metadata']['onboarding_completed'] and reloaded['current_stage']=='consciousness','welcome completion persists across fresh authentication')
    first_completed_at=reloaded['metadata']['onboarding_completed_at']
    check(req(welcome_endpoint,welcome,resumed)[0]==200 and req(journey_path,token=resumed)[1]['metadata']['onboarding_completed_at']==first_completed_at,'welcome retry is idempotent and keeps original completion date')
    code,professional_journey=req(journey_path,token=p)
    check(code==200 and professional_journey['current_stage']=='consciousness','linked professional reads actual welcome progress')
    check(req(journey_path,token=q)[0]>=400,'other professional cannot read welcome progress')
    code,prepared=req('/backend/v1/cer/questionnaires/prepare',{'enrollment_id':enrollment['id'],'experience_id':'exp-corpo-fisiologia-07b','prompt_id':'ayv_c1_p1_estrutura_corporal'},resumed)
    check(code==200 and prepared.get('prompt_id'),'first dimension prepares a real canonical question')
    response_body={'enrollment_id':enrollment['id'],'experience_id':prepared['experience_id'],'prompt_id':prepared['prompt_id'],'respondent_user_id':uid,'response_type':'ChoiceCards','access_class':'shared_care','structured_value':{'choice':'intermediate'},'free_text':'','prompt_version':1,'version':1,'status':'saved'}
    code,first_response=req('/api/collections/experience_responses/records',response_body,resumed)
    check(code==200,'first dimension partial answer saves without completing the chapter')
    response_path='/api/collections/experience_responses/records/'+first_response['id']
    resumed=login('new@example.invalid')[1]['token']
    code,answer=req(response_path,token=resumed)
    check(code==200 and answer['structured_value']['choice']=='intermediate','partial answer resumes with exact stored choice after new login')
    code,professional_answer=req(response_path,token=p)
    check(code==200 and professional_answer['structured_value']['choice']=='intermediate','linked professional sees exact shared partial answer')
    check(req(response_path,token=q)[0]>=400,'other professional cannot read partial answer')
    check(req(response_path,{'access_class':'participant_private'},resumed,method='PATCH')[0]==200,'participant can mark own answer private')
    check(req(response_path,token=p)[0]>=400,'linked professional cannot read private partial answer')
    check(req(response_path,token=resumed)[0]==200,'private partial answer remains available to its author')
    codes=['exp-corpo-fisiologia-07b','exp-mente-emocoes-07c','exp-regulacao-respostas-07c','exp-relacoes-07d','exp-sexualidade-07e','exp-sentido-conexao-07f']
    for experience in codes:
        status,prepared=req('/backend/v1/cer/questionnaires/prepare',{'enrollment_id':enrollment['id'],'experience_id':experience},token)
        check(status==200 and prepared['enrollment_experience']['release_status']=='available','new participant can begin '+experience)
    check(req('/backend/v1/cer/questionnaires/prepare',{'enrollment_id':enrollment['id'],'experience_id':codes[0]},q)[0]==403,'another professional cannot prepare the new participant journey')
    check(login('new@example.invalid')[0]==200,'subsequent login works')
    check(len([r for r in adminitems('enrollments') if r['person_id']==user['person_id']])==1,'subsequent login does not duplicate enrollment')
    oldpassword=body['password'];body['password']=body['passwordConfirm']='Different-password-123'
    check(req(endpoint,body)[1]==result and login('new@example.invalid')[0]==200,'existing account password and link are not changed by re-registration')
    for col in ['cer_registration_links','cer_registration_requests']:
        check(not req('/api/collections/'+col+'/records',token=token)[1].get('items'),'raw registration collections not exposed to participant')
    before_people=len(adminitems('persons'))
    check(req(endpoint,{**body,'email':'rollback@example.invalid'})[0]>=400,'pending-account transaction failure is reported')
    check(len(adminitems('persons'))==before_people and not any(u['email']=='rollback@example.invalid' for u in adminitems('users')),'failed pending-account creation rolls back person and user')
    failure={**body,'email':'activation-failure@example.invalid'}
    check(req(endpoint,failure)[0]==200,'activation rollback fixture created')
    wait_mail(failure['email'])
    tokens=re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',mail.read_text())
    check(req('/api/collections/users/confirm-verification',{'token':tokens[0]})[0]==204,'activation rollback fixture verified')
    failed_user=next(u for u in adminitems('users') if u['email']==failure['email'])
    status,_=req('/api/collections/users/auth-with-password',{'identity':failure['email'],'password':failure['password']})
    check(status>=400,'activation failure yields no token')
    check(not any(r['person_id']==failed_user['person_id'] for r in adminitems('enrollments')) and not any(r['user_id']==failed_user['id'] for r in adminitems('user_roles')),'failed activation rolls back enrollment and role')
    check(next(u for u in adminitems('users') if u['id']==failed_user['id'])['status']=='invited','failed activation preserves pending status')
    expected_pro=next(u for u in adminitems('users') if u['email']=='professional@example.invalid')['id']
    check(accesses[0]['professional_user_id']==expected_pro,'professional association comes from the link, never forged body')
    check(req('/api/collections/users/records',{'email':'raw@example.invalid','password':password,'passwordConfirm':password})[0]>=400,'raw public account creation remains blocked')
    pending={**body,'email':'revoked-pending@example.invalid'}
    check(req(endpoint,pending)[0]==200,'pending account created before revocation')
    wait_mail(pending['email'])
    pending_tokens=re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',mail.read_text())
    check(req(endpoint,{**body,'email':'mail-failure@example.invalid'})[0]==503,'mail transport failure is reported without claiming successful delivery')
    mail_user=next(u for u in adminitems('users') if u['email']=='mail-failure@example.invalid')
    check(mail_user['status']=='invited' and not mail_user['verified'],'mail failure preserves pending account for confirmation retry')
    existing_count=len(adminitems('cer_registration_requests'))
    for i in range(existing_count,30):
        status,u=req('/api/collections/users/records',{'email':f'quota-{i}@example.invalid','password':password,'passwordConfirm':password,'status':'invited'},admin)
        assert status==200,'Quota fixture user creation'
        status,_=req('/api/collections/cer_registration_requests/records',{'user_id':u['id'],'link_id':link['id'],'completed':False},admin)
        assert status==200,'Quota fixture request creation'
    check(req(endpoint,{**body,'email':'quota-blocked@example.invalid'})[0]==400,'daily per-link signup quota enforced')
    check(not any(u['email']=='quota-blocked@example.invalid' for u in adminitems('users')),'quota rejection creates no account')
    check(req(endpoint,{'action':'revoke','id':link['id']},p)[0]==200,'owner can deactivate link')
    check(req(endpoint,{**body,'email':'blocked@example.invalid'})[0]==400,'deactivated link refuses new accounts')
    check(login('new@example.invalid')[0]==200,'revocation preserves already activated account')
    check(req('/api/collections/users/confirm-verification',{'token':pending_tokens[0]})[0]==204,'email may be confirmed independently of link')
    check(req('/api/collections/users/auth-with-password',{'identity':pending['email'],'password':pending['password']})[0]==403,'revoked link blocks unfinished activation')
    quality='/backend/v1/cer/quality'
    check(req(quality,{'action':'mine'})[0] in (401,403),'quality rejects anonymous readers')
    check(req(quality,{'action':'inbox'},token)[0]==403,'participant cannot read professional feedback inbox')
    check(req(quality,{'action':'context'},token)[1][0]['id']==enrollment['id'],'feedback context derives own active enrollment')
    feedback={'action':'submit','enrollment_id':enrollment['id'],'category':'process','message':'SYNTHETIC feedback <script>alert(1)</script>','request_id':'synthetic-feedback-request-001','professional_id':'forged','status':'resolved','review_note':'forged'}
    check(req(quality,feedback,ordinary)[0]>=400,'other participant cannot submit for this enrollment')
    check(req(quality,feedback,p)[0]==403,'professional cannot impersonate participant feedback')
    check(req(quality,{**feedback,'message':'   '},token)[0]==400,'empty feedback rejected')
    check(req(quality,{**feedback,'message':'x'*3001},token)[0]==400,'oversize feedback rejected')
    check(req(quality,{**feedback,'category':'clinical-diagnosis'},token)[0]==400,'arbitrary feedback category rejected')
    code,stored=req(quality,feedback,token)
    check(code==200 and stored['status']=='new' and 'review_note' not in stored,'own feedback accepted with server status and private DTO')
    fid=stored['id']
    check(req(quality,feedback,token)[1].get('id')==fid,'repeated identical feedback is idempotent')
    check(req(quality,{**feedback,'message':'changed'},token)[0]==400,'idempotency key cannot silently replace original feedback')
    check(req(quality,{'action':'mine'},ordinary)[1]==[],'other participant cannot list feedback')
    check(req(quality,{'action':'inbox'},q)[1].get('items')==[],'unrelated professional cannot list feedback')
    code,inbox=req(quality,{'action':'inbox'},p)
    check(code==200 and inbox['items'][0]['id']==fid and inbox['items'][0]['enrollment_id']==enrollment['id'],'primary professional reads scoped feedback and follow-up link')
    review={'action':'review','id':fid,'status':'reviewing','note':'SYNTHETIC internal review'}
    check(req(quality,review,q)[0]==403,'unrelated professional cannot review feedback')
    check(req(quality,review,token)[0]==403,'participant cannot forge review status')
    check(req(quality,review,p)[1].get('status')=='reviewing','primary professional saves review')
    mine=req(quality,{'action':'mine'},token)[1]
    check(mine[0]['status']=='reviewing' and 'review_note' not in mine[0] and mine[0]['message']==feedback['message'],'participant sees original feedback and status without internal note')
    for collection in ['cer_pilot_feedback','cer_pilot_incidents','cer_pilot_weekly_audits']:
        check(req('/api/collections/'+collection+'/records',token=token)[0]>=400,'raw participant listing stays closed '+collection)
        check(req('/api/collections/'+collection+'/records',{'message':'forged'},token)[0]>=400,'raw participant writes stay closed '+collection)
    incident={'action':'incident','code':'onboarding_save','area':'journey','release':'pilot-quality-v1','enrollment_id':enrollment['id'],'message':'SECRET DO NOT STORE','stack':'SECRET','url':'https://example.invalid?token=SECRET','metadata':{'clinical':'SECRET'}}
    check(req(quality,incident,token)[1].get('accepted') is True,'own enumerated diagnostic accepted')
    rows=adminitems('cer_pilot_incidents')
    check(len(rows)==1 and 'SECRET' not in json.dumps(rows) and rows[0]['code']=='onboarding_save','diagnostic stores no arbitrary message URL stack or clinical metadata')
    check(req(quality,{**incident,'code':'SECRET'},token)[0]==400,'arbitrary diagnostic text refused')
    check(req(quality,incident,ordinary)[0]==403,'other participant cannot attach incident to enrollment')
    # Revoke the professional link only in this disposable database, then restore.
    access=accesses[0]
    path='/api/collections/professional_enrollment_access/records/'+access['id']
    check(req(path,{'is_active':False},admin,method='PATCH')[0]==200,'bench deactivates link for privacy regression')
    check(req(quality,{'action':'inbox'},p)[1].get('items')==[],'former professional loses feedback visibility')
    check(req(quality,review,p)[0]==403,'former professional loses feedback review permission')
    check(req(path,{'is_active':True},admin,method='PATCH')[0]==200,'bench restores link')
    # Backdate only synthetic records to previous local week; run the actual cron API.
    from datetime import datetime, timedelta, timezone
    local_now=datetime.now(timezone(timedelta(hours=-3)))
    current_monday=local_now.replace(hour=0,minute=0,second=0,microsecond=0)-timedelta(days=local_now.weekday())
    previous_start=current_monday-timedelta(days=7)
    inside=(previous_start+timedelta(hours=2)).astimezone(timezone.utc).isoformat().replace('+00:00','Z')
    import sqlite3
    with sqlite3.connect(data/'data.db') as fixture_db:
        for col,rid in [('cer_pilot_feedback',fid),('cer_pilot_incidents',rows[0]['id'])]:
            fixture_db.execute('UPDATE '+col+' SET created = ? WHERE id = ?', (inside.replace('T',' '),rid))
    check(adminitems('cer_pilot_feedback')[0]['created'].startswith(previous_start.strftime('%Y-%m-%d')),'bench backdates synthetic records for real weekly-window check')
    check(req(quality,{**feedback,'category':'app','message':'SYNTHETIC current week','request_id':'synthetic-current-week-001'},token)[0]==200,'current-week feedback fixture exists outside closed audit week')
    code,crons=req('/api/crons',token=admin)
    check(code==200 and any(c['id']=='cer_pilot_weekly_quality' and c['expression']=='0 11 * * 1' for c in crons),'weekly audit is registered for Monday 08h Brasilia')
    check(req('/api/crons/cer_pilot_weekly_quality',{},p)[0]==403,'professional cannot invoke superuser scheduler')
    check(req('/api/crons/cer_pilot_weekly_quality',{},admin)[0]==204,'actual weekly cron trigger accepted on bench')
    audits=[]
    for _ in range(50):
        audits=adminitems('cer_pilot_weekly_audits')
        if audits:break
        time.sleep(.1)
    check(len(audits)==1,'weekly cron creates one scoped audit')
    summary=audits[0]['summary']
    check(summary['process_feedback']==1 and summary['app_feedback']==0 and summary['incidents']==1 and summary['by_code']['onboarding_save']==1,'weekly audit counts actual feedback and sanitized incidents')
    check('SYNTHETIC' not in json.dumps(summary) and 'message' not in json.dumps(summary),'weekly automatic audit does not copy therapeutic text')
    check(req(quality,{'action':'audits'},q)[1]==[],'other professional cannot read audit')
    check(req(quality,{'action':'audits'},token)[0]==403,'participant cannot read professional audit')
    check(req(quality,{'action':'audits'},p)[1][0]['id']==audits[0]['id'],'professional sees own audit')
    check(req(quality,{'action':'acknowledge','id':audits[0]['id']},q)[0]==403,'other professional cannot acknowledge audit')
    check(req(quality,{'action':'acknowledge','id':audits[0]['id']},p)[1].get('reviewed') is True,'professional acknowledges audit without changing clinical data')
    check(req('/api/crons/cer_pilot_weekly_quality',{},admin)[0]==204,'weekly cron may be retried')
    time.sleep(.3)
    check(len(adminitems('cer_pilot_weekly_audits'))==1,'weekly retry does not duplicate audit')
    for i in range(9):
        check(req(quality,{**feedback,'request_id':'synthetic-quota-request-'+str(i)},token)[0]==200,'feedback quota accepts allowed item '+str(i))
    check(req(quality,{**feedback,'request_id':'synthetic-quota-request-overflow'},token)[0]==400,'feedback daily quota enforced')
    for i in range(30):
        check(req(quality,incident,token)[1].get('accepted') is True,'incident quota accepts allowed item '+str(i))
    check(req(quality,incident,token)[1].get('accepted') is False,'incident quota stops additional collection')
    check(req(quality,feedback,token)[1].get('id')==fid,'feedback idempotency survives quota saturation')
    success=True
    print(json.dumps({'version':version,'passed':len(passed),'checks':passed,'scope':'disposable loopback; synthetic mail intercepted; no live deployment or mailbox delivery certified'},ensure_ascii=False))
finally:
    if proc:
        proc.terminate();proc.wait(timeout=10)
    if 'logs' in locals():
        logs.flush();logs.seek(0)
        lines=logs.readlines()
        errors=[line.strip() for line in lines if any(k in line.lower() for k in ['error', 'message', 'reference', 'typeerror']) and not any(k in line.lower() for k in ['password','token','authorization'])]
        if not success and errors:print('Bench error details:', '\n'.join(errors[-12:]))
        logs.close()
    shutil.rmtree(root,ignore_errors=True)
