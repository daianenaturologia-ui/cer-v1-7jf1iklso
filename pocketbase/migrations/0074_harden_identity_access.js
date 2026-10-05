// Security review: no global directory of people; invitation-only user creation.
// Test against the target server's rule parser before applying to a live database.
migrate((app) => {
  const role = '( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") )'
  const active = '@request.auth.id != "" && @request.auth.status = "active"'
  const owner = 'id = @request.auth.person_id'
  const scoped = '(@collection.enrollments:scope.person_id ?= id && @collection.professional_enrollment_access:access.enrollment_id ?= @collection.enrollments:scope.id && @collection.professional_enrollment_access:access.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:access.is_active ?= true)'
  const persons = app.findCollectionByNameOrId('persons')
  persons.listRule = `${active} && (${owner} || (${role} && ${scoped}))`
  persons.viewRule = persons.listRule
  persons.updateRule = `${persons.listRule} && @request.body.email:changed = false`
  persons.createRule = `${active} && ${role}`
  persons.deleteRule = null
  app.save(persons)
  const users = app.findCollectionByNameOrId('users')
  users.createRule = `${active} && ${role} && @request.body.status = "invited" && @request.body.person_id:isset = true && @request.body.person_id != ""`
  app.save(users)
}, (_app) => {
  // Do not silently restore global person access or public registration on rollback.
  throw new Error('Reversão de permissões de identidade exige migração revisada; não restaurar acesso amplo automaticamente.')
})
