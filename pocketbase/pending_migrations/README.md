# Migrações de segurança pendentes

Arquivos preservados do commit73ca614. Eles ainda não foram aplicados ao backend ativo. No deploy do bloco8, o runtime exigiu usar o ordinal0074 para criar cer_resource_exercises. Estes quatro arquivos foram retirados do diretório executável para evitar aplicação fora do escopo autorizado.

Antes da próxima implantação de segurança, revisar o estado ativo e renumerar estes arquivos sequencialmente a partir do próximo ordinal livre. Não copiar automaticamente ao diretório migrations nem recriar a coleção do exercício.
