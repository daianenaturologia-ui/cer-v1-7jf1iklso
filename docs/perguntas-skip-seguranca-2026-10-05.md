# Perguntas para viabilizar o CER com dados sensíveis

Roteiro preparado para a proprietária revisar. Não enviado ao suporte. Não anexar prontuários, senhas, tokens nem dados de interagentes.

1. Qual procedimento permite criar uma homologação isolada do CER, com as mesmas regras e hooks, mas apenas dados fictícios? Como verificar a versão e a compatibilidade do runtime antes de aplicar migrações?
2. Qual é o contrato de tratamento de dados aplicável, quais subprocessadores recebem dados e qual mecanismo cobre transferência internacional? O serviço admite o uso pretendido com dados de saúde e registros terapêuticos?
3. Como solicitar backup completo protegido, incluindo banco, arquivos, regras, hooks e autenticação? Quais itens não são exportáveis? Como restaurar uma cópia em ambiente independente preservando identidades e acessos?
4. Qual a frequência e retenção dos backups, tempo esperado de recuperação e perda máxima de dados? É possível realizar um teste documentado de restauração em homologação?
5. Como funcionam MFA, acesso administrativo, registro de acesso privilegiado, resposta a incidentes e comunicação à controladora? Qual prazo e canal de suporte para incidente de segurança?
6. Para Micro-Agents: quais provedores/modelos estão por trás de Fast e Reasoning? Qual custo por inferência, limites de consumo, armazenamento de memória/conversas, retenção, exclusão e uso para treinamento? É possível processamento sem histórico persistente e sem ferramentas com acesso global ao banco?
7. Como garantir isolamento por usuário e sessão em um agente compartilhado pelo projeto? Como testar isso com contas fictícias antes da ativação? Existe contrato específico para a IA?
8. O que acontece com hospedagem, banco, arquivos, login e IA após cancelamento da assinatura? Existe prazo para exportação, política de exclusão, custo de manutenção separado e direito contratual de continuar operando o código fora da plataforma?

As respostas devem distinguir condições técnicas atuais de compromissos contratuais. Publicidade de exportação de código e backups operacionais não substitui uma restauração comprovada do CER nem contrato de processamento.
