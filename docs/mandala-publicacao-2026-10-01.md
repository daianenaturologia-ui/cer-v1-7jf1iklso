# Mandala: publicação do bloco validado

Usuária autorizou explicitamente enviar as alterações ao GitHub daianenaturologia-ui/cer-v1-7jf1iklso e sincronizar o projeto CER V1 no Skip, incluindo preview, após o bloqueio de aprovação da execução anterior.

O commit local f947381 já continha cinco arquivos e dez testes específicos relatados como aprovados junto da compilação. Estes testes não foram repetidos nesta publicação. A main remota era 1351092; os três arquivos de código tinham os mesmos blobs da base local, permitindo publicação seletiva sem substituir alterações de outras etapas. Commit de publicação: d25a1b4.

A sincronização foi executada no builder 45c9a80b-ca48-4f2a-8654-6ef660d8d25f. Confirmados visualmente no preview: Mandala de Mariana em Equilíbrio & Realização e Mandala profissional em workspace > Equilíbrio & Realização > Mandala. A mensagem de projeção profissional indisponível foi removida. O demo usa registros existentes, sem ativar fixture QA nem consultar o servidor para a projeção da Mandala; conteúdo interno do plano não alimenta a devolutiva da participante. Sem planos/experimentos próprios, a apresentação permanece vazia de forma explícita.

O bloco publicado não conclui Equilíbrio & Realização V1. Próximas lacunas observadas no código:

- ProfessionalPlannerView força lista vazia no demo; cerPlannerService não tem adaptação de demonstração e utiliza PocketBase.
- Ciclos de cuidado têm serviços de lifecycle, mas sua operação na demonstração e acesso na interface precisam ser ligados.
- CycleReviewView recebe isProfessional, porém ainda desenha ações de decisão e síntese profissional para ambos os perfis. As regras da coleção cer_cycle_reviews permitem somente acesso profissional; não ampliar a leitura dos registros internos para viabilizar convite. O retorno da interagente precisa de fluxo separado com privacidade e autoria preservadas.
- Mandala demo ainda não projeta experimentos, respostas operacionais ou ciclos: essas listas vazias são pendências explícitas, não ausência comprovada no servidor real.

Não declarar aplicativo completo nem iniciar teste com dados reais a partir desta publicação. A sequência combinada permanece: concluir implementação de Equilíbrio & Realização; grande teste fictício pela usuária em ambos os perfis; correções; piloto individual e nova rodada; expansão posterior. O fluxo para cursos e refinamentos dos doshas permanecem adiados conforme combinado.
