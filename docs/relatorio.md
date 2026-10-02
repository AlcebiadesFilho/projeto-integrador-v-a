# Relatório Técnico — Projeto Integrador V-A

## Resumo

Este Projeto Integrador Extensionista foi desenvolvido em parceria com a **Infomach**, provedor de serviços gerenciados de TI e Segurança (MSSP) de Goiânia/GO. A partir da base real de atendimento exportada do **Movidesk**, ferramenta de service desk da empresa, foi construído um **painel analítico web interativo**, com dados preparados em Python (pandas) e visualização em React + Recharts, com nove indicadores-chave de desempenho (KPIs), organizado como uma narrativa de dados (*Data Storytelling*) que conduz o gestor do contexto ao achado e do achado à recomendação.

A análise de **41.676 chamados** e **51.281 horas técnicas** (jul/2020 a mai/2022) revelou quatro achados principais: (1) o volume de chamados cresceu **66%** enquanto as horas apontadas cresceram apenas **19%**; (2) a demanda reativa (incidentes e alertas) representa **45% dos chamados, mas só 15% das horas**, e mesmo assim leva **3,7 vezes mais tempo para fechar** que o trabalho planejado, sinal de que o gargalo é a **fila**, não o esforço técnico; (3) a prioridade **“Alta” não acelera o atendimento**, com ciclo mediano igual ao da prioridade “Normal”; e (4) **21% das horas** vão para atividade interna, enquanto **8% dos clientes** consomem metade das horas entregues ao mercado. O painel e as recomendações foram apresentados à organização parceira como instrumento de apoio à decisão.

## 1. Identificação e contextualização da organização parceira

A **Infomach** é uma empresa goiana que presta serviços gerenciados de Tecnologia da Informação e Segurança (*Managed Security Service Provider*, MSSP). Atende algumas centenas de clientes corporativos com equipes especializadas em Segurança de Rede e Conectividade (Firewall/SD-WAN, SonicWALL), Backup (CloudBackup, Veeam, Rapid Recovery), Segurança de Endpoint e Proteção de Dados (McAfee), Cloud, Infraestrutura e Monitoramento.

Todo o atendimento técnico é registrado no **Movidesk**: cada chamado tem categoria, prioridade, equipe responsável, serviço e cliente, e cada técnico **aponta as horas** trabalhadas em cada ação do chamado. Esse histórico é o principal registro de como a operação usa sua capacidade técnica.

Esta é a terceira etapa da parceria acadêmica com a Infomach. No PI IV-A a base foi estruturada em um Data Lake na AWS; no PI IV-B foram descobertos os temas recorrentes dos chamados com NLP. Neste PI V-A, o foco passa a ser **Business Intelligence e visualização**: transformar o mesmo histórico em indicadores de gestão consumíveis pelos gestores.

| Item | Descrição |
|---|---|
| Organização | Infomach — MSSP de TI e Segurança, Goiânia/GO |
| Setor envolvido | Operações técnicas / Service Desk (coordenação técnica e líderes de equipe) |
| Necessidade | Visão consolidada de demanda, esforço, gargalos e concentração que os relatórios nativos do Movidesk não oferecem |
| Público usuário | Diretoria e coordenação técnica, líderes de equipe, Comercial/Customer Success |
| Decisões apoiadas | Dimensionamento de equipes, ataque ao trabalho reativo, regras de prioridade/SLA, revisão de contratos |
| Resultado esperado | Painel interativo atualizável + diagnóstico com recomendações acionáveis |

## 2. Necessidade identificada junto à organização

Os relatórios nativos do Movidesk são **listas operacionais**: mostram os chamados de uma fila ou de um período, mas não mostram **tendência**, **concentração** nem **gargalo**. Para responder perguntas de gestão, a coordenação dependia de exportações para planilha e de cálculos manuais, feitos esporadicamente.

Em conjunto com a organização, a necessidade foi traduzida em quatro perguntas de negócio, que estruturam todo o painel:

- **1. A demanda está crescendo? E o esforço acompanha?** — base para dimensionar as equipes.
- **2. Quanto do trabalho é reativo e onde ele trava?** — onde atacar primeiro.
- **3. A prioridade atribuída ao chamado muda o tempo de atendimento?** — validade da régua de SLA.
- **4. Para onde vão as horas técnicas?** — equipes, clientes e atividade interna.

## 3. Interação realizada com a organização

O interlocutor da Infomach neste projeto foi **Murillo Santos, COO (Diretor de Operações)**. A diretoria de operações é o público principal do painel.

A base de dados é a mesma cedida pela Infomach, de forma anonimizada e formalizada em Termo de Cessão de Dados, nas etapas anteriores da parceria (PI IV-A e PI IV-B). Neste PI V-A, a interação concentrou-se em transformar essa base em uma ferramenta de gestão para a diretoria de operações.

| Data | Atividade | Participantes | Registro |
|---|---|---|---|
| Etapas anteriores (PI IV-A / IV-B) | Cessão da base anonimizada do Movidesk | Infomach e aluno | Termo de Cessão de Dados |
| 30/09/2026, 11h30–12h00 | Reunião online (Google Meet) com o COO: apresentação do painel, dos indicadores, dos achados e das recomendações | Murillo Santos (COO) e o aluno | Convite da reunião (Figura 1) |

Na reunião online de 30/09/2026, o painel foi apresentado seguindo a mesma narrativa descrita na seção 8: as quatro perguntas de gestão, os nove indicadores, os três conflitos (fila do Backup, régua de prioridade e distribuição das horas) e as cinco recomendações. O **retorno do COO foi muito positivo**. Ele destacou a utilidade de ter, em uma única tela, a visão consolidada de demanda, esforço e gargalos que os relatórios do Movidesk não oferecem; considerou a fila de alertas do Backup e a revisão da régua de prioridade como os pontos de ação mais imediatos; e manifestou interesse em usar o painel como apoio às reuniões periódicas da coordenação técnica.

[FIGURA evidencia_reuniao|55: Convite da reunião de apresentação com a Infomach (Google Meet, 30/09/2026).]

## 4. Objetivos do projeto

**Objetivo geral:** desenvolver uma solução analítica interativa que transforme o histórico de atendimento do Movidesk em informação para a tomada de decisão da coordenação técnica da Infomach.

**Objetivos específicos:**

- definir e justificar um conjunto de KPIs alinhados às quatro perguntas de negócio;
- construir um painel interativo com filtros por período, equipe, prioridade, tipo de demanda e serviço;
- aplicar boas práticas de visualização (escolha de gráfico, cor com função, hierarquia visual, acessibilidade);
- organizar o painel como narrativa (*Data Storytelling*), do contexto às recomendações;
- apresentar os achados e recomendações à organização parceira.

## 5. Descrição da base de dados

| Atributo | Descrição |
|---|---|
| Origem | Exportação do Movidesk cedida pela Infomach, anonimizada (clientes e técnicos mascarados) |
| Granularidade original | 1 linha = 1 apontamento de horas (95.291 linhas, 23 colunas) |
| Granularidade analítica | 1 linha = 1 chamado (42.895 chamados; 41.676 na janela de análise) |
| Período | jun/2020 a jun/2022; análise em jul/2020–mai/2022 (23 meses completos) |
| Dimensões | data de abertura, equipe, categoria, prioridade, status, serviço, cliente, técnico |
| Medidas | horas apontadas, nº de apontamentos, início/fim de cada apontamento |

**Principais tratamentos** (feitos em `src/prepare_data.py`, sem serem o foco do projeto):

- conversão de datas e do tempo de trabalho (`hh:mm:ss`) para minutos;
- **unificação de equipes**: duas grafias da equipe de Endpoint e a renomeação “Cloud & Desenvolvimento” → “Cloud” ocorrida em 2021; equipes com menos de 2% do volume agrupadas em “Outras”;
- correção de erros de digitação nas categorias (“Relátorio”, “Apredizagem”);
- criação do **tipo de demanda**: *Reativa* (Incidente, Alerta), *Planejada* (Configuração, Instalação, Relatório, Reunião etc.) e *Atendimento/Outros*;
- cálculo do **tempo de ciclo** (abertura → último apontamento) como proxy de resolução, já que a exportação não traz a data de fechamento; valores negativos de apontamentos retroativos foram truncados em zero, e por isso se usa a **mediana**;
- **exclusão de dados pessoais**: o texto livre do assunto, nomes e e-mails de quem abriu o chamado não entram na base analítica (LGPD);
- exclusão de jun/2020 e jun/2022, meses parciais que distorceriam as tendências.

**Observação:** a conta **Cliente_4** concentra o serviço “Infomach (Interno)” (reuniões, relatórios, treinamentos). Por isso ela foi tratada como **conta interna** e excluída das análises de concentração de clientes. Essa identificação foi inferida dos dados: o serviço interno aparece quase exclusivamente nessa conta.

## 6. Indicadores definidos (KPIs)

| KPI | Fórmula | Por que importa para a decisão | Valor |
|---|---|---|---|
| Chamados / mês | nº de chamados ÷ nº de meses | Mede a demanda; base do dimensionamento | 1.812 |
| Horas técnicas / mês | Σ horas apontadas ÷ meses | O custo operacional real da operação | 2.230 h |
| Esforço médio / chamado | Σ horas ÷ nº de chamados | Quanto “custa” cada chamado; compara equipes e clientes | 74 min |
| Horas / técnico / mês | horas do mês ÷ técnicos ativos no mês | Indicador de capacidade e de carga da equipe | 94 h |
| Demanda reativa | % de chamados Incidente + Alerta | Trabalho não planejado; alvo de prevenção/automação | 44,6% |
| Urgente + Alta | % de chamados com essas prioridades | Pressão sobre a operação; sanidade da régua de prioridade | 30,7% |
| Ciclo mediano | mediana(último apontamento − abertura) | Proxy de tempo de resolução percebido pelo cliente | 15,5 h |
| Horas em atividade interna | % das horas no serviço “Infomach (Interno)” | Capacidade que não é entregue a clientes | 21,3% |
| Horas nos 10 maiores clientes | % das horas externas nos 10 clientes do topo | Concentração/dependência; base para revisão de contratos | 31,0% |

Os KPIs são definidos em `src/kpis.py` (Python) e replicados com as mesmas fórmulas em `web/src/lib/data.ts` (painel), o que garante números idênticos em todos os entregáveis. No painel, todos os KPIs **respondem aos filtros**.

## 7. Solução desenvolvida e justificativa das visualizações

A solução tem duas camadas, ambas *open source*:

| Camada | Tecnologia | Papel |
|---|---|---|
| Dados | Python (pandas) | Limpeza, unificação, cálculo da base por chamado e exportação de um JSON anonimizado (`src/prepare_data.py`, `src/export_web_data.py`) |
| Indicadores | Python (`src/kpis.py`) e TypeScript (`web/src/lib/data.ts`) | Mesmas fórmulas nas duas linguagens; os números do painel conferem com os do relatório |
| Visualização | React + TypeScript + Recharts, empacotado com Vite | Painel web interativo, com filtros que recalculam todos os KPIs no próprio navegador |

**Justificativa técnica.** Bibliotecas Python de painel, como Streamlit e Dash, foram consideradas e prototipadas: a primeira versão do painel foi feita em Streamlit. A versão final usa um front-end web próprio por quatro motivos: (1) **controle total do design visual**, essencial em um projeto cujo tema é a visualização de dados (tipografia, espaçamento, cor com função e modo escuro com paleta própria); (2) **narrativa em página única**, que conduz o leitor por capítulos em vez de abas soltas; (3) **publicação gratuita como site estático**, sem servidor Python ligado, o que facilita o acesso da Infomach; e (4) **interatividade instantânea**, porque os 41 mil chamados são filtrados no navegador. O Python continua sendo o motor dos dados, como recomenda a proposta.

**Princípios aplicados:**

- **Escolha do gráfico pela pergunta.** Tendência → linha; comparação entre equipes → barras horizontais ordenadas (rótulos longos legíveis); parte-todo → barra 100% empilhada; concentração → curva de Pareto; número único → cartão de KPI com *sparkline*.
- **Cor com função, não decoração.** Uma série = uma cor (azul). O **laranja é reservado ao problema** (demanda reativa, equipe Backup, prioridade “Alta”) e o cinza ao contexto. A paleta foi validada por script para daltonismo (protanopia, deuteranopia e tritanopia) e tem tons próprios para o modo escuro, não uma simples inversão.
- **Um eixo por gráfico.** Para comparar chamados (≈1.800/mês) com horas (≈2.200/mês), as duas séries foram **indexadas (base 100)** em vez de usar eixo duplo, que cria correlações artificiais.
- **Hierarquia visual.** Cada capítulo abre com um título-conclusão e um **quadro de “Achado”** (a conclusão em uma frase), seguido dos gráficos que a sustentam. Há um único número-herói na abertura.
- **Redução de ruído.** Grade horizontal em linha fina, sem bordas, sem 3D; rótulos diretos só onde ajudam a leitura (fim da linha, ponta da barra).
- **Acessibilidade.** A cor nunca é o único canal (rótulos e legenda sempre presentes); todo gráfico tem um botão **“Dados”** que troca o gráfico por uma tabela; contraste validado; respeito à preferência de “movimento reduzido”; números no formato brasileiro; layout responsivo para celular.
- **Textos que respondem aos dados.** Os quadros de “Achado” são calculados: ao filtrar o painel, os números e a própria conclusão mudam. Se o recorte contradiz a história geral, o texto diz isso.

[FIGURA painel_hero: Abertura do painel — a tese central e o número-herói.]

[FIGURA secao_visao: Capítulo 01 — os nove KPIs com tendência mensal e a comparação demanda × esforço.]

## 8. Narrativa construída (Data Storytelling)

O painel é uma página única que segue o arco **contexto → conflito → resolução**. A barra de filtros fica fixa no topo durante toda a leitura.

| Capítulo | Pergunta | Papel na narrativa |
|---|---|---|
| Abertura | Qual é a tese? | “O gargalo do service desk não é esforço. É fila.” |
| 00 · O problema | Qual é o problema e quem decide? | Situação: as quatro perguntas de gestão e as decisões que apoiam |
| 01 · Visão geral | A demanda cresce? O esforço acompanha? | Os KPIs e a tendência geral |
| 02 · Demanda reativa | Onde o trabalho reativo trava? | Conflito 1: fila no Backup |
| 03 · Prioridade | A prioridade funciona? | Conflito 2: “Alta” = “Normal” |
| 04 · Esforço e clientes | Para onde vão as horas? | Conflito 3: atividade interna e concentração |
| 05 · Recomendações | O que fazer? | Resolução: ações + KPI para acompanhar cada uma |
| Método e dados | Posso confiar? | Fonte, janela, definições e limitações |

Cada gráfico tem um **título-conclusão** (ex.: “A demanda reativa pesa no volume, não nas horas”) em vez de um título descritivo, para que o gestor entenda a mensagem antes de ler os eixos.

## 9. Principais análises e resultados

### 9.1 A demanda cresceu bem mais que o esforço

Comparando os três primeiros com os três últimos meses da janela, o volume médio passou de **1.318 para 2.184 chamados/mês (+66%)**, enquanto as horas apontadas passaram de **1.986 para 2.371 h/mês (+19%)**. A operação absorveu muito mais demanda sem aumentar o esforço na mesma proporção: os chamados novos são, em média, mais curtos. A carga média ficou em **94 horas apontadas por técnico por mês**.

### 9.2 Demanda reativa: muitos chamados, poucas horas, fila longa

Incidentes e alertas são **44,6% dos chamados, mas apenas 15% das horas**: 81% deles são resolvidos em um único apontamento, com esforço médio de 25 minutos. Ainda assim, o **ciclo mediano é de 20,5 h**, contra 5,6 h do trabalho planejado. O tempo do reativo não está no trabalho técnico; está na **espera**.

[FIGURA mix_demanda: Participação de cada tipo de demanda em chamados e em horas.]

A equipe de **Backup** concentra o problema: **79% dos seus chamados são reativos**, ela responde por **47,5% de todos os chamados reativos** da empresa e tem o **maior ciclo mediano** entre as equipes (28,5 h). Cada chamado reativo de Backup consome em média **13 minutos** de trabalho técnico, e 76% deles vêm do serviço **CloudBackup**, com alertas de falha de rotina de backup.

[FIGURA reativo_por_equipe: Percentual de chamados reativos por equipe.]

[FIGURA ciclo_reativo_por_equipe: Ciclo mediano dos chamados reativos por equipe.]

[FIGURA ciclo_backup_trimestral: Ciclo mediano dos chamados reativos por trimestre — Backup x demais equipes.]

O ciclo do Backup oscila em ondas: caiu de 74 h (4º tri/2020) para cerca de 20 h ao longo de 2021, voltou a subir para cerca de 50 h entre o 4º tri/2021 e o 1º tri/2022 e recuou para 21 h no 2º tri/2022. Esse comportamento é típico de fila sem regra de vazão estável.

### 9.3 A prioridade “Alta” não acelera o atendimento

Entre os chamados reativos, “Urgente” fecha em **5 h** (mediana), mas “Alta” (**22 h**) e “Normal” (**23 h**) praticamente não se diferenciam. Ou a prioridade “Alta” é atribuída sem critério claro, ou não existe uma fila priorizada para ela. Em ambos os casos a régua de prioridade **não está cumprindo o seu papel**.

[FIGURA ciclo_por_prioridade: Ciclo mediano dos reativos por prioridade.]

### 9.4 Para onde vão as horas

**21,3% das horas (10.921 h)** foram apontadas no serviço “Infomach (Interno)”, em sua maioria **reuniões (7.405 h)**, configuração interna e relatórios. É capacidade técnica que não é entregue diretamente a clientes. Isso não é necessariamente um problema, mas hoje esse esforço não é medido nem orçado.

[FIGURA atividade_interna: Horas da atividade interna por categoria.]

Entre os **325 clientes externos**, o esforço segue o padrão de Pareto: **27 clientes (8%) consomem 50% das horas** e **82 clientes (25%) consomem 80%**. Esses clientes devem orientar a revisão de contratos (preço × consumo) e a decisão de alocar técnicos dedicados.

[FIGURA pareto_clientes: Curva de Pareto das horas por cliente externo.]

## 10. Contribuições da solução para a organização parceira

- **Visão de gestão que não existia:** tendência, concentração e gargalo em um só lugar, com filtros, sem planilha manual.
- **Atualização simples:** basta substituir o CSV exportado do Movidesk e executar dois comandos (`prepare_data.py` e `export_web_data.py`) para atualizar todos os indicadores.
- **Acesso fácil:** o painel é um site estático que pode ser publicado gratuitamente e aberto no navegador ou no celular, sem instalação.
- **Diagnóstico acionável:** cada achado vem acompanhado de uma recomendação e de um KPI para medir o resultado.
- **Qualidade de dados:** o projeto expôs lacunas de registro (sem data de fechamento, apontamentos retroativos, equipes com nomes duplicados) que limitam qualquer análise de SLA.
- **Privacidade:** a base analítica não contém texto livre nem nomes de pessoas.

## 11. Conclusões e recomendações

O painel mostrou que o maior ganho para a Infomach não está em “trabalhar mais rápido” nos chamados, mas em **gerenciar melhor a fila**. A demanda reativa é leve em esforço e pesada em espera, e a régua de prioridade não diferencia o que deveria.

| # | Recomendação | Evidência | KPI para acompanhar |
|---|---|---|---|
| 1 | Automatizar a triagem dos alertas de Backup (CloudBackup/Veeam): auto-fechamento de falhas que se resolvem na rotina seguinte e reabertura só se persistirem | Backup: 79% reativo, 47,5% de todo o reativo, ciclo de 28,5 h com 13 min de esforço | Ciclo mediano dos reativos de Backup |
| 2 | Revisar a régua de prioridade: critérios objetivos para “Alta” e uma fila própria para ela | Alta (22 h) ≈ Normal (23 h) | Ciclo mediano por prioridade (meta: Alta < Normal) |
| 3 | Medir e orçar a atividade interna, com teto mensal de horas de reunião | 21% das horas são internas; 7.405 h em reuniões | % de horas em atividade interna |
| 4 | Revisar contratos dos clientes do topo do Pareto e avaliar técnico dedicado | 8% dos clientes = 50% das horas externas | % de horas nos 10 maiores clientes |
| 5 | Registrar data de primeira resposta e de fechamento no Movidesk | O ciclo hoje é um proxy | % de chamados com SLA medido |

**Limitações:** os dados vão até jun/2022; o tempo de ciclo é um proxy; a identificação da conta interna foi inferida. Como **trabalho futuro**, recomenda-se conectar o painel diretamente à API do Movidesk, para atualização automática, e incluir metas de SLA por contrato.

**Experiência extensionista.** Trabalhar com uma organização real mudou a forma de fazer a análise. O ponto de partida não foi o dado, mas as perguntas da gestão. Traduzir “queremos entender a operação” em quatro perguntas e nove indicadores, cada um ligado a uma decisão, foi o aprendizado mais importante. Também ficou claro que, para um público executivo, mostrar menos é mais: cada gráfico precisa de uma única mensagem, e o título deve dizer essa mensagem. Lidar com dados de clientes e técnicos de terceiros exigiu cuidado com a privacidade desde o primeiro script, e não só no final. Por fim, apresentar o painel ao COO e receber o retorno dele confirmou que a visualização só cumpre seu papel quando gera conversa sobre o que fazer. É esse o valor que a extensão universitária devolve à comunidade.

## Referências

KNAFLIC, Cole Nussbaumer. **Storytelling com dados**: um guia sobre visualização de dados para profissionais de negócios. Rio de Janeiro: Alta Books, 2019.

FEIGENBAUM, Anna; ALAMALHODAEI, Aria. **The data storytelling workbook**. London: Routledge, 2020.

MALIK, Shadan. **Enterprise dashboards**: design and best practices for IT. Indianapolis: Wiley Publishing, 2005.

SHARDA, R.; DELEN, D.; TURBAN, E. **Business intelligence e análise de dados para gestão do negócio**. 4. ed. Porto Alegre: Bookman, 2019.

ROCHA, E. **Introdução à inteligência de negócios**. Porto Alegre: Bookman/Sagah, 2018.

SILVA, K. C. N. da. **Sistemas de informações gerenciais**. Porto Alegre: Bookman/Sagah, 2013.

## Apêndice — Código-fonte e execução

Repositório: https://github.com/AlcebiadesFilho/projeto-integrador-v-a

O painel roda localmente a partir do repositório, que já inclui o arquivo de dados anonimizado do painel; não é preciso executar a etapa em Python para visualizá-lo.

Para ver o painel (requer Node.js 20 ou superior):

- `cd web`
- `npm install`
- `npm run dev` e abrir o endereço indicado (http://localhost:5173)

Para regenerar os dados a partir do CSV original do Movidesk (opcional): `pip install -r requirements.txt`, depois `python src/prepare_data.py` e `python src/export_web_data.py`.
