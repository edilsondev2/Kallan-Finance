# Segurança do Kallan Finance — checklist de lançamento

## O que o código já faz
- Toda função de servidor exige login e valida o token no servidor; dados são filtrados por dono e protegidos por RLS no banco.
- Linhas importadas (`source = open_finance`) só são escritas pelo servidor (service role). Usuários só criam linhas `manual`.
- Credenciais da Malvo ficam só em segredos do servidor; o navegador nunca as vê.
- Entradas validadas com zod; ID de conexão precisa ser UUID; retorno do widget só para o próprio domínio.
- Limite de tentativas (por instância) nas funções do Open Finance que chamam a Malvo.
- Respostas de funções de servidor com `cache-control: no-store`.
- Cabeçalhos: nosniff, HSTS, referrer-policy, permissions-policy, COOP, e CSP de `frame-ancestors`/`object-src`/`base-uri`/`form-action`.

## Antes de abrir para o público (ações no painel, não no código)
1. **Remova o segredo `OPEN_FINANCE_SANDBOX`** do ambiente de produção. Com ele ligado, o app aceita conexões de teste.
2. Peça à Malvo a habilitação de produção e troque as credenciais para as de produção (segredos do Lovable).
3. No Supabase/Lovable Cloud Auth: ative confirmação de e-mail, proteção contra senhas vazadas, limite de tentativas de login e CAPTCHA no cadastro; defina um tamanho mínimo de senha de 10+.
4. Revise a URL do site e as URLs de redirecionamento permitidas no Auth (apenas o domínio de produção).
5. Gire qualquer segredo que já tenha sido colado em chat, print ou repositório.
6. Ative backups do banco e alertas de erro.
7. Considere uma CSP completa (scripts, conexões) depois de testar em modo "somente relatório" com a Malvo, o Supabase e as fontes.

## Pendências conhecidas
- O limite de tentativas é em memória por instância; um limite global precisa de armazenamento compartilhado.
- Sem CSP de scripts/conexões ainda (risco de quebrar widget/analytics se escrita sem teste).
