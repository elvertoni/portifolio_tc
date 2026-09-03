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
| `--ink` | `#141414` | Fundo principal da página e `<body>` |
| `--ink-deep` | `#0d0d0d` | Poços e superfícies profundas: `#loader`, `#drawer`, `#cta`, `footer` |
| `--panel` | `#1c1c1e` | Superfície primária de cards (`.box`, `.phase`, `.stat`) |
| `--panel-2` | `#232326` | Superfície elevada para hovers e estados ativos |
| `--line` | `rgba(255, 255, 255, .11)` | Bordas padrão, divisórias e regras horizontais |
| `--line-2` | `rgba(255, 255, 255, .20)` | Bordas de foco/hover de chips, botões fantasmas e navegação |
| `--bone` | `#f4f3f0` | Tipografia primária (títulos, dados-chave) e botão padrão |
| `--muted` | `#8e8e95` | Tipografia secundária (parágrafos, legendas descritivas) |
| `--dim` | `#5c5c63` | Tipografia terciária (metadados, numeração técnica) |
| `--signal` | `#fb3732` | Acento primário de destaque, eyebrows, wipe de botão, seleções |
| `--amber` | `#ffa31a` | Acento complementar para status e estrelas |

### 2. Tipografia

- **Display Font (`--font-display`):** `Archivo` (pesos 400 a 900) via Google Fonts.
  - Usada para títulos de impacto, números de contadores e logo.
  - Classes: `.d-mega`, `.d-xl`, `.d-lg`, `.d-md`, `.d-sm`.
- **Monospace Font (`--font-mono`):** `JetBrains Mono` (pesos 300 a 700) via Google Fonts.
  - Usada para o corpo do texto, botões, chips, metadados e tags.
  - Classes: `.mono-md`, `.mono-sm`, `.mono-xs`.

### 3. Curvas de Motion (`cubic-bezier`)

| Curva | Definição | Caso de Uso |
|---|---|---|
| `--e-out` | `cubic-bezier(.16, 1, .3, 1)` | Entradas de tela, reveals (`[data-rise]`, `[data-mask]`) e hovers de cards |
| `--e-io` | `cubic-bezier(.76, 0, .24, 1)` | Transições de estado comandadas (wipe de `.btn`, preloader, drawer) |
| `--e-soft`| `cubic-bezier(.25, .46, .45, .94)` | Hovers curtos de cor e borda (`.chip`, `.navchain a`, `.hdr`) |

---

## 🏗️ Estrutura do Projeto

```plaintext
portifolio_tc/
├── .agent/                  # Configurações de agentes, workflows e regras de IA
├── assets/
│   ├── css/
│   │   └── style.css        # CSS unificado com design tokens e componentes
│   ├── js/
│   │   └── main.js          # Runtime JS (rAF loop, reveal, partículas, form)
│   └── favicon.svg          # Favicon vetorial
├── design-system/
│   └── design-system.html   # Espelho de referência completo do Volta Atelier
├── .dockerignore            # Regras de exclusão do Docker
├── Dockerfile               # Configuração Nginx Alpine para produção
├── index.html               # Estrutura HTML semântica completa
├── README.md                # Documentação técnica e operacional (este arquivo)
└── CODEBASE.md              # Mapeamento técnico e arquitetura de código
```

---

## 🧩 Componentes e Funcionalidades

### 1. Preloader de Alta Fidelidade (`#loader`)
- Animação de contagem numérica fluida de `000` a `100` com easing cúbico.
- Barra de carregamento com preenchimento em `--signal`.
- Trava de scroll no `<body>` até conclusão do ciclo com saída em slide-up.

### 2. Mobiliário Fixo & Efeitos Visuais
- **Film Grain (`.grain`):** Camada procedural animada em SVG com blending overlay para textura analógica sutil.
- **Vignette (`.vignette`):** Gradiente radial periférico sutil para foco central.
- **Frame Marks (`.frame-mark`):** Marcas de corte e registro gráfico nos quatro cantos da viewport (`fm-tl`, `fm-tr`, `fm-bl`, `fm-br`).

### 3. Header & Navegação
- **Marca (`.mark`):** Logo `T — C` com barra horizontal dinâmica que se expande e troca de cor para `--signal` no hover.
- **Navchain (`.navchain`):** Pílulas translúcidas encadeadas com blur de fundo e indicador dinâmico de seção ativa via `IntersectionObserver`.
- **Mobile Drawer (`#drawer`):** Menu fullscreen com animação de corte `clip-path` e tipografia display escalonada.

### 4. Hero Section
- **Tipografia Display Dupla:** Palavras gigantes `TONI` e `COIMBRA` ancoradas nos vértices.
- **Partículas de Poeira (`#dust`):** Canvas 2D ambiente com geração orgânica de partículas flutuantes.
- **Relógio de Precisão:** Horário oficial de Brasília (BRT) atualizado segundo a segundo.
- **Floating Contact Dock (`.dock`):** Avatar, micro-animação contínua de flutuação e balão de fala com ciclo programado.

### 5. Seção Sobre & Métricas
- **Wordwash (`.wordwash`):** Efeito de reveal que acende palavra por palavra conforme o usuário rola a página através da viewport central.
- **Contadores Animados (`.stat b[data-count]`):** Números que incrementam de 0 até o valor final (`20+`, `200K+`, etc.) no momento da visualização.

### 6. Tech Stack & Experiência
- **Phase Cards (`.phase`):** Cards estruturados com identificador numérico, barra de progresso com animação expansiva no hover e tags categorizadas.

### 7. Projetos em Destaque
- **Projeto Primário em Destaque (ProfessorDash):** Card hero com badge de status em tempo real e link direto para a aplicação em produção.
- **Projetos de IA & Automação:** Detalhamento das soluções implementadas no TJPR e pipelines de visão computacional.

### 8. Formulário de Contato Inteligente
- Totalmente integrado ao serviço **Web3Forms**.
- Proteção anti-spam via honeypot (`botcheck`).
- Respostas visuais em tempo real no próprio card sem recarregar a página.
- Botão com física magnética (`.magnet`), seguindo suavemente o cursor do mouse em dispositivos de ponteiro fino.

### 9. Footer
- **Marquee Contínuo:** Faixa tipográfica animada em loop infinito.
- **Relógio Secundário:** Sincronizado com fuso horário local.
- **Botão Voltar ao Topo (`.totop`):** Ação suave de retorno ao topo.

---

## ♿ Acessibilidade e Performance

- **`prefers-reduced-motion`:** Respeito absoluto às preferências do sistema do usuário — desativa transições lentas, desliga ruído/grain, congela balões flutuantes e assegura que todos os elementos com reveal estejam instantaneamente visíveis.
- **Sem Frameworks:** Zero dependência de bibliotecas pesadas de terceiros (Tailwind CDN, FontAwesome, React), garantindo First Contentful Paint (FCP) abaixo de 0.5s e pontuação máxima no Lighthouse.
- **Semântica HTML5:** Utilização rigorosa de tags `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, além de atributos ARIA apropriados (`aria-expanded`, `aria-hidden`, `aria-label`).

---

## 📬 Contato e Redes

- **LinkedIn:** [linkedin.com/in/elvertoni](https://www.linkedin.com/in/elvertoni/)
- **GitHub:** [github.com/elvertoni](https://github.com/elvertoni)
- **ProfessorDash:** [aulas.tonicoimbra.com](https://aulas.tonicoimbra.com)

---

*© Toni Coimbra. Todos os direitos reservados.*
