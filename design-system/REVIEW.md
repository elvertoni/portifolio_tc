# Revisão de design do portfólio

Referência: `design-system.html`. Implementação: `../index.html`,
`../assets/css/style.css` e `../assets/js/main.js`.

## 2026-11-12 — Revisão completa (auditoria front-end + crítica Impeccable)

- **Um amarelo por tela, de fato.** O diagrama da abertura passou a tinta (conectores
  em `--color-border-interactive`, traço de ênfase em `--color-text`), o ponto saiu de
  "A lógica do código", as setas dos projetos ficam em `--muted` e só acendem no card
  apontado, os asteriscos da faixa do rodapé ficaram `--dim`, e no contato o título e o
  chip do LinkedIn deixaram o amarelo para o botão de envio. O ponto da assinatura e o
  C da marca continuam amarelos.
- **Abertura alinhada à coluna.** `#hero` usa a mesma borda esquerda de `.shell`
  (1320px); a assinatura foi limitada a 180px, o máximo que cabe nessa coluna.
- **Títulos.** Os passos do diagrama deixaram de ser `h2` antes do `h1` (agora
  `.workflow-title`); os títulos do rodapé são `h2`.
- **Formulário.** Erro ligado ao campo só enquanto vale, região viva presente desde a
  carga, botão ocupado com `aria-disabled`, contorno de foco no campo inválido, mínimo
  de 10 caracteres dito na mensagem e aplicado por `minlength`.
- **Servidor.** 404 real com `404.html`, dotfiles bloqueados, CSP na página
  principal, `robots.txt`, `sitemap.xml`, ícones PNG e `**/*.md` no `.dockerignore`.
- **Segunda passada.** Os passos do diagrama passaram a carregar fatos que o site já
  afirma (200 mil PDFs, milhares de horas, quatro sistemas); saíram o slogan e o link
  repetido do rodapé da abertura e a legenda do diagrama; o contato ganhou uma linha
  sobre para onde vai a resposta; a faixa do rodapé pausa no hover e por um botão
  (`#marquee-toggle`, WCAG 2.2.2); o `og.png` perdeu o relógio congelado e o "não com
  um formulário", que contradizia o site. 34 testes.
- Ainda dependem do Toni: prazo de resposta e e-mail direto no contato.

## 2026-11-12 — Fluxo vetorial na abertura

A colagem abstrata foi substituída por Organizar → Automatizar → Entregar,
com geometria SVG e texto HTML. Fluxo horizontal no desktop e vertical no
celular. Paralaxe removido; as capas dos projetos continuam nos respectivos
cards. Verificação visual a 390 e 1440px; 33 testes passaram, incluindo
limites do diagrama a 320/390/768/1440px e ausência de frames contínuos.

## 2026-11-12 — Refinamentos após revisão

- Captura do ProfessorDash atualizada a partir do portal publicado, em WebP 800 e 1600px.
- Assinatura com mais espaço entre as palavras em telas pequenas e tracking de -0.04em.
- Legenda da colagem em duas linhas no celular para distinguir os dois textos.
- Assets versionados com data e revisão (YYYYMMDDNN), incluindo o catálogo.
- Conferência visual a 390 e 1440px; documento autônomo regenerado.

## 2026-11-12 — Caderno Noturno substitui o Volta Atelier

O portfólio passa a usar o Caderno Noturno (DS v4), o design system que o
ProfessorDash adotou no portal inteiro (decisões D.16–D.20 daquele
repositório). Três escolhas do Toni definiram o recorte:

- **Marca:** o monograma TC desenhado por ele no CorelDRAW substitui a
  ligadura. `assets/logo.svg` e `assets/favicon.svg` usam os mesmos caminhos
  do ProfessorDash; o T troca entre papel e tinta por `prefers-color-scheme`,
  o C é sempre amarelo. A seção `#marca` do catálogo foi reescrita com a
  construção medida no próprio SVG (altura 80, traço único 20, fenda 7,5).
  `design-system/marca-canvas/`, fonte da ligadura, saiu do working tree.
- **Tema:** só o noturno — o tema que o portal mostra ao visitante. Não há
  tema papel nem alternador.
- **Documentação:** o catálogo passou a documentar o Caderno Noturno com as
  mesmas contagens que o teste fixa. O documento autônomo agora é
  `caderno-noturno.html`, **gerado** por `compilar-caderno.mjs`
  (`npm run build:doc`) a partir dos arquivos que o site serve, com as três
  fontes e as oito imagens embutidas. `volta-atelier.html` saiu do working
  tree.

O que mudou na folha, além dos valores dos tokens:

- Geist no texto corrido e na interface; `.mono-md`/`.mono-sm` viraram
  `.body-md`/`.body-sm`. JetBrains Mono fica no rótulo curto (`.mono-xs`,
  12px, caixa alta, cor neutra) e no código. Medida de leitura em `rem`.
- Archivo 800 em caixa de frase. A assinatura `Toni Coimbra.` saiu das
  pontas da linha e foi para a esquerda: sem a caixa alta, as duas palavras
  separadas abriam um buraco no meio do nome.
- Botão em pílula com o amarelo chapado e texto `#1b1500`; o wipe vermelho
  saiu. Chip de destaque tingido, não preenchido.
- Cabeçalho e gaveta sempre em `--color-night`; navegação em texto com ativo
  discreto. A gaveta entra por opacidade e deslocamento, não por `clip-path`.
- Ornamentos removidos: brilho e fio de luz no topo de `.box`, halo vermelho
  e giro do logo no hover.
- Vermelho só como erro (`--color-danger`); foco azul na página e amarelo na
  barra noturna. Os apelidos antigos continuam, mas `--signal` agora é o
  amarelo de ação.
- `assets/og.png` regenerado a partir de `og-card.html` com a paleta e o selo
  novos.

Verificação: 33/33 testes; auditoria de contraste com cores computadas em
`index.html`, no catálogo e no documento autônomo, a 390 e 1440px — zero
textos abaixo de AA depois de corrigir o separador do topo do herói (estava
em `--dim-line`, 2,3:1); nenhuma rolagem horizontal a 320, 390 e 1440px;
botões Copiar do documento levados a 44px.

Ficou de fora, de propósito: o paralaxe de ponteiro da colagem e a faixa de
palavras em laço do rodapé. O Caderno pede home sem animação contínua, mas os
dois são comportamento testado do site, não ornamento de cor — removê-los é
uma decisão à parte. As capas editoriais e a captura do ProfessorDash ainda
mostram vermelho porque são imagens da era Volta.

## Direção

Um portfólio editorial que aproxima a experiência gráfica de Toni Coimbra
da sua atuação em desenvolvimento, automação e inteligência artificial. Desde
2026-11-12, no Caderno Noturno: azul-noite, amarelo de ação, Archivo, Geist e
o monograma TC compartilhado com o ProfessorDash. O registro abaixo descreve
a fase Volta Atelier e fica como histórico.

A assinatura tipográfica abre a página. A composição de imagens
mantém profundidade e reação ao ponteiro, com uma versão estática para quem
prefere movimento reduzido. As capas são imagens conceituais; as capturas nos
projetos mostram as interfaces reais.

## Principais mudanças

- **Sistema visual:** tokens semânticos de cor, tipografia, espaçamento, raios,
  bordas e motion foram consolidados em `assets/css/style.css`, mantendo
  aliases compatíveis com os componentes existentes.
- **Marca:** a ligadura TC entrou no catálogo com construção, escada de redução,
  provas em fundo escuro, claro e monocromático, lockups com respiro e regras de
  uso. As provas carregam `assets/logo.svg` e `assets/favicon.svg` — o catálogo
  não guarda cópia do desenho, e um teste garante isso.
- **Catálogo:** `design-system.html` passou a documentar os tokens públicos,
  escalas tipográficas, ritmo, superfícies, ações, chips, campos e estados
  em uma página responsiva que consome a folha canônica.
- **Primeira impressão:** apresentação profissional, chamada para os projetos
  e assinatura integram uma composição com hierarquia clara.
- **Sequência:** projetos imediatamente depois da abertura; trajetória,
  ferramentas e formação sustentam o trabalho apresentado.
- **Projetos:** ProfessorDash recebe destaque, capturas ficam mais legíveis,
  títulos ganham escala e setas identificam os links de saída.
- **Ritmo:** linhas e espaço substituem caixas repetidas em competências,
  experiência e indicadores. A seção de contato usa duas colunas no desktop.
- **Leitura:** contraste dos textos secundários aumentado; parágrafos não
  dependem de animação palavra a palavra para serem lidos.
- **Desempenho:** abertura sem espera artificial, fonte principal pré-carregada
  e remoção de funções de efeitos sem uso. Imagens e fontes continuam locais.
- **Acessibilidade:** conteúdo disponível sem JavaScript, foco visível,
  navegação por teclado e fechamento do menu ao mudar para desktop.
- **Galeria em arco:** o carrossel 3D e o tratamento de hover sobre imagens que
  viveram no catálogo antigo voltaram como componente reutilizável em `#galeria`,
  para superfícies com muitas imagens. Voltaram redesenhados, não recolados: a
  geometria do anel é a mesma (`SPREAD` reduzido de 34° para 26° e raio medido no
  palco, não na janela, porque aqui a galeria vive dentro de uma coluna), mas o
  componente ganhou trilho como estado base, navegação por teclado, região viva,
  `inert` nas fichas de trás e um laço que dorme fora da tela. As fichas guardam a
  proporção da própria imagem — forçar um recorte comum transformava as capturas
  de tela largas em tarja ilegível — com teto de altura para a imagem quadrada, e
  o registro sobre a imagem apoia-se num véu de contraste em vez de contar com a
  sorte do conteúdo. O portfólio não carrega nada disso: o componente existe para
  ser copiado por outros projetos.

## Verificação

`npm test -- --output=test-results/smoke` executa 33 testes Playwright.
Há cobertura de 320 a 1920 px, navegação, menu, movimento reduzido,
conteúdo sem JavaScript, formulário e o catálogo de design system em
desktop/mobile, além do comportamento do runtime (suspensão do loop de
animação, foco levado à seção e bloqueio de envio duplicado) e da galeria em
arco (montagem do anel, teclado, trilho sem JavaScript, ausência de quadros sob
movimento reduzido e suspensão fora da tela). Os envios são interceptados:
nenhuma mensagem real é enviada durante os testes.

As conferências visuais usam desktop, tablet e celular. Capturas locais ficam
em `test-results/`, que não deve ser versionado.

O detector da skill Impeccable executou em modo limitado porque seus parsers
opcionais não estavam disponíveis. Ele não substitui a inspeção no navegador.
Esta revisão não inclui auditoria WCAG certificada, medição de Core Web Vitals
em produção ou comprovação independente dos resultados profissionais citados.
