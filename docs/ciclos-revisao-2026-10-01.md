# Continuidade: ciclos e revisão compartilhada

Implementados nesta etapa: operação profissional dos ciclos em Equilíbrio & Realização > Ciclos de cuidado; demonstração persistida dentro do estado existente, sem substituir questionários; convite separado da revisão clínica; formulário da interagente apenas para sua percepção; retorno com autoria preservada e leitura pela profissional; conexão dos convites ao início e ao Planner. Encerrar/revisar permanecem ações distintas e não há duração padrão.

A coleção cer_cycle_invitations contém exclusivamente mensagem compartilhada e retorno da interagente. A coleção cer_cycle_reviews mantém suas permissões profissionais originais. Regras e hooks protegem matrícula/ciclo/autor do convite e impedem escrever na voz da interagente. A criação identifica a conta por person_id da matrícula; não supõe que enrollments contém participant_user_id. Conta ausente ou ambígua bloqueia o convite.

O Planner profissional passou a ler registros da demonstração, e a visão da interagente não expande registros internos. A criação/projeção de práticas no demo continua bloqueada até que atribuição, checagem de segurança e consentimento estejam ligados. Não há itens inventados nem rede para os novos fluxos de ciclos/revisão demo.

Verificações específicas novas: 6 casos de serviços demo, 2 casos da interface da interagente, 3 casos de hooks server-side em ambiente simulado; compilação TypeScript do projeto app e build Vite. A bateria antiga não foi executada. Hooks simulados não substituem teste integrado de autorização contra PocketBase; realizar antes de piloto real.

Próximo trabalho: biblioteca/atribuição/aceite de experimentos na demonstração com os gates clínicos existentes; projeção do Planner e respostas operacionais; integração desses registros na Mandala. Depois, grande teste fictício em ambos os perfis. Refinamentos de doshas e fluxo de cursos permanecem adiados.

Publicação confirmada: commit 16435ee0f578044c998ed2a7967044a61ab15acd enviado à main; sincronização acionada no builder e merge 7d9bddc9f664fd7015b1f08f7df26ca62eb0b7b7 observado. Preview atualizado mostra a aba Ciclos de cuidado e o formulário profissional. Os blobs do workspace, início da interagente, demoAdapter, manager e migração coincidem com os arquivos publicados. Conferência visual não criou ciclo/convite nem alterou respostas existentes. O banco real não foi exercitado nesta etapa. Prova visual: cer-ciclos.jpg.
