# Mandala CER — Meu ciclo, meu ritmo

Implementação preparada em `codex/mandala-ciclo-lua`, baseada na main `72a1f5f4298827535574c7daf903fe9f56e75805`.

## Comportamento

- Mandala radial por mês ou ciclo atual (quando há início menstrual registrado), sem impor 28 dias. Datas podem ser abertas por teclado ou pelo seletor de dia.
- Registro de energia, até duas emoções, sintomas/intensidade, apetite, impacto, fluxo/início da menstruação, sono, contexto, reflexão, necessidade, cuidado e resposta ao cuidado. Campos opcionais; edição, exclusão e salvar para continuar depois.
- Energia e emoções separadas. Cada emoção tem cor própria; duas emoções dividem a faixa. Ausência de registro não equivale a sem desconforto.
- Cálculo lunar local aproximado ao meio-dia, baseado nas principais correções de lua nova de Meeus (Astronomical Algorithms, cap. 49). Fases intermediárias interpoladas entre luas novas; não é efeméride de precisão. A lua não determina fases ovarianas ou cuidados.
- Convites simbólicos opcionais, abertos após a observação. Nenhuma regra de sincronização lunar/social, pontuação de conexão ou classificação automática de doshas.
- Perfis para ciclos espontâneos, irregulares/desconhecidos, contracepção hormonal, perimenopausa, pós-menopausa, gestação e pós-parto/amamentação. Preferências privadas. Estimativas apenas para ciclos espontâneos com duração habitual informada; referência de 14 dias de fase lútea não confirma ovulação, não extrapola ciclos vencidos e não tem finalidade contraceptiva.
- Diário privado por padrão. Compartilhamento por dia, revogável ao editar. A profissional vinculada lê somente dias compartilhados. Não há escrita profissional no diário.
- Cuidado escolhido pode ser copiado ao plano pessoal existente, privado, com horário opcional que o leva ao Planner. Biblioteca preserva recursos existentes e acrescenta escuta do ciclo e conexão com a natureza.
- Lembrete do Planner depende de adesão; não remarca compromissos. Menciona menstruação registrada ou proximidade estimada quando aplicável.
- A antiga MandalaStructuredView permanece em Evolução → Cuidado em movimento, preservando dados e serviço originais.

## Persistência e instalação

Novas coleções: `cer_cycle_profiles` e `cer_cycle_entries`. Migração aditiva `0081_create_cycle_journal.js`, sem modificar registros anteriores. Índices únicos por matrícula e por matrícula/dia. Regras exigem conta ativa, propriedade para escrita e vínculo profissional ativo + papel profissional + compartilhamento explícito para leitura profissional. Matrícula/data não podem ser trocadas na edição. Hook valida calendário e coerência entre fluxo e início menstrual.

Aplicar a migração e o hook no ambiente de prévia antes da validação autenticada com contas reais. Não substituir persistência remota por localStorage em contas reais; localStorage só é utilizado pelo modo demonstrativo já existente.

Preservar `src/lib/pocketbase/client.ts` (blob canônico `5d859ae11e9bd1c266bd62395547a187da7d41c1`) e as duas referências de `src/vite-env.d.ts`. Não publicar produção nesta etapa nem apagar registros demo existentes.

## Validação

- TypeScript app e build Vite aprovados.
- 376 testes de regressão em 46 arquivos aprovados; após os últimos ajustes, 11 testes da nova mandala aprovados. Testes direcionados de cuidado, Planner e antiga Mandala também passaram (33 testes em 6 arquivos na rodada anterior).
- `scripts/verify-authenticated-backend.py` estendido para testar as regras por REST em PocketBase descartável de referência: privacidade, compartilhamento, retirada, vínculo revogado, suspensão, imutabilidade, duplicidade, datas e exclusão pela titular.
- 107 cenários autenticados aprovados em cada runtime de referência: PocketBase 0.26.1 e 0.36.0.
- Os testes de referência não são homologação do backend hospedado do Skip. Inspeção de navegador na prévia ainda depende da instalação autorizada.

## Fundamentação editorial

https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle
https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome
https://pubmed.ncbi.nlm.nih.gov/38598621/
https://pubmed.ncbi.nlm.nih.gov/38206269/
https://pubmed.ncbi.nlm.nih.gov/33571128/
https://pubmed.ncbi.nlm.nih.gov/40991714/
https://pubmed.ncbi.nlm.nih.gov/26181612/

O método de acompanhamento CER proposto não foi apresentado como instrumento diagnóstico validado. A leitura tradicional de Prakriti/Vikriti requer avaliação profissional e não foi usada para prever emoções ou hormônios.

## Estado de entrega

Código local pronto. Publicação no repositório público e instalação na prévia pendentes: a revisão automática bloqueou o envio por exigir autorização explícita para essa exposição. Nenhuma alteração deste bloco foi instalada no Skip; nenhuma migração foi aplicada ao backend hospedado. Não há PR aberto para esta alteração.
