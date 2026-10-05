import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
const code=readFileSync('pocketbase/hooks/on_session_map_update.js','utf8')
const entry={sessionId:'s',sessionDate:'2026-10-05',summary:'Síntese humana para revisão',preparedBy:'professional',preparedAt:'2026-10-05'}
function handlers() {
  const result: ((e:any)=>void)[]=[]
  vm.runInNewContext(code,{onRecordCreateRequest:(fn:any)=>result.push(fn),onRecordUpdateRequest:(fn:any)=>result.push(fn),BadRequestError:Error})
  return result
}
function event(overrides: any={}) {
  let passed=false
  const summary=overrides.summary || [entry]
  return {get passed(){return passed},record:{getString:(key:string)=>key==='reading_snapshot'?JSON.stringify({sessionUpdates:summary}):'mine',original:()=>({getString:()=>''})},app:{findRecordById:(_collection:string,_id:string)=>({getString:(key:string)=>({enrollment_id:'mine',status:'completed',professional_user_id:'professional',...overrides.source} as any)[key]})},requestInfo:()=>({auth:{id:overrides.actor || 'professional'}}),next:()=>{passed=true}}
}
describe('Guarda servidor das sínteses de encontro',()=>{
  it('aceita formulação profissional no mesmo acompanhamento',()=>{
    for(const handle of handlers()){const e=event();handle(e);expect(e.passed).toBe(true)}
  })
  it('recusa outra matrícula, autor falsificado e encontro cancelado',()=>{
    for(const handle of handlers())for(const override of [{source:{enrollment_id:'other'}},{actor:'other'},{source:{status:'cancelled'}}])expect(()=>handle(event(override))).toThrow()
  })
  it('recusa duplicidade, texto acima do limite e estrutura inválida',()=>{
    for(const handle of handlers())for(const summary of [[entry,entry],[{...entry,summary:'x'.repeat(8001)}],[{...entry,sessionDate:'invalid'}],[{...entry,summary:''}]])expect(()=>handle(event({summary}))).toThrow()
  })
})
