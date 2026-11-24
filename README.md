# Kallan Finance

# KALLAN FINANCE — ESPECIFICAÇÃO COMPLETA DO PRODUTO

## Construção de uma nova plataforma de gestão e inteligência financeira

Quero desenvolver do zero um aplicativo chamado **KALLAN FINANCE**.

Este é um projeto inteiramente novo. 

Crie uma nova aplicação, com sua própria estrutura de código, banco de dados, autenticação, componentes, identidade visual e arquitetura.

O Kallan Finance deve nascer como um produto independente, preparado para crescer e receber novas funcionalidades.

---

# 1. VISÃO DO PRODUTO

O Kallan Finance será uma plataforma de gestão e inteligência financeira, direcionada principalmente a pessoas físicas, mas com uma área específica para pequenos empreendedores.

O objetivo é reunir, em um só aplicativo, informações financeiras de diferentes instituições, ajudar as pessoas a compreender seus gastos, organizar seus objetivos e melhorar sua relação com o dinheiro.

O produto também deverá oferecer ferramentas de gestão para pequenos negócios e um ambiente de conexão entre empreendedores.

Não quero criar somente um aplicativo que mostra saldos e extratos.

Quero criar uma experiência em que o usuário consiga:

- Visualizar sua situação financeira em um único lugar.
- Consultar informações de diferentes bancos.
- Entender quanto ganha e quanto gasta.
- Identificar despesas que passam despercebidas.
- Receber diagnósticos financeiros personalizados.
- Criar metas e acompanhar sua evolução.
- Conversar com uma inteligência artificial financeira.
- Organizar as finanças do próprio negócio.
- Conhecer outros empreendedores.
- Encontrar oportunidades e conteúdos relevantes.

**Posicionamento da marca:**

KALLAN FINANCE

"Seu dinheiro. Seu negócio. Seu próximo passo."

O aplicativo deve transmitir confiança, inteligência, modernidade, crescimento e independência.

## Regra fundamental do modelo de negócio

O Kallan Finance NÃO será uma instituição financeira, carteira digital ou banco digital.

Não deverá custodiar, receber, guardar ou movimentar dinheiro de clientes.

Não implementar:

- Pix.
- Transferências.
- Pagamentos.
- Saques.
- Depósitos.
- Empréstimos próprios.
- Armazenamento de dinheiro de usuários.

O Open Finance será utilizado exclusivamente para leitura, consolidação e análise de informações, conforme os consentimentos autorizados pelos usuários e as permissões efetivamente oferecidas pelo provedor.

O produto deve funcionar como uma plataforma independente de inteligência financeira.

---

# 2. DIREÇÃO DE DESIGN E IDENTIDADE VISUAL

Esta parte é extremamente importante.

Não quero um dashboard genérico, um painel administrativo ou uma interface financeira convencional.

Quero um aplicativo visualmente sofisticado, moderno, tecnológico e memorável.

A experiência deve fazer o usuário ter vontade de abrir o aplicativo, explorar as informações e retornar frequentemente.

Estude a composição, o posicionamento dos cartões, a profundidade, as cores, a tipografia e a organização dessas referências.

Reconstrua essa experiência em componentes reais, utilizando a identidade do Kallan Finance.

 coloque as imagens como fundos, imagens de pessoas reais para que chame atencao, ou telas estáticas. Os elementos deverão ser construídos individualmente e ser funcionais.

## Paleta de cores

Estabelecer os seguintes tokens visuais:

- Fundo principal: preto profundo, próximo de #070A08.
- Superfícies principais: grafite, próximo de #111713.
- Superfícies secundárias: #19231D.
- Verde esmeralda principal: #00C878.
- Verde vibrante para destaques: #32E58C.
- Verde suave para indicadores positivos.
- Vermelho para alertas e valores negativos.
- Branco para textos principais.
- Cinza para informações auxiliares.

Utilizar gradientes verdes de maneira pontual e elegante.

Evitar transformar todas as telas em superfícies verdes.

O contraste entre preto, grafite e verde deve ser a característica reconhecível da marca.

## Tipografia

Utilizar uma tipografia moderna, limpa e altamente legível.

Priorizar uma família como Inter ou equivalente.

Valores financeiros deverão ter boa hierarquia visual e alinhamento.

## Componentes

Criar um sistema visual próprio, contendo:

- Botões.
- Cartões.
- Campos de pesquisa.
- Campos de formulário.
- Modais.
- Menus.
- Navegação.
- Gráficos.
- Indicadores.
- Etiquetas de status.
- Avatares.
- Cards informativos.
- Estados vazios.
- Estados de carregamento.
- Estados de erro.

Todos os componentes devem compartilhar o mesmo padrão visual.

## Animações e microinterações

Implementar:

- Entrada suave de cartões.
- Transições entre telas.
- Gráficos com animação.
- Indicadores de progresso.
- Feedback nos botões.
- Animações de carregamento.
- Transições de expansão de cartões.
- Interações de toque.
- Estados visuais de seleção.

As animações devem ser rápidas, fluidas e elegantes.

Adicionar suporte a preferências de movimento reduzido.

---

# 3. ARQUITETURA DA APLICAÇÃO

Construir uma aplicação web responsiva, preparada para funcionar como PWA.

Priorizar uma experiência mobile-first, mantendo uma versão desktop igualmente bem projetada.

Utilizar uma arquitetura modular e organizada.

### Backend e infraestrutura

Utilizar Lovable Cloud, caso esteja disponível e seja adequado ao projeto, para autenticação, banco de dados, armazenamento e funções de backend.

Caso seja necessário utilizar Supabase, estruturar a integração de maneira consistente, com banco de dados, autenticação, políticas de segurança e funções de backend.

Não criar múltiplos backends desnecessários.

### Estrutura técnica

Organizar o projeto em módulos:

- Autenticação.
- Usuários e perfis.
- Open Finance.
- Contas e movimentações.
- Inteligência artificial.
- Metas.
- Negócios.
- Comunidade.
- Notificações.
- Configurações.

Manter separação clara entre interface, regras de negócio, acesso a dados e integrações externas.

Não concentrar toda a aplicação em componentes gigantescos.

Utilizar componentes reutilizáveis e tipagem adequada.

---

# 4. EXPERIÊNCIA DE CADASTRO E PRIMEIRO ACESSO

Criar uma experiência de entrada sofisticada.

## Tela de boas-vindas

Apresentar a marca Kallan Finance e uma mensagem de posicionamento.

Texto sugerido:

"Todas as suas finanças. Uma nova forma de entender seu dinheiro."

Apresentar brevemente os principais benefícios:

- Organize suas finanças.
- Entenda seus gastos.
- Acompanhe seus objetivos.
- Faça seu negócio crescer.

Criar botões para entrar e criar conta.

## Cadastro

Implementar autenticação real.

Permitir cadastro por e-mail e senha, com recuperação de senha e validações necessárias.

Solicitar somente os dados essenciais.

Não exigir CPF ou telefone no cadastro inicial sem necessidade justificada.

Caso algum dado seja necessário para uma integração externa, solicitá-lo no fluxo correspondente, explicando sua finalidade.

## Onboarding

Após o cadastro, apresentar uma sequência de boas-vindas.

Perguntar qual é o principal objetivo do usuário:

- Organizar minhas finanças.
- Entender meus gastos.
- Acompanhar meus investimentos.
- Organizar meu negócio.
- Utilizar todas as funcionalidades.

A partir dessa escolha, adaptar as sugestões apresentadas na tela inicial.

O usuário deverá conseguir pular etapas e utilizar o aplicativo sem conectar uma instituição financeira.

---

# 5. NAVEGAÇÃO PRINCIPAL

Implementar cinco áreas principais:

1. Início.
2. Inteligência.
3. Negócios.
4. Comunidade.
5. Perfil.

No celular, utilizar uma barra de navegação inferior fixa, elegante e discreta.

A área ativa deverá ter um destaque verde.

No desktop, adaptar a navegação para aproveitar melhor a largura da tela.

Criar uma navegação consistente, sem menus confusos.

Também criar acessos específicos para:

- Open Finance.
- Movimentações.
- Metas.
- Configurações.

Essas funcionalidades poderão ser acessadas a partir das áreas principais.

---

# 6. TELA INICIAL — EXPERIÊNCIA FINANCEIRA

A tela inicial é a principal vitrine do Kallan Finance.

Ela deverá transmitir a sensação de que o usuário possui uma visão completa de sua vida financeira.

## Cabeçalho

Apresentar:

- Logotipo.
- Saudação personalizada.
- Nome do usuário.
- Avatar.
- Notificações.
- Acesso ao perfil.

## Cartão principal

Criar um cartão de destaque com o patrimônio financeiro consolidado.

Exibir:

- Patrimônio consolidado.
- Variação em relação ao período anterior.
- Indicador de evolução.
- Botão para ocultar valores.
- Data e horário da última atualização.

Não utilizar patrimônio como sinônimo de saldo disponível.

## Cartões financeiros

Criar cartões para:

- Saldo disponível nas contas.
- Faturas atuais.
- Investimentos.
- Quantidade de instituições conectadas.
- Outros indicadores relevantes.

Os cartões devem ser interativos e direcionar para telas detalhadas.

## Resumo do mês

Apresentar:

- Total de entradas.
- Total de saídas.
- Resultado do período.
- Comparativo com o mês anterior.

Utilizar gráficos modernos, com animações suaves.

## Gastos por categoria

Criar visualização gráfica de categorias financeiras.

Exemplos:

- Alimentação.
- Moradia.
- Transporte.
- Compras.
- Educação.
- Saúde.
- Lazer.
- Serviços.

Permitir clicar em cada categoria para visualizar movimentações correspondentes.

## Cartões de inteligência

A tela inicial deverá apresentar informações relevantes identificadas a partir dos dados disponíveis.

Exemplos:

- Você gastou mais com alimentação este mês.
- Suas despesas recorrentes aumentaram.
- Você está próximo de atingir sua meta.
- Seus gastos diminuíram em comparação ao mês anterior.

Cada informação deverá possuir uma explicação e um caminho para aprofundamento.

Não gerar afirmações personalizadas quando não existirem dados suficientes.

## Cartão de acesso à inteligência

Criar um cartão visualmente destacado:

"Kallan Intelligence"

"Descubra o que seus números estão tentando mostrar."

Botão: "Analisar minhas finanças".

---

# 7. OPEN FINANCE — CENTRAL DE CONEXÕES

O Open Finance será o mecanismo de consolidação das informações bancárias.

Criar uma experiência de conexão simples, segura e intuitiva.

## Tela de apresentação

Explicar:

- O que é Open Finance.
- Por que conectar instituições.
- Quais informações poderão ser compartilhadas.
- Como o usuário controla suas permissões.
- Como revogar o consentimento.

Apresentar uma lista pesquisável de instituições disponíveis no provedor.

Não inventar instituições como disponíveis sem confirmação da cobertura do provedor.

## Fluxo de conexão

Implementar a experiência prevista:

1. Usuário seleciona a instituição.
2. O aplicativo apresenta o contexto da conexão.
3. Exibe os dados e permissões solicitados.
4. Inicia o fluxo oficial do provedor.
5. Usuário autoriza pelo canal oficial da instituição financeira.
6. Retorna ao aplicativo.
7. O sistema sincroniza os dados.
8. A conexão é apresentada como concluída quando houver confirmação real.

Criar estados visuais:

- Preparando conexão.
- Aguardando autorização.
- Conectando.
- Sincronizando.
- Verificando dados.
- Concluído.
- Falha.
- Consentimento expirado.

Durante a sincronização, utilizar uma animação agradável que explique o processo.

## Dados consolidados

Permitir apresentar, conforme a disponibilidade do provedor:

- Contas.
- Saldos.
- Movimentações.
- Cartões.
- Faturas.
- Investimentos.

Não presumir que todas as instituições fornecem todas as informações.

Mostrar a fonte e a data de atualização dos dados.

## Provedor

Preparar uma integração modular com a Malvo como possível primeiro provedor.

Criar uma interface de abstração chamada `OpenFinanceProvider`.

Não acoplar as telas diretamente à API de uma empresa.

A arquitetura deve permitir trocar de fornecedor no futuro.

Implementar a integração somente com documentação oficial e credenciais reais.

Não inventar endpoints, tokens, respostas, autorizações ou status de sincronização.

Até que as credenciais e a documentação estejam disponíveis, deixar a integração preparada e identificar claramente as partes pendentes.

Nunca solicitar senha bancária do usuário.

O acesso deverá acontecer pelo fluxo oficial de consentimento.

---

# 8. MOVIMENTAÇÕES FINANCEIRAS

Criar uma área de movimentações completa e intuitiva.

Exibir:

- Entradas.
- Saídas.
- Pagamentos.
- Compras com cartão.
- Transferências.
- Outras transações identificadas.

Implementar pesquisa e filtros por:

- Data.
- Instituição.
- Categoria.
- Tipo.
- Valor.
- Descrição.

Cada movimentação deverá possuir uma tela de detalhes.

Identificar claramente se o lançamento veio de uma instituição conectada ou foi registrado manualmente.

Evitar duplicações na sincronização.

---

# 9. KALLAN INTELLIGENCE — INTELIGÊNCIA FINANCEIRA

Esta área deverá ser um dos maiores diferenciais do produto.

Não criar somente um chatbot com mensagens simples.

Criar uma experiência de inteligência financeira com diagnósticos estruturados, visualizações e planos de ação.

## Interface principal

Apresentar:

- Saudação.
- Campo para perguntar.
- Sugestões de perguntas.
- Histórico de conversas.
- Agentes especializados.
- Diagnósticos anteriores.

Perguntas sugeridas:

- Onde está indo meu dinheiro?
- Quanto gastei neste mês?
- Quais gastos mais aumentaram?
- Como posso organizar meu orçamento?
- Quanto consegui economizar?
- Quais despesas recorrentes identifiquei?
- Minha situação melhorou em relação ao mês passado?

## Diagnósticos visuais

Quando o usuário fizer uma pergunta, apresentar uma resposta organizada.

Exemplo:

"ONDE ESTÁ SEU DINHEIRO AGORA?"

Criar um cartão contendo:

- Patrimônio.
- Dinheiro disponível.
- Dívidas identificadas.
- Ativos versus obrigações.
- Data de referência.
- Qualidade e atualização dos dados.

Exibir gráficos e indicadores visuais.

## Explicação personalizada

Depois do diagnóstico, apresentar uma interpretação em linguagem simples.

A IA deverá explicar:

- O que identificou.
- Por que aquilo merece atenção.
- Quais fatores contribuíram.
- Qual ação pode ser considerada.

## Planos de ação

Criar cartões com etapas práticas.

Exemplo:

1. Conferir os próximos vencimentos.
2. Analisar os juros dos compromissos.
3. Organizar as despesas essenciais.
4. Definir uma meta de economia.
5. Acompanhar a evolução.

Permitir marcar etapas como concluídas.

## Agentes especializados

Criar uma estrutura visual para diferentes agentes:

**Agente Financeiro**
Analisa orçamento, despesas e padrões.

**Agente de Organização**
Ajuda a organizar contas, compromissos e metas.

**Agente de Dívidas**
Ajuda a compreender valores, vencimentos e encargos identificados.

**Agente de Planejamento**
Ajuda a acompanhar objetivos pessoais.

**Agente Empreendedor**
Ajuda a analisar receitas, despesas e organização de pequenos negócios.

Os agentes devem ser apresentados como ferramentas de acompanhamento e orientação, não como operadores financeiros.

## Regras obrigatórias da IA

A inteligência deverá usar informações disponíveis e autorizadas.

Os cálculos financeiros devem ser realizados por regras determinísticas no backend sempre que possível.

A IA deverá interpretar os resultados, não inventar valores.

Se um banco não fornecer determinado dado, informar sua ausência.

Não confundir:

- Limite de crédito com saldo.
- Fatura com dívida vencida.
- Patrimônio com dinheiro disponível.
- Receita com lucro.
- Investimento com saldo em conta.

Não oferecer recomendações de investimento personalizadas sem estrutura e autorização adequadas.

Não executar pagamentos, transferências, renegociações ou contratações.

Toda resposta deverá indicar quando os dados forem insuficientes ou estiverem desatualizados.

---

# 10. ÁREA DE NEGÓCIOS — GESTÃO EMPREENDEDORA

Criar uma área específica, separada da vida financeira pessoal.

A experiência deve atender desde quem está começando a vender até quem já possui um pequeno negócio.

## Painel principal

Exibir:

- Faturamento.
- Receitas.
- Despesas.
- Resultado estimado.
- Evolução.
- Metas.
- Indicadores.

Identificar claramente os valores que foram registrados manualmente.

Não afirmar que o sistema realiza contabilidade oficial.

## Ferramentas

Permitir:

- Registrar receita.
- Registrar despesa.
- Criar categorias.
- Definir recorrências.
- Acompanhar fluxo de caixa.
- Organizar metas.
- Gerar relatórios.
- Comparar períodos.

## Perfil empresarial

Permitir cadastrar:

- Nome do negócio.
- Categoria.
- Descrição.
- Imagem.
- Região de atuação.
- Informações de contato opcionais.

Não exigir CNPJ para o uso das funções básicas.

Permitir que o usuário tenha mais de um negócio no futuro, mantendo os dados separados.

## Inteligência empreendedora

Preparar análises como:

- Evolução das vendas.
- Aumento de despesas.
- Categorias mais caras.
- Resultado estimado.
- Metas de faturamento.
- Organização de caixa.

O usuário poderá conversar com o Agente Empreendedor utilizando os dados do negócio selecionado.

---

# 11. COMUNIDADE KALLAN

Criar uma rede de conexão entre usuários e empreendedores.

O objetivo é facilitar relacionamentos, divulgação de negócios e troca de experiências.

A comunidade deverá ter uma interface de qualidade visual semelhante às referências anexadas.

## Feed

Permitir:

- Publicar textos.
- Compartilhar imagens.
- Divulgar negócios.
- Compartilhar experiências.
- Fazer perguntas.
- Publicar novidades.

## Perfis

Cada usuário poderá apresentar:

- Foto.
- Nome.
- Apresentação.
- Cidade ou região.
- Negócios associados.
- Segmento.
- Publicações.

## Interações

Implementar:

- Curtidas.
- Comentários.
- Seguir.
- Compartilhamento interno.
- Denúncia.
- Bloqueio.

## Negócios locais

Criar uma vitrine para descobrir negócios e empreendedores.

Permitir filtros por:

- Categoria.
- Região.
- Tipo de negócio.

## Eventos e oportunidades

Criar espaço para eventos, cursos, feiras, parcerias e oportunidades.

## Privacidade

Informações bancárias e financeiras jamais serão divulgadas automaticamente.

O usuário deverá controlar o que publica.

Implementar moderação, denúncias e bloqueios.

---

# 12. METAS E PLANEJAMENTO

Criar ferramentas para objetivos financeiros pessoais e empresariais.

Permitir:

- Criar metas.
- Definir valores.
- Definir prazos.
- Acompanhar progresso.
- Registrar contribuições.
- Editar objetivos.
- Concluir metas.

Exibir progresso com barras animadas e cartões modernos.

---

# 13. PERFIL E SEGURANÇA DO USUÁRIO

Criar uma área completa de perfil contendo:

- Dados pessoais.
- Avatar.
- Segurança.
- Preferências.
- Notificações.
- Instituições conectadas.
- Consentimentos.
- Configurações.
- Ajuda e suporte.
- Exclusão da conta.

Permitir ocultar valores financeiros globalmente.

Permitir revisar e revogar consentimentos de Open Finance.

---

# 14. SEGURANÇA E PRIVACIDADE

Construir o projeto seguindo boas práticas de segurança desde o início.

Implementar:

- Autenticação segura.
- Isolamento de dados por usuário.
- RLS no banco de dados.
- Validação no backend.
- Controle de permissões.
- Proteção de rotas.
- Tratamento de erros.
- Validação de entradas.
- Logs de auditoria.
- Proteção de sessões.
- Controle de acesso administrativo.

Nunca armazenar senhas bancárias.

Nunca expor chaves de API no frontend.

Guardar credenciais de integrações em ambiente seguro no backend.

Não registrar tokens ou dados bancários sensíveis nos logs.

Aplicar princípios de minimização de dados e LGPD.

Não apresentar alegações de segurança absoluta ou certificações que não tenham sido comprovadas.

---

# 15. ESTRUTURA DE DADOS

Projetar o banco de dados de forma organizada e escalável.

Criar as entidades necessárias para:

- Usuários.
- Perfis.
- Instituições.
- Consentimentos.
- Conexões.
- Contas.
- Saldos.
- Movimentações.
- Cartões.
- Faturas.
- Investimentos.
- Categorias.
- Metas.
- Negócios.
- Receitas empresariais.
- Despesas empresariais.
- Publicações.
- Comentários.
- Reações.
- Seguidores.
- Denúncias.
- Conversas.
- Mensagens.
- Diagnósticos.
- Planos de ação.
- Notificações.
- Auditoria.

Todas as informações privadas deverão estar associadas aos seus respectivos proprietários e protegidas pelas políticas de acesso.

Evitar tabelas desnecessárias e relações sem finalidade.

---

# 16. DADOS DE DEMONSTRAÇÃO E ESTADOS VAZIOS

O aplicativo deve ter uma experiência visual interessante mesmo quando o usuário ainda não conectou bancos.

Criar demonstrações separadas dos dados reais.

Caso sejam utilizados valores ilustrativos, apresentar a identificação:

"Dados de demonstração".

Não misturar dados fictícios com informações reais do usuário.

Criar estados vazios bem desenhados, com explicações e ações claras.

Exemplos:

- Você ainda não conectou uma instituição.
- Registre sua primeira receita.
- Crie sua primeira meta.
- Comece uma conversa com o Kallan Intelligence.
- Conheça os empreendedores da sua região.

A experiência precisa ser útil desde o primeiro acesso.

---

# 17. PLANOS E MONETIZAÇÃO FUTURA

Preparar a arquitetura para possíveis planos gratuitos e premium.

Não implementar cobranças reais neste momento.

A monetização poderá futuramente envolver:

**Plano gratuito**
- Ferramentas financeiras básicas.
- Acesso inicial à inteligência.
- Metas básicas.
- Funcionalidades essenciais.

**Plano premium**
- Mais recursos de inteligência artificial.
- Relatórios avançados.
- Acompanhamento ampliado.
- Ferramentas adicionais para empreendedores.

Não definir preços ou cobrar usuários sem que o modelo esteja aprovado.

---

# 18. RESPONSIVIDADE E EXPERIÊNCIA MOBILE

O celular será a principal experiência do aplicativo.

Não quero uma versão desktop simplesmente comprimida.

## Mobile

- Cartões grandes e elegantes.
- Hierarquia visual clara.
- Navegação inferior.
- Gráficos legíveis.
- Botões acessíveis.
- Áreas de toque adequadas.
- Rolagem suave.
- Animações leves.
- Modais adaptados.
- Formulários sem problemas com o teclado.
- Conteúdo sem cortes.

## Desktop

- Aproveitamento inteligente da largura.
- Painéis bem distribuídos.
- Cards proporcionais.
- Gráficos maiores.
- Menus adequados.
- Tipografia consistente.

Verificar diferentes resoluções e dispositivos.

---

# 19. FUNCIONALIDADE REAL

Não quero uma demonstração visual que pareça funcional, mas não execute nada.

Os botões devem funcionar.

Os formulários devem validar e salvar informações.

Os menus devem navegar.

Os filtros devem filtrar.

Os lançamentos devem ser persistidos.

As metas devem atualizar.

As publicações devem aparecer no feed.

Os comentários devem ser associados às publicações.

Os diagnósticos devem utilizar dados reais ou demonstrações identificadas.

As conexões bancárias só poderão aparecer como concluídas após confirmação do provedor.

Não inventar integrações.

Não inventar dados.

Não criar botões decorativos.

Quando uma funcionalidade depender de configuração externa, criar um estado claro informando o que está pendente.

---

# 20. TESTES E CRITÉRIOS DE QUALIDADE

Antes de considerar o projeto concluído, testar:

- Cadastro.
- Login.
- Recuperação de senha.
- Navegação.
- Perfil.
- Responsividade.
- Cadastro de metas.
- Lançamentos financeiros.
- Separação pessoal e empresarial.
- Publicações.
- Comentários.
- Permissões.
- Isolamento de dados.
- Estados vazios.
- Erros.
- Carregamento.
- Integrações.

Criar usuários de teste com dados isolados.

Verificar que um usuário não consegue acessar informações de outro.

Verificar a experiência em celular e desktop.

Não afirmar que testes foram realizados sem efetivamente executá-los.

---

# 21. ORDEM DE IMPLEMENTAÇÃO

Desenvolva o projeto em uma sequência organizada:

**FASE 1 — Fundação**
- Configuração do projeto.
- Identidade visual.
- Autenticação.
- Banco de dados.
- Estrutura de navegação.

**FASE 2 — Experiência financeira**
- Tela inicial.
- Movimentações.
- Categorias.
- Metas.
- Perfil.

**FASE 3 — Inteligência**
- Chat.
- Diagnósticos.
- Agentes.
- Planos de ação.

**FASE 4 — Open Finance**
- Conexões.
- Consentimentos.
- Sincronização.
- Integração com provedor.

**FASE 5 — Empreendedorismo**
- Painel de negócios.
- Receitas.
- Despesas.
- Indicadores.
- Metas empresariais.

**FASE 6 — Comunidade**
- Feed.
- Perfis.
- Publicações.
- Interações.
- Vitrine de negócios.

**FASE 7 — Validação**
- Segurança.
- Testes.
- Responsividade.
- Correções.
- Revisão geral.

Implemente as etapas de forma integrada. Não entregue somente uma descrição ou protótipo estático.

Quando houver dependências externas, desenvolva o máximo possível sem simular integrações reais e informe exatamente o que falta.

---

# 22. RESULTADO ESPERADO

Quero que o Kallan Finance seja um produto com personalidade própria.

Não quero que pareça um aplicativo financeiro genérico.

Quero:

- Design premium.
- Experiência mobile excepcional.
- Navegação intuitiva.
- Inteligência visual.
- Funcionalidades verdadeiras.
- Segurança desde a arquitetura.
- Gestão financeira pessoal.
- Ferramentas empresariais.
- Comunidade de empreendedores.
- Estrutura pronta para expansão.

A qualidade visual é uma prioridade tão importante quanto a funcionalidade.

Não simplifique a interface para acelerar o desenvolvimento.

Não encha as telas de informações sem hierarquia.

Não sacrifique usabilidade para adicionar animações.

**O Kallan Finance deverá ser bonito o suficiente para chamar atenção, simples o suficiente para qualquer pessoa utilizar e inteligente o suficiente para realmente ajudar seus usuários.**

Comece configurando a nova aplicação e construindo a fundação do produto.

Depois implemente as áreas de maneira organizada, validando cada funcionalidade.

Ao finalizar, apresente um relatório verdadeiro do que foi construído, do que está funcionando e das integrações que ainda dependem de credenciais, contratos ou configurações externas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/01406966-0e56-4766-8922-aaacd84271da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
