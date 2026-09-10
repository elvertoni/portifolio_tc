# Revisão de design do portfólio

Referência: `design-system.html`. Implementação: `../index.html`,
`../assets/css/style.css` e `../assets/js/main.js`.

## Direção

Um portfólio editorial que aproxima a experiência gráfica de Toni Coimbra
da sua atuação em desenvolvimento, automação e inteligência artificial.
Preservam-se Archivo, JetBrains Mono, preto, branco quente, vermelho de
sinalização e a marca existente.

A assinatura tipográfica ocupa a largura da abertura. A composição de imagens
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

## Verificação

`npm test -- --output=test-results/smoke` executa 24 testes Playwright.
Há cobertura de 320 a 1920 px, navegação, menu, movimento reduzido,
conteúdo sem JavaScript, formulário e o catálogo de design system em
desktop/mobile, além do comportamento do runtime (suspensão do loop de
animação, foco levado à seção e bloqueio de envio duplicado). Os envios são
interceptados: nenhuma mensagem real é enviada durante os testes.

As conferências visuais usam desktop, tablet e celular. Capturas locais ficam
em `test-results/`, que não deve ser versionado.

O detector da skill Impeccable executou em modo limitado porque seus parsers
opcionais não estavam disponíveis. Ele não substitui a inspeção no navegador.
Esta revisão não inclui auditoria WCAG certificada, medição de Core Web Vitals
em produção ou comprovação independente dos resultados profissionais citados.
