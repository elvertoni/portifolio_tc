# Toni Coimbra — Portfólio Profissional

> Portfólio pessoal e profissional de Toni Coimbra — Especialista em IA & Automação, Professor de Desenvolvimento de Sistemas e Desenvolvedor Python.

Construído com base no **Volta Atelier Design System**, uma abordagem estética *brutalist-editorial* caracterizada por tipografia técnica refinada, fundo escuro quente (`#141414`), acento expressivo vermelho vibrante (`#fb3732`), micro-animações ricas e alta performance com **Vanilla CSS & JS puro**, sem frameworks ou dependências pesadas.

---

## ⚡ Quick Start

### 1. Execução Local Simples
Como o projeto é estático puro, não necessita de etapas de build (`npm install`, `vite`, etc.):
- Abra o arquivo `index.html` diretamente em seu navegador favorito, ou:
- Use a extensão **Live Server** (VS Code / Antigravity) ou qualquer servidor estático local:
  ```bash
  # Exemplo com Python:
  python -m http.server 8080
  # Acesse: http://localhost:8080
  ```

### 2. Execução com Docker / Produção
O projeto inclui um `Dockerfile` leve baseado em Alpine Linux com Nginx:

```bash
# Construir a imagem
docker build -t portifolio-tc .

# Executar o container
docker run -d -p 8080:80 --name portifolio portifolio-tc

# Acessar:
# http://localhost:8080
```

### 3. Testes de fumaça
Após instalar as dependências de desenvolvimento, execute os cenários de carregamento, navegação mobile e reduced motion:

```bash
npm install
npm run test:smoke
```

---

## 🎨 Design System — Volta Atelier

O portfólio segue estritamente os padrões e design tokens do **Volta Atelier**.

### 1. Paleta de Cores e Tokens CSS (`:root`)

| Token | Valor Hex/RGBA | Aplicação |
|---|---|---|
| `--color-bg` | `#141414` | Fundo principal e áreas de leitura |
| `--color-bg-deep` | `#0d0d0d` | Rodapé, drawer móvel e superfícies profundas |
| `--color-surface` | `#1c1c1e` | Superfície padrão de cards, campos e blocos |
| `--color-surface-raised` | `#232326` | Superfície elevada em hover e foco |
| `--color-border` | `rgba(255, 255, 255, .11)` | Bordas decorativas e divisórias |
| `--color-border-strong` | `rgba(255, 255, 255, .20)` | Bordas de estados elevados |
| `--color-border-interactive` | `rgba(255, 255, 255, .34)` | Limites de controles, chips e campos |
| `--color-text` | `#f4f3f0` | Títulos, dados principais e ações primárias |
| `--color-text-muted` | `#a5a5ac` | Parágrafos, legendas e descrições |
| `--color-text-subtle` | `#8d8d96` | Metadados e informação terciária |
| `--color-accent` | `#fb3732` | Sinal visual, marca e atenção |
| `--color-accent-strong` | `#d1211d` | Preenchimentos com texto branco |
| `--color-accent-text` | `#ff5c57` | Acento vermelho usado como texto |
| `--color-warning` | `#ffa31a` | Avisos e atenção |
| `--color-success` | `#4ade80` | Confirmações e sucesso |

Os aliases curtos (`--ink`, `--panel`, `--bone`, `--signal` e equivalentes) permanecem para compatibilidade com os componentes existentes. Para novas implementações, prefira os nomes semânticos.

### 2. Tipografia

- **Display Font (`--font-display`):** `Archivo` (pesos 700 a 800) servida localmente por `assets/fonts/archivo-latin.woff2`.
  - Usada para títulos de impacto, números de contadores e logo.
  - Classes: `.d-mega`, `.d-xl`, `.d-lg`, `.d-md`, `.d-sm`.
- **Monospace Font (`--font-mono`):** `JetBrains Mono` (pesos 400 a 500) servida localmente por `assets/fonts/jetbrains-mono-latin.woff2`.
  - Usada para o corpo do texto, botões, chips, metadados e tags.
  - Classes: `.mono-md`, `.mono-sm`, `.mono-xs`.

### 3. Espaçamento, forma e comportamento

Use a escala `--space-1` a `--space-16` (4px a 64px) para gaps, margens e
preenchimentos. A página mantém gutters e seções fluidos com `--gut` e
`--rail`; não crie uma medida isolada quando um passo existente resolver.

Os raios têm intenção definida: `--radius-control` para campos e mensagens,
`--radius-surface` para cards, `--radius-emphasis` para blocos destacados e
`--radius-media` para recortes de imagem. `--radius-pill` fica reservado a
controles pequenos, como botões, chips e navegação.

As curvas `--e-out`, `--e-io` e `--e-soft` continuam sendo a API de motion.
Componentes interativos devem declarar foco, estado desabilitado, carregamento
e movimento reduzido; `--tap` define o alvo mínimo de 44px.

### 4. Curvas de Motion (`cubic-bezier`)

| Curva | Definição | Caso de Uso |
|---|---|---|
| `--e-out` | `cubic-bezier(.16, 1, .3, 1)` | Entradas de tela, reveals (`[data-rise]`, `[data-mask]`) e hovers de cards |
| `--e-io` | `cubic-bezier(.76, 0, .24, 1)` | Transições de estado comandadas (wipe de `.btn`, drawer, barras de `.phase`) |
| `--e-soft`| `cubic-bezier(.25, .46, .45, .94)` | Hovers curtos de cor e borda (`.chip`, `.navchain a`, `.hdr`) |

---

O catálogo vivo em [`design-system/design-system.html`](design-system/design-system.html)
mostra os tokens públicos e os componentes reutilizáveis. Ao criar uma nova
interface, consulte-o primeiro e implemente no CSS canônico antes de duplicar
um padrão em outra página.

## 🏗️ Estrutura do Projeto

```plaintext
portifolio_tc/
├── assets/
│   ├── css/style.css        # CSS unificado: tokens, componentes, skins de seção
│   ├── js/main.js           # Runtime JS (rAF loop, reveal, relógio, contadores, form)
│   ├── js/gallery.js        # Galeria em arco autônoma (só o catálogo carrega)
│   ├── fonts/               # Archivo e JetBrains Mono em .woff2 (subset latin)
│   ├── img/                 # Capturas dos produtos e capas conceituais (.webp)
│   ├── logo.svg             # Lockup 200×128 da ligadura TC
│   ├── favicon.svg          # Corte de 16px da marca
│   └── og.png               # Social preview, gerado por design-system/og-card.html
├── design-system/
│   ├── design-system.html   # Catálogo visual que consome o CSS canônico
│   ├── og-card.html         # Fonte 1200×630 do assets/og.png
│   ├── marca-canvas/        # Fonte da verdade da marca: construção e provas
│   └── REVIEW.md            # Registro das decisões de design
├── tests/
│   ├── smoke.spec.mjs       # Suíte Playwright (roda em file://, sem servidor)
│   ├── runtime.spec.mjs     # Testes de comportamento do runtime (loop, foco, envio)
│   └── gallery.spec.mjs     # Testes da galeria em arco (anel, teclado, trilho)
├── Dockerfile               # Configuração Nginx Alpine para produção
├── nginx.conf               # Gzip, política de cache e headers de segurança
├── index.html               # Estrutura HTML semântica completa
├── README.md                # Documentação técnica e operacional (este arquivo)
├── CODEBASE.md              # Mapeamento técnico e arquitetura de código
├── CLAUDE.md / AGENTS.md    # Guias para agentes e contribuidores
└── PRODUCT.md               # Briefing de produto e marca
```

---

## 🧩 Componentes e Funcionalidades

### 1. Abertura sem espera
- Não há preloader. O conteúdo é pintado direto e o runtime marca `<html class="js">`, que habilita as animações no CSS.
- Ambas as fontes (Archivo e JetBrains Mono) são pré-carregadas, então a primeira pintura já sai na tipografia final.

### 2. Composição do herói (`.collage`)
- Três capas conceituais em `.tile`, com paralaxe de ponteiro suavizada por um único loop de `requestAnimationFrame`.
- O loop só é iniciado se algum efeito se registrar: em ponteiro grosso ou com `prefers-reduced-motion` a composição fica estática e nenhum frame é agendado.
- A legenda (`.art-caption`) é uma linha em fluxo abaixo do quadrado, nunca uma camada sobre ele.

### 3. Header & Navegação
- **Marca (`.mark`):** Ligadura `TC` que inclina e ganha halo em `--signal` no hover, com alvo de toque ampliado por pseudo-elemento.
- **Navchain (`.navchain`):** Links em texto, sem caixa, com a seção ativa marcada em `--signal-text` e `aria-current="location"` via `IntersectionObserver`.
- **Mobile Drawer (`#drawer`):** Menu fullscreen com animação de corte `clip-path` e tipografia display escalonada.

### 4. Hero Section
- **Assinatura tipográfica (`.hero-name`):** `TONI COIMBRA` ocupando a largura da abertura, com o ponto em `--signal`.
- **Relógio de Precisão:** Horário oficial de Brasília (BRT) atualizado segundo a segundo, pausado em aba oculta.
- **Chamadas diretas:** `Ver projetos` e `Vamos conversar` no bloco de introdução, mais o link de descida na linha inferior.

### 5. Seção Sobre & Métricas
- **Contadores Animados (`.stat b[data-count]`):** Números que incrementam de 0 até o valor final (`20+`, `200K+`, etc.) no momento da visualização. Com movimento reduzido o valor final aparece direto, com a mesma tipografia.

### 6. Tech Stack & Experiência
- **Phase Cards (`.phase`):** Cards estruturados com identificador numérico, barra de progresso com animação expansiva no hover e tags categorizadas.

### 7. Projetos em Destaque
- **ProfessorDash:** Portal do Aluno e gestão para professores da rede pública com Google OAuth, apostilas HTML e tarefas (`prof.tonicoimbra.com`).
- **eSIMBA:** Monitoramento de benefícios e acolhimento com acesso institucional e trilha de auditoria (`e-simba.com.br`).
- **Vitalis:** Central pessoal de saúde com controle de exames, tratamentos, treinos e lembretes (`vitalis.tonicoimbra.com`).
- **Noivas & Cia:** Gestão comercial e controle de locação para aluguel de trajes e acessórios (`noivaseciabandeirantes.com.br`).
- **Imagens Otimizadas:** Todas as capturas em formato WebP responsivo (`1x` e `@2x` retina), garantindo carregamento instantâneo (< 35 KB cada).

### 8. Formulário de Contato Inteligente
- Totalmente integrado ao serviço **Web3Forms** com validação client-side em tempo real.
- Proteção anti-spam via honeypot (`botcheck`).
- Respostas visuais em verde acessível (`--ok`) no próprio card sem recarregar a página; falha e timeout preservam a mensagem digitada.
- Envio nativo para o Web3Forms permanece como fallback quando o JavaScript não está disponível.

### 9. Footer
- **Faixa de palavras-chave (`.marquee`):** Banda tipográfica estática alinhada à calha da página, com o excedente dissolvido por máscara na borda direita.
- **Relógio Secundário:** Sincronizado com fuso horário oficial de Brasília (BRT).
- **Botão Voltar ao Topo (`.totop`):** Ação suave de retorno ao topo.

### 10. Galeria em arco (`.gallery`) — catalogada, não usada no portfólio

Componente reutilizável para superfícies com muitas imagens, demonstrado em
[`design-system/design-system.html#galeria`](design-system/design-system.html).
O portfólio não o carrega: ele existe para ser copiado por outros projetos.

- **Consumo:** copie o bloco `GALERIA EM ARCO` de `assets/css/style.css` e o
  arquivo `assets/js/gallery.js`. Sem etapa de compilação, sem dependência de
  `main.js`; o script liga sozinho em qualquer elemento com `data-gallery`.
- **Marcação:** `[data-gallery-stage]`, `[data-gallery-track]` e uma `.gcard` por
  item. `data-gallery-title` nomeia a ficha na região viva; sem ele o `alt`
  assume. Controles opcionais: `[data-gallery-prev]`, `[data-gallery-next]`,
  `[data-gallery-status]`.
- **Variáveis do componente:** `--gallery-card` (largura da ficha),
  `--gallery-card-max` (teto de altura), `--gallery-ground` (fundo contra o qual
  as bordas do palco desvanecem) e `--gallery-radius`.
- **Dois estados:** o CSS declara um trilho com `scroll-snap`; o script
  acrescenta `.is-live` e só então as fichas entram no anel 3D. Sem JavaScript
  ou sob `prefers-reduced-motion`, o trilho é o que fica — e nenhum quadro é
  agendado.
- **Entradas:** arrasto, roda horizontal, botões, setas do teclado e `Home`/`End`.
  A deriva lenta para enquanto o foco está dentro do palco.

---

## 🧪 Testes Automatizados (Playwright)

O projeto conta com uma suíte de testes de fumaça (smoke tests) para validar regressão visual, acessibilidade, responsividade e degradação:

```bash
# Executar a suíte de testes do Playwright
npm test

# Ou diretamente:
npm run test:smoke
```

---

## ♿ Acessibilidade e Performance

- **`prefers-reduced-motion`:** Respeito absoluto às preferências do sistema do usuário — para o movimento contínuo e o paralaxe, reduz as transições a mudanças curtas de cor e borda, e assegura que todo elemento com reveal já esteja visível.
- **Fontes Locais WOFF2:** Arquivos `archivo-latin.woff2` e `jetbrains-mono-latin.woff2` servidos localmente com `font-display: swap`, eliminando chamadas externas ao Google Fonts.
- **Zero Frameworks em Runtime:** Zero dependência de bibliotecas pesadas de terceiros (Tailwind CDN, FontAwesome, React), garantindo First Contentful Paint (FCP) abaixo de 0.5s e pontuação máxima no Lighthouse.
- **Degradação No-JS:** Fallback transparente onde 100% do conteúdo é renderizado caso o JavaScript seja desativado.
- **Semântica HTML5 & WCAG AA:** Utilização rigorosa de tags semânticas, atributos ARIA apropriados (`aria-expanded`, `aria-hidden`, `aria-label`, `aria-invalid`), contraste de cores validado e áreas de toque com no mínimo 44px (`--tap`).

---

## 📬 Contato e Redes

- **LinkedIn:** [linkedin.com/in/elvertoni](https://www.linkedin.com/in/elvertoni/)
- **GitHub:** [github.com/elvertoni](https://github.com/elvertoni)
- **ProfessorDash:** [prof.tonicoimbra.com](https://prof.tonicoimbra.com)
- **Noivas & Cia:** [noivaseciabandeirantes.com.br](https://noivaseciabandeirantes.com.br)

---

*© Toni Coimbra. Todos os direitos reservados.*
