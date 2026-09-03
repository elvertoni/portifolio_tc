# CODEBASE.md — Arquitetura & Guia Técnico do Código

> Documento de referência técnica para desenvolvedores e agentes IA que operam no repositório `portifolio_tc`.

---

## 1. Visão Geral da Arquitetura

O projeto adota uma arquitetura **Jamstack estática de alta fidelidade**, sem frameworks JS (React/Vue) e sem pré-processadores ou utilitários CSS em runtime (Tailwind CDN removido). Todo o visual e comportamento são implementados em **Vanilla HTML5, CSS3 moderno e JavaScript ES6+**.

```
                         ┌───────────────┐
                         │  index.html   │ (Estrutura Semântica + IDs)
                         └───────┬───────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │ assets/css/       │           │ assets/js/        │
       │ style.css         │           │ main.js           │
       │                   │           │                   │
       │ - Tokens (:root)  │           │ - Central rAF Loop│
       │ - Archivo & Mono  │           │ - Observer Engine │
       │ - Layout & Grid   │           │ - Canvas Dust FX  │
       │ - Componentes     │           │ - Web3Forms Ajax  │
       └───────────────────┘           └───────────────────┘
```

---

## 2. Mapa de Arquivos & Dependências

| Arquivo | Função Principal | Dependentes / Relações |
|---|---|---|
| [`index.html`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/index.html) | Ponto de entrada do DOM, estrutura das seções | Carrega `style.css` e `main.js`. Usa fontes locais em `assets/fonts/` |
| [`assets/css/style.css`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/assets/css/style.css) | Folha de estilos unificada (Tokens, Reset, Componentes, Layout) | Referenciado por `index.html`. Governa todos os nós do DOM |
| [`assets/js/main.js`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/assets/js/main.js) | Lógica interativa, animações, motor de reveal, validação e formulário | Referenciado por `index.html` com `defer`. Altera classes `.is-in`, `.stuck`, `.open` |
| [`assets/img/`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/assets/img/) | Capturas reais dos produtos em produção (`.webp` e `@2x.webp`) | Exibidas na grade de projetos com carregamento preguiçoso (`loading="lazy"`) |
| [`tests/smoke.spec.mjs`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/tests/smoke.spec.mjs) | Suíte de testes automatizados com Playwright | Executa validação de a11y, layout responsivo e reduced-motion via `npm test` |
| [`nginx.conf`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/nginx.conf) | Configuração de Nginx para produção com Gzip, cache e headers de segurança | Montado pelo `Dockerfile` |
| [`design-system/design-system.html`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/design-system/design-system.html) | Documentação viva de referência original (Volta Atelier) | Fonte da verdade para qualquer novo componente ou token |
| [`Dockerfile`](file:///c:/ARQUIVOS/PROJETOS/TONI/portifolio_tc/Dockerfile) | Configuração de empacotamento Nginx Alpine | Utilizado para deploy em container (EasyPanel / VPS) |

---

## 3. Mapeamento de Módulos JavaScript (`assets/js/main.js`)

O runtime é executado dentro de uma IIFE imediatamente invocada com `'use strict'`:

1. **`frame(now)` & `onTick(fn)`:** Loop central em `requestAnimationFrame` que consolida todas as atualizações contínuas em um único ciclo, evitando múltiplos timers desordenados. Desativado automaticamente sob `prefers-reduced-motion`.
2. **`initReveal()`:** `IntersectionObserver` único que adiciona a classe `.is-in` aos elementos decorados com `[data-rise]`, `[data-mask]`, `.stagger` ou `<section>`.
3. **`initLoader()`:** Preloader com easing out cúbico `1 - Math.pow(1 - t, 3)`, atualizando contagem `000` a `100`, barra `#loBar` e liberando o scroll do `<body>` via remoção da classe `is-locked`.
4. **`initHeader()`:** Monitoramento de rolagem para atribuir a classe `.stuck` (ativação de backdrop-filter e background translúcido) e toggle de acessibilidade no `#drawer` mobile.
5. **`initDust()`:** Canvas `#dust` com emissão e dissipação contínua de partículas com física de flutuação e opacidade em curva senoidal.
6. **`initWordwash()`:** Divide o parágrafo marcado como `.wordwash` em `<span>` individuais e ativa a classe `.lit` conforme o scroll atravessa o centro da viewport.
7. **`initCounters()`:** Animação de contagem numérica com easing cúbico para elementos com `[data-count]`.
8. **`initGhosts()`:** Geração de palavras-chave flutuantes em background no `#cta` com rotação aleatória e deriva orbital suave.
9. **`initMagnets()`:** Cálculo vetorial suave (`lerp` em 0.16) para botões que perseguem o cursor do mouse.
10. **`initForm()`:** Manipulador assíncrono `fetch` para envio via JSON para a API `https://api.web3forms.com/submit`.

---

## 4. Convenções e Regras de Estilo

### CSS
- **Tokens Primeiro:** Nunca utilize cores hexadecimais arbitrárias no corpo das classes. Use sempre as variáveis CSS declaradas em `:root` (`var(--bone)`, `var(--signal)`, `var(--panel)`, etc.).
- **Proibição de Roxo/Violeta:** Em conformidade com o design system Volta Atelier e diretrizes do projeto, o acento primário é sempre `--signal` (`#fb3732`) ou `--amber` (`#ffa31a`). Tons arroxeados/violetas estão banidos.
- **Tipografia Fluida:** Utilize sempre funções `clamp()` para tamanhos de fonte, garantindo escalabilidade harmoniosa entre mobile (320px) e monitores ultrawide (1560px+).

### HTML Semântico & Acessibilidade
- Todo elemento interativo deve ter um identificador descritivo e estados acessíveis (`aria-label`, `aria-expanded`, `aria-hidden`).
- O formulário deve conter honeypot anti-spam (`botcheck`) invisível para leitores de tela e robôs.

---

## 5. Fluxo de Deploy

O repositório é configurado para ser implantado diretamente em VPS ou plataformas como **EasyPanel**:
1. O Dockerfile compila uma imagem ultra-leve `nginx:alpine`.
2. Os arquivos estáticos são copiados diretamente para `/usr/share/nginx/html`.
3. A porta 80 é exposta com reinício automático e suporte HTTP/HTTPS gerenciado pelo proxy reverso.
