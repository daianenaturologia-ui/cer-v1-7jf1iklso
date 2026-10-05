# Desenvolvimento educativo autônomo — 05/10/2026

Autorização de Daiane: o app deve facilitar o acompanhamento e não depender de sua aprovação para introduzir cada etapa. Este bloco implementa escolha, planejamento, execução e revisão de recursos educativos sem plano clínico, prioridade, ciclo, convite, aprovação ou liberação individual. Direções futuras aprofundadas continuam construídas em conjunto; os passos educativos podem ser planejados pela pessoa na Evolução. Nenhum questionário ou registro anterior é reiniciado.

## Experiência

Oito recursos educativos completos de autoconhecimento, foco, rotina, limites, apoios, sentido, realização e retomada. Cada recurso contém ensinamento, instruções, tempo aproximado, alternativa para dia difícil e pergunta de reflexão. Conteúdo sem diagnóstico, tratamento ou promessa de eficácia. A pessoa escolhe o recurso, desejo, ação, situação possível, horário opcional, alternativa e sinal descritivo de mudança. Os campos contextualizam disposição, concentração, compromissos e recursos sem repetir as seis dimensões.

O passo é planejado na Evolução, fica disponível no Planner e pode ser iniciado, pausado, retomado e registrado como experimentado. A revisão fica aberta na Evolução, sem convite da profissional, inclusive para uma tentativa interrompida. Uma nova tentativa preserva o aprendizado anterior. Mandala mostra os aprendizados existentes com origem identificada; não gera síntese clínica ou novo questionário.

Registros são privados por padrão. Compartilhar inclui os campos do passo e seus aprendizados; outros relatos privados da Linha da Vida não são copiados. A profissional lê somente os passos compartilhados em Evolução e Planner. Pode ampliar o acervo educativo publicando uma vez; cada pessoa pode escolher sem liberações individuais. Rascunhos não são exibidos às pessoas. Versões publicadas são preservadas e podem ser retiradas do acervo sem apagar conteúdo de tentativas antigas. A biblioteca clínica e suas checagens individuais permanecem para técnicas que exigem avaliação.

Ativar plano individual agora informa explicitamente que a prévia/compartilhamento ainda são necessários nesse percurso, enquanto os recursos educativos já estão disponíveis. Estados vazios diferenciam ausência de prática clínica de disponibilidade de desenvolvimento educativo. Atalhos para /?etapa=evolucao abrem a etapa correta.

## Persistência e autorização

Migração 0072 adiciona cer_development_experiments e cer_development_resources, sem alterar tabelas clínicas. Conta ativa dona da matrícula cria/edita seus passos; acesso profissional ativo lê apenas compartilhados. Matrícula, origem e conteúdo da tentativa são preservados. Revisão concluída só permite mudanças de privacidade, sem reescrever aprendizado. Futuro vinculado deve pertencer à mesma matrícula. Hooks verificam autoria e papel profissional para edição do acervo. Conteúdo publicado só pode ser retirado, ou copiado para novo rascunho.

Demonstração usa armazenamento próprio separado dos questionários e do plano clínico, com restrições de persona/matrícula e sem backend. Contas reais usam PocketBase, sem fallback silencioso para armazenamento local. Acervo inicial embutido permanece disponível quando os recursos adicionais não podem ser carregados; falhas de persistência são informadas e conservam textos abertos.

Base remota 4bb5f88085413cfd710d8eabfc6c155d09bb57b8. Diferenças remotas de formatação em cinco arquivos foram reconciliadas integralmente e os hashes conferidos antes das alterações. Nenhum arquivo truncado foi usado como fonte.

## Verificação

17 testes novos isolados: percurso autônomo, privacidade/compartilhamento/revogação, autoria, origem de outra pessoa, persistência, histórico, erro de armazenamento, catálogo/publicação/retirada, interface completa Evolução–Planner–revisão, visão profissional, hooks/regras simulados, página completa do Planner e resolução da matrícula pela pessoa da conta autenticada. A conferência visual detectou que getActiveForUser ainda usava person_id.user_account_id (campo inexistente) e não tratava demonstração; corrigido para users.person_id e matrícula ativa/onboarding, com erro visível e sem consultas reais na demo. O acervo fecha após salvar para destacar o próximo passo. TypeScript e build Vite verificados; baterias antigas não executadas. Testes de hooks simulados não equivalem a homologação em servidor autenticado. Conferência da migração instalada e preview deve ser registrada ao concluir a publicação. Cursos/turmas e protocolos clínicos reais não são parte deste bloco.

As duas novas coleções foram observadas no painel Skip Cloud após sincronizar a implementação bbe33774716c291caf5fdc3b1dc582cc1d013578. Esse sinal confirma instalação do esquema, sem comprovar sozinho autorização ou salvamento em sessão real.

O gatilho on_self_development também foi observado instalado em APIs e Gatilhos. A Biblioteca profissional em demonstração mostra o editor educativo e não tenta carregar o catálogo clínico do backend real.

## Publicação e conferência visual

Implementação publicada em main no commit bbe33774716c291caf5fdc3b1dc582cc1d013578 (21 blobs conferidos); correção de matrícula e projeção privada no commit 82b1544a13a1680fa6f108faf808aab4c13447cb (12 blobs conferidos). Sem forçar histórico. Skip sincronizado e versão 0.0.237 observada antes do ajuste final de acesso ao editor pelo menu Biblioteca de Práticas.

Percurso completo conferido em uma sessão fictícia separada: escolher recurso O trabalho tem hora de acabar, planejar passo privado, recarregar e encontrá-lo no Planner, registrar tentativa, abrir Evolução pelo atalho, registrar aprendizado sem convite, ler aprendizado na Mandala, conferir ausência na visão profissional, compartilhar voluntariamente e conferir leitura profissional. Nenhum questionário foi resetado/semeado. Registro de prova identificado como Conferência fictícia; o preenchimento da Mariana no navegador da usuária continua para seus testes. Editor educativo acessível também no menu Biblioteca de Práticas do painel profissional, além da rota dedicada. Persistência e autorização com conta real continuam pendentes de homologação; a instalação do esquema/gatilho não substitui essa verificação.

Imagem da entrega: cer-desenvolvimento-autonomo.jpg.
