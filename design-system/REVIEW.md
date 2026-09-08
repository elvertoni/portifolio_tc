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

`npm test -- --output=test-results/smoke` executa 15 testes Playwright.
Há cobertura de 320 a 1920 px, navegação, menu, movimento reduzido,
conteúdo sem JavaScript e formulário. Os envios são interceptados: nenhuma
mensagem real é enviada durante os testes.

As conferências visuais usam desktop, tablet e celular. Capturas locais ficam
em `test-results/`, que não deve ser versionado.

O detector da skill Impeccable executou em modo limitado porque seus parsers
opcionais não estavam disponíveis. Ele não substitui a inspeção no navegador.
Esta revisão não inclui auditoria WCAG certificada, medição de Core Web Vitals
em produção ou comprovação independente dos resultados profissionais citados.
