# Roteiro do vídeo — Projeto Integrador V-A

**Duração-alvo:** 8 a 9 minutos · **Formato:** gravação de tela (slides + demonstração do painel) com voz e, se possível, câmera no canto.

**Antes de gravar**

- Painel aberto no navegador, em tela cheia, no topo da página, com o modo claro ativo e os filtros limpos.
- Slides abertos no modo apresentação.
- Fale olhando para a câmera nas partes de contexto e para a tela nas partes de demonstração.

---

## Bloco 1 — Abertura (0:00 – 0:40) · Slide 1

> Olá, eu sou Alcebiades Alves Barbosa Filho, do curso de Big Data e Inteligência Artificial da PUC Goiás. Este é o meu Projeto Integrador V-A, feito em parceria com a Infomach.
>
> Vou começar pela conclusão: **o gargalo do service desk da Infomach não é esforço. É fila.** Nos próximos minutos eu mostro como os dados chegaram a essa frase e o que a empresa pode fazer com ela.

## Bloco 2 — Organização e problema (0:40 – 1:50) · Slides 2 e 3

> A Infomach é um provedor de serviços gerenciados de TI e Segurança aqui de Goiânia. Ela tem equipes de rede, backup, endpoint, cloud, infraestrutura e monitoramento, e registra todo o atendimento no Movidesk, com as horas que cada técnico trabalhou.
>
> Esta é a terceira etapa da nossa parceria. No PI IV-A estruturamos um Data Lake; no IV-B descobrimos os temas dos chamados com NLP. Agora o foco é Business Intelligence e visualização.
>
> O problema: os relatórios do Movidesk são listas. Eles mostram chamados, mas não mostram tendência, concentração nem gargalo. Junto com a coordenação técnica, transformamos essa necessidade em quatro perguntas, e cada uma está ligada a uma decisão: dimensionar equipes, onde atacar o trabalho reativo, se a régua de prioridade funciona e para onde vão as horas.

## Bloco 3 — Interação com a organização (1:50 – 2:30) · Slide 4

> O projeto foi construído com a Infomach, não só sobre os dados dela. A base foi cedida de forma anonimizada nas etapas anteriores da parceria. No dia 30 de setembro, apresentei o painel, os indicadores e as recomendações ao Murillo Santos, COO da Infomach, e o retorno foi muito positivo. Ele valorizou ter numa tela só a visão que o Movidesk não dá, apontou a fila do Backup e a régua de prioridade como as ações mais imediatas e quer usar o painel nas reuniões da coordenação.

## Bloco 4 — Dados e indicadores (2:30 – 3:30) · Slides 5 e 6

> A base tem 95 mil apontamentos de horas. Com Python e pandas eu transformei isso em 41.676 chamados, entre julho de 2020 e maio de 2022, somando 51 mil horas técnicas. Unifiquei nomes de equipe duplicados, corrigi categorias e removi tudo que fosse dado pessoal: texto livre, nomes e e-mails.
>
> A partir das quatro perguntas, defini nove KPIs. Cada um responde a uma decisão: chamados por mês para dimensionamento, horas por técnico para capacidade, percentual reativo para prevenção, ciclo mediano para o tempo percebido pelo cliente, e assim por diante.

## Bloco 5 — A solução e as escolhas de visualização (3:30 – 4:30) · Slides 7, 8 e 9

> A solução tem duas camadas. O Python prepara os dados e gera um arquivo anonimizado. Por cima dele construí um painel web em React, com gráficos em Recharts. Escolhi um front-end próprio porque, num projeto sobre visualização, eu queria controle total do design, uma narrativa em página única e um site que a Infomach pudesse abrir no celular, sem servidor.
>
> Três regras guiaram os gráficos. **Cor com função**: azul é a série, laranja só aparece no problema, cinza é contexto, e a paleta foi validada para daltonismo. **Um eixo por gráfico**: nada de eixo duplo. E **título-conclusão**: o título já diz a mensagem.
>
> O painel conta uma história: tese, problema, três conflitos e a resolução. E os textos de “Achado” são calculados, então mudam quando você filtra.

## Bloco 6 — Demonstração do painel (4:30 – 6:45) · Navegador

*Rolar devagar, parando em cada capítulo.*

1. **Abertura** — “O painel abre com a tese e um número: reativos são 45% dos chamados, 15% das horas, e levam 3,7 vezes mais tempo para fechar.”
2. **Visão geral** — Passar o mouse nos KPIs. “Os chamados cresceram 66% e as horas só 19%. Como as duas séries estão indexadas, dá para comparar sem eixo duplo.” Mostrar o tooltip do gráfico de índice.
3. **Demanda reativa** — “O Backup é a equipe mais reativa e a que mais demora: quase metade de todo o trabalho reativo, com 13 minutos de esforço e 28 horas de espera.” Clicar em **Dados** para mostrar a tabela acessível e clicar de novo para voltar.
4. **Filtro ao vivo** — Na barra de filtros, selecionar **Equipe → Backup**. “Todos os números e textos se recalculam.” Depois trocar o período para **2021** e mostrar que o achado muda. Clicar em **Limpar**.
5. **Prioridade** — “Urgente fecha em 5 horas; Alta e Normal empatam em torno de 22 horas. A prioridade Alta não acelera nada.”
6. **Esforço e clientes** — “21% das horas são internas, a maior parte em reuniões. E 27 clientes, 8% do total, consomem metade das horas.” Passar o mouse na curva de Pareto.
7. **Modo escuro** — Clicar no ícone de lua. “O modo escuro tem tons próprios, validados para o fundo escuro.” Voltar ao claro.

## Bloco 7 — Recomendações (6:45 – 7:35) · Slide 14

> Cinco recomendações, cada uma com o indicador que mostra se funcionou: automatizar a triagem dos alertas de Backup; revisar a régua de prioridade, com critério e fila própria para “Alta”; medir e orçar a atividade interna; revisar os contratos dos clientes do topo do Pareto; e registrar no Movidesk a primeira resposta e o fechamento, para ter SLA de verdade.

## Bloco 8 — Contribuições e experiência (7:35 – 8:30) · Slide 15

> Para a Infomach, fica uma visão de gestão que não existia, um painel que se atualiza com dois comandos e cinco ações priorizadas. Para mim, o maior aprendizado foi começar pelas perguntas da gestão, e não pelo dado, e descobrir que, para a diretoria, um gráfico com uma mensagem clara vale mais que dez gráficos completos.

## Bloco 9 — Encerramento (8:30 – 8:50) · Slide 16

> O gargalo não é esforço, é fila, e agora a Infomach consegue ver essa fila. O código e o painel estão no repositório da tela. Obrigado.

---

### Dicas de gravação

- Grave cada bloco separadamente e junte depois: errar fica barato.
- Na demonstração, mova o mouse devagar e espere a animação do gráfico terminar antes de falar o número.
- Se o vídeo tiver limite de tempo, corte primeiro o modo escuro e o slide 8.
