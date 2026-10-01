# Continuidade de experimentos entre ciclos — demonstração

A Biblioteca permite “Continuar em novo ciclo” para experimentos concluídos ou interrompidos apenas pelo encerramento de um ciclo. A origem precisa estar em ciclo fechado e o destino em ciclo posterior ativo, com plano ativo e prioridade apresentada e aceita atualmente. Interrupção por decisão própria não é reativada por continuidade.

A profissional confere novamente título, orientações, ritmo e checagem humana explícita. A proposta criada é draft, com previous_assignment_id e novo safety_check_id. Não transporta capacidade, consentimento da proposta ou momentos do Planner. O consentimento vigente da versão não basta para este novo convite: Mariana confirma a proposta e informa novamente a capacidade. Alteração material no mesmo ciclo também exige a confirmação do novo convite. A origem mantém seu status e registros; não vira superseded por mudança de ciclo. Uma proposta disponível da mesma origem no destino impede duplicação.

O serviço carryForwardToNewCycle aceita na demonstração apenas revisão explícita por Daiane. O comportamento do servidor real não foi alterado nem homologado nesta etapa. Os DTOs da interagente incluem somente referências seguras de proveniência e consentimento, sem racional ou contexto internos.

Verificação: quatro novos testes focados em continuidade, TypeScript do app e build Vite. Onze testes anteriores desse arquivo foram explicitamente pulados. O teste prévio de adaptação foi ajustado à nova exigência de confirmar o convite, sem executar a bateria antiga. Questionários não foram alterados nem semeados.

## Entrega e ponto de retomada

Commit local fcf98aa; implementação publicada d844f311026f23b9c4cba972641f849e8bb92e67; integração main 778aca00f8e3a089dbcdda00bae035f0c6ddc7f2. Os quatro arquivos de implementação/teste na integração correspondem exatamente aos blobs locais. Após segunda sincronização, o preview público mostrou a nova orientação de continuidade na biblioteca. A captura preservada é cer-continuidade.jpg (libfile_e4336f2fe3ec819193b03be298395c1c). O navegador de verificação não contém plano ativo; não foram semeados registros para produzir uma demonstração visual completa. A sequência de continuidade está coberta pelos quatro testes novos, e a interface publicada foi conferida em https://cer-v1-1444e--preview.goskip.app/profissional/participantes/demo-enr-01?tab=equilibrio&tool=biblioteca .

Pendência de validação: teste completo da usuária na demonstração e autorização/checagem/consentimento em backend real antes do piloto. Acervo clínico real e editor completo não foram implementados neste bloco. Não repetir testes antigos em uma retomada sem mudanças/falhas que justifiquem.
