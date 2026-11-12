// Compila design-system/caderno-noturno.html: o design system inteiro num
// documento autônomo, para entregar a outro projeto ou a outra pessoa.
//
//   npm run build:doc
//
// O documento é um retrato, e retrato deriva. Por isso ele não é editado à
// mão: tudo o que pode mudar (tokens, folha, runtime da galeria, marca,
// imagens, fontes) é lido dos arquivos que o site serve e embutido aqui.
// O que este script escreve à mão é só a prosa. Um teste em
// tests/smoke.spec.mjs falha se o documento deixar de conter o :root atual e o
// gallery.js inteiro — quando ele falhar, rode este script de novo.
//
// Sem dependências: só node:fs e node:path, como o resto do repositório.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'design-system', 'caderno-noturno.html');

const ler = (rel) => readFileSync(join(RAIZ, rel), 'utf8').replace(/\r\n/g, '\n');
const base64 = (rel) => readFileSync(join(RAIZ, rel)).toString('base64');
const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;');
const svgUri = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);

/* ── Fontes da verdade ──────────────────────────────────────────────── */
const folhaSite = ler('assets/css/style.css');
const galeriaJs = ler('assets/js/gallery.js');
const logoSvg = ler('assets/logo.svg');
const faviconSvg = ler('assets/favicon.svg');
const LOGO = svgUri(logoSvg);
const SELO = svgUri(faviconSvg);

/* ── A folha em camadas ─────────────────────────────────────────────── */
// Cada camada começa num banner `/* ═══…` cuja linha seguinte dá o nome. O
// reset vem antes do primeiro banner, sob o comentário de cabeçalho do site.
const linhas = folhaSite.split('\n');
const banners = [];
linhas.forEach((l, i) => {
  if (l.startsWith('/* ═══') && i + 1 < linhas.length && !linhas[i + 1].includes('═══')) {
    banners.push({ i, nome: linhas[i + 1].trim().split(' — ')[0] });
  }
});
const camada = (nome) => {
  const k = banners.findIndex((b) => b.nome === nome);
  if (k < 0) throw new Error(`camada ausente em style.css: ${nome}`);
  const fim = k + 1 < banners.length ? banners[k + 1].i : linhas.length;
  return linhas.slice(banners[k].i, fim).join('\n').trim();
};
const resetIni = linhas.findIndex((l) => l.startsWith('/* ── Reset'));
const resetFim = banners.find((b) => b.nome === 'DESIGN TOKENS').i;
const RESET = '/* ═══════════════════════════════════════════════════════════════════\n'
  + '   RESET\n'
  + '   ═══════════════════════════════════════════════════════════════════ */\n'
  + linhas.slice(resetIni + 1, resetFim).join('\n').trim();

const C = {
  tokens: camada('DESIGN TOKENS'),
  reset: RESET,
  tipo: camada('TYPE SCALE'),
  primitivas: camada('SHARED PRIMITIVES'),
  stat: camada('STAT CARDS'),
  fase: camada('PHASE CARDS (Experience / Process)'),
  form: camada('FORM CONTROLS'),
  galeria: camada('GALERIA EM ARCO'),
  reveal: camada('REVEAL SYSTEM'),
  utilidades: camada('LAYOUT UTILITIES') + '\n\n' + camada('RESPONSIVE'),
  reduzido: camada('REDUCED MOTION')
};

const CABECALHO = `/* ═══════════════════════════════════════════════════════════════════
   CADERNO NOTURNO — folha portátil
   Design system de Toni Coimbra · tema noturno

   Extraída de portifolio_tc/assets/css/style.css por
   design-system/compilar-caderno.mjs. Contém o que é sistema: reset,
   tokens, escala tipográfica, primitivas, componentes e as regras de
   movimento reduzido. Ficou de fora o que é daquele site — herói, colagem,
   cartões de projeto, cabeçalho, rodapé e as folhas do catálogo.

   Ordem da cascata é contrato: reset, tokens, tipo, primitivas,
   componentes, reveal, utilidades, movimento reduzido. Cada seletor é
   declarado uma vez. Um bloco de correção no fim do arquivo é exatamente o
   que esta folha não tem — não crie um.

   As três @font-face apontam para ../fonts/. Ajuste o caminho ou troque
   pelo Google Fonts (Archivo 700..800, Geist 400..700, JetBrains Mono
   400..500).
   ═══════════════════════════════════════════════════════════════════ */`;

const FOLHA = [CABECALHO, C.reset, C.tokens, C.tipo, C.primitivas, C.stat, C.fase,
  C.form, C.galeria, C.reveal, C.utilidades, C.reduzido].join('\n\n') + '\n';

// Na página, as fontes viajam junto: o documento abre do disco, sem rede.
const FONTES = {
  'archivo-latin.woff2': base64('assets/fonts/archivo-latin.woff2'),
  'geist-latin-variable.woff2': base64('assets/fonts/geist-latin-variable.woff2'),
  'jetbrains-mono-latin.woff2': base64('assets/fonts/jetbrains-mono-latin.woff2')
};
const FOLHA_PAGINA = FOLHA.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (m, nome) => {
  if (!FONTES[nome]) throw new Error(`fonte não embutida: ${nome}`);
  return `url('data:font/woff2;base64,${FONTES[nome]}')`;
});

/* ── Tokens lidos do :root ──────────────────────────────────────────── */
const raiz = C.tokens.slice(C.tokens.indexOf(':root {'));
const token = (nome) => {
  const m = raiz.match(new RegExp(`^\\s*${nome}:\\s*([^;]+);`, 'm'));
  if (!m) throw new Error(`token ausente: ${nome}`);
  return m[1].trim();
};
const tokensDeCor = [...raiz.matchAll(/^\s*(--color-[a-z-]+):\s*([^;]+);/gm)]
  .map(([, nome, valor]) => ({ nome, valor: valor.trim() }));

/* ── Peças de HTML ──────────────────────────────────────────────────── */
const nLinhas = (s) => s.split('\n').length;
const codigo = (nome, src, nota = '', clip = true) => `<section class="doc-code">
  <header class="doc-code-bar">
    <span class="mono-xs doc-code-name">${esc(nome)}</span>
    <span class="mono-xs doc-code-n">${nLinhas(src)} linhas</span>
    <button class="doc-copy" type="button">Copiar</button>
  </header>
  ${nota ? `<p class="body-sm doc-code-note">${nota}</p>` : ''}
  <pre${clip ? ' class="doc-clip"' : ''}><code>${esc(src)}</code></pre>
</section>`;
const cabeca = (titulo, texto, id = '') => `<section class="doc-section"${id ? ` id="${id}"` : ''}>
    <div class="doc-head">
      <h2 class="d-lg">${titulo}</h2>
      <p class="body-sm">${texto}</p>
    </div>`;

const NOTAS_COR = {
  '--color-bg': 'Fundo. O azul-noite é o chão de tudo; nunca <code>#000</code>.',
  '--color-bg-deep': 'Faixas recuadas: rodapé, seções afundadas.',
  '--color-surface': 'Painel padrão de cards, campos e blocos.',
  '--color-surface-raised': 'Painel elevado em hover e foco.',
  '--color-night': 'Noite fixa: cabeçalho, gaveta, campo do selo. Não muda com o tema.',
  '--color-night-raised': 'Estado ativo e hover sobre a noite fixa.',
  '--color-border': 'Divisórias decorativas.',
  '--color-border-strong': 'Bordas de estado elevado e chips sem interação.',
  '--color-border-interactive': 'Limite de campo, botão secundário e chip-link. <strong>Medida, não gosto</strong>: WCAG 1.4.11 pede 3:1, e este valor dá 3,9:1 no fundo e 3,2:1 no painel elevado.',
  '--color-text': 'Títulos, dados e ações. 17,4:1 no fundo.',
  '--color-text-muted': 'Parágrafos, legendas, rótulos curtos. 9,0:1.',
  '--color-text-subtle': 'Metadados terciários. Passa AA sobre qualquer fundo do sistema.',
  '--color-line-reference': 'Fios e marcadores, onde contraste não se aplica.',
  '--color-accent': 'A ação. Um amarelo por tela: botão principal, numeral, o C da marca.',
  '--color-accent-strong': 'Preenchimento da ação em hover; texto escuro sobre ele a 9,0:1.',
  '--color-accent-text': 'Amarelo <em>como tipo</em>: 11,2:1 até no painel elevado.',
  '--color-on-accent': 'Texto sobre o amarelo, 12,8:1. Branco ali daria 1,4:1.',
  '--color-paper': 'O papel da marca: cor do T e fundo claro de peça impressa. Não é fundo de página aqui.',
  '--color-warning': 'Atenção. Âmbar, não o amarelo da ação.',
  '--color-info': 'Informação de apoio.',
  '--color-success': 'Confirmação.',
  '--color-danger': 'Erro, e só erro. O vermelho deixou de ser acento.',
  '--color-focus': 'Anel de foco: azul na página, amarelo na barra noturna.',
  '--color-scrollbar': 'Trilho de rolagem.',
  '--color-scrollbar-hover': 'Trilho de rolagem em hover.'
};
const swatches = tokensDeCor.map(({ nome, valor }) => `      <div class="doc-swatch">
        <span class="doc-chip-cor" style="background:${valor}"></span>
        <code>${nome}</code>
        <span class="doc-val mono-xs">${esc(valor)}</span>
        <p class="body-sm">${NOTAS_COR[nome] || ''}</p>
      </div>`).join('\n');

const TIPOS = [
  ['d-mega', 'Abertura', '--size-display-mega'],
  ['d-xl', 'Título de página', '--size-display-xl'],
  ['d-lg', 'Título de seção', '--size-display-lg'],
  ['d-md', 'Subtítulo', '--size-display-md'],
  ['d-sm', 'Título de card', '--size-display-sm'],
  ['body-md', 'Texto de leitura · Geist', '--size-body-md'],
  ['body-sm', 'Texto de apoio · Geist', '--size-body-sm'],
  ['mono-xs', 'Rótulo curto · JetBrains Mono', '--size-meta']
];
const tipos = TIPOS.map(([cls, uso, tk]) => `      <div class="doc-type-row">
        <div class="doc-type-live"><span class="${cls}">Caderno Noturno</span></div>
        <div class="doc-type-meta">
          <code>.${cls}</code>
          <span class="mono-xs">${uso}</span>
          <span class="mono-xs doc-val">${esc(token(tk))}</span>
        </div>
      </div>`).join('\n');

const ESPACOS = [1, 2, 3, 4, 6, 8, 12, 16];
const espacos = ESPACOS.map((n) => `      <div class="doc-space-row">
        <code>--space-${n}</code><span class="doc-val mono-xs">${token(`--space-${n}`)}</span>
        <span class="doc-bar" style="width:${n * 4}px"></span>
        <span class="mono-xs doc-val">${n * 4}px</span>
      </div>`).join('\n');

const IMAGENS = [
  ['ProfessorDash', 'professordash.webp', 'Página inicial do ProfessorDash, com a chamada Ensinar com clareza e parte do diagrama de aprendizagem.', 'Educação', ''],
  ['Capa · Educação', 'cover-education-640.webp', 'Capa editorial de educação: placas escuras dispostas em camadas, com um livro aberto em relevo no centro e uma lâmpada âmbar acesa.', 'Editorial', ' chip--signal'],
  ['eSIMBA', 'esimba.webp', 'Tela de acesso institucional do eSIMBA, com o brasão do sistema e o formulário de login.', 'Institucional', ''],
  ['Capa · Institucional', 'cover-civic-640.webp', 'Capa editorial institucional: um selo de concreto com a fachada de um tribunal em relevo, cercado por placas cinza.', 'Editorial', ' chip--signal'],
  ['Vitalis', 'vitalis.webp', 'Página inicial do Vitalis com a chamada Cuide, Registre, Evolua e um cartão com a linha do tempo do dia.', 'Saúde', ''],
  ['Capa · Saúde', 'cover-health-640.webp', 'Capa editorial de saúde: painéis claros e escuros sobre bancadas de pedra, atravessados por uma linha de eletrocardiograma âmbar.', 'Editorial', ' chip--signal'],
  ['Noivas e Cia', 'noivas-e-cia.webp', 'Sistema Noivas e Cia: tela inicial com gestão comercial, catálogo de trajes e controle de locação.', 'Comércio', ''],
  ['Capa · Comércio', 'cover-commerce-640.webp', 'Capa editorial de comércio: tecidos empilhados em ondas ao lado de uma arara com trajes em miniatura.', 'Editorial', ' chip--signal']
];
const fichas = IMAGENS.map(([titulo, arq, alt, chip, mod]) => `          <li class="gallery-item" data-gallery-title="${titulo}">
            <figure class="gcard">
              <img src="data:image/webp;base64,${base64(`assets/img/${arq}`)}" alt="${esc(alt)}" decoding="async">
              <figcaption><span class="gcard-title">${titulo}</span> <span class="chip${mod}">${chip}</span></figcaption>
            </figure>
          </li>`).join('\n');

const BOOT = `/* O portão de progressive enhancement. Sem esta classe, nada do bloco
   REVEAL SYSTEM entra em cena — que é exatamente a intenção. */
document.documentElement.classList.add('js');

const io = new IntersectionObserver((entries, obs) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    obs.unobserve(e.target);          /* revelar é de mão única */
  });
}, { rootMargin: '0px 0px -12% 0px' });

document.querySelectorAll('[data-rise], [data-mask], .stagger')
  .forEach((el) => io.observe(el));`;

const FONTES_HEAD = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Geist:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap">`;

/* ── O chrome do documento — não faz parte da folha portátil ────────── */
const CHROME = `
/* ═══ Chrome do documento — não faz parte da folha portátil ═══ */
:root { color-scheme: dark; }
.doc-wrap { max-width: 1180px; margin-inline: auto; padding-inline: var(--gut); }
.doc-masthead { padding-block: clamp(48px, 7vw, 96px) clamp(40px, 5vw, 72px); }
.doc-mark { height: 56px; width: auto; display: block; margin-bottom: var(--space-8); }
.doc-masthead h1 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(2.6rem, 8vw, 6rem); line-height: .92; letter-spacing: -.045em;
  text-wrap: balance; }
.doc-masthead h1 span { color: var(--signal); }
.doc-lede { max-width: 40rem; margin-top: var(--space-8); font-size: var(--size-body-md);
  line-height: 1.7; color: var(--muted); }
.doc-lede strong { color: var(--bone); font-weight: 600; }
.doc-facts { display: flex; flex-wrap: wrap; gap: clamp(24px, 5vw, 64px);
  margin-top: var(--space-12); padding-top: var(--space-6);
  border-top: 1px solid var(--line-2); }
.doc-fact b { display: block; font-family: var(--font-display); font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.4rem); letter-spacing: -.03em; line-height: 1;
  color: var(--bone); font-variant-numeric: tabular-nums; }
.doc-fact span { display: block; margin-top: 6px; }
.doc-section { padding-block: clamp(48px, 6vw, 88px); border-top: 1px solid var(--line); }
.doc-head { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 36rem);
  gap: clamp(24px, 5vw, 72px); align-items: start; margin-bottom: var(--space-12); }
.doc-head h2 { max-width: 11ch;
  font-size: clamp(1.8rem, 3.6vw, 2.8rem); line-height: 1; letter-spacing: -.035em; }
.doc-head p { margin: 0; }
.doc-sub { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem;
  letter-spacing: -.015em; color: var(--bone);
  margin: var(--space-12) 0 var(--space-4); }
.doc-sub:first-of-type { margin-top: 0; }

.doc-steps { display: grid; gap: var(--space-12); counter-reset: passo; }
.doc-step { display: grid; grid-template-columns: 3rem minmax(0, 1fr); gap: var(--space-4);
  align-items: start; }
.doc-step::before { counter-increment: passo;
  content: counter(passo, decimal-leading-zero);
  font-family: var(--font-display); font-weight: 800; font-size: 1.6rem; line-height: 1;
  color: var(--signal); }
.doc-step h3 { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem;
  letter-spacing: -.015em; margin-bottom: var(--space-3); }
.doc-step p { max-width: 40rem; }

.doc-code { margin-top: var(--space-6); border: 1px solid var(--line);
  border-radius: var(--radius-surface); background: var(--night); overflow: hidden; }
.doc-code-bar { display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--line); }
.doc-code-name { color: var(--bone); }
.doc-code-n { margin-left: auto; color: var(--dim); font-variant-numeric: tabular-nums;
  white-space: nowrap; }
.doc-code-note { margin: 0; padding: var(--space-4) var(--space-4) 0; max-width: 44rem; }
.doc-copy { font-family: var(--font-body); font-size: 14px; font-weight: 600;
  padding: .45em 1.1em; min-height: var(--tap); cursor: pointer;
  border: 1px solid var(--line-ui); border-radius: var(--radius-pill);
  background: transparent; color: var(--bone); white-space: nowrap;
  transition: background .18s ease, color .18s ease, border-color .18s ease; }
.doc-copy:hover { border-color: var(--bone); background: var(--panel-2); }
.doc-copy[data-ok] { border-color: var(--ok); color: var(--ok); background: transparent; }
.doc-code pre { margin: 0; padding: var(--space-4); overflow: auto;
  font-family: var(--font-mono); font-size: 12.5px; line-height: 1.7;
  color: var(--muted); tab-size: 2; }
.doc-code pre.doc-clip { max-height: 24em; }
.doc-code code { font: inherit; color: inherit; background: none; padding: 0; }
code { font-family: var(--font-mono); font-size: .88em; color: var(--bone);
  background: var(--panel-2); padding: .1em .35em; border-radius: 4px; }

.doc-swatches { display: grid; gap: 1px; background: var(--line);
  border: 1px solid var(--line); border-radius: var(--radius-surface); overflow: hidden; }
.doc-swatch { display: grid;
  grid-template-columns: 34px minmax(0, 15rem) minmax(0, 12rem) minmax(0, 1fr);
  gap: var(--space-4); align-items: center; padding: var(--space-4); background: var(--ink); }
.doc-swatch p { margin: 0; }
.doc-swatch > code { justify-self: start; }
.doc-chip-cor { width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--line-ui); }
.doc-val { color: var(--dim); font-variant-numeric: tabular-nums;
  text-transform: none; letter-spacing: 0; overflow-wrap: anywhere; }

.doc-type-row { display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 18rem);
  gap: var(--space-6); align-items: baseline; padding-block: var(--space-6);
  border-top: 1px solid var(--line); }
.doc-type-row:first-child { border-top: 0; padding-top: 0; }
.doc-type-live { min-width: 0; overflow: hidden; }
.doc-type-meta { display: flex; flex-direction: column; gap: 5px; align-items: start; }

.doc-space-row { display: grid; grid-template-columns: 8rem 5rem minmax(0, 1fr) 4rem;
  gap: var(--space-4); align-items: center; padding-block: var(--space-3);
  border-top: 1px solid var(--line); }
.doc-space-row:first-child { border-top: 0; }
.doc-space-row > code { justify-self: start; }
.doc-bar { height: 10px; background: var(--signal); border-radius: 2px; }

.doc-demo { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center;
  padding: clamp(20px, 3vw, 36px); border: 1px dashed var(--line-2);
  border-radius: var(--radius-surface); background: var(--ink-deep); }
.doc-demo--grid { display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  align-items: stretch; }

.doc-rules { display: grid; gap: 1px; background: var(--line);
  border-block: 1px solid var(--line); }
.doc-rule { display: grid; grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
  gap: clamp(12px, 4vw, 56px); padding: var(--space-6) 0; background: var(--ink); }
.doc-rule strong { font-size: 15px; font-weight: 600; color: var(--bone); }
.doc-rule p { margin: 0; max-width: 44rem; }

.doc-out { display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--space-6); }
.doc-out div { padding: var(--space-6); border: 1px solid var(--line);
  border-radius: var(--radius-surface); background: var(--panel); }
.doc-out h3 { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem;
  letter-spacing: -.01em; color: var(--bone); margin-bottom: var(--space-3); }
.doc-out p { margin: 0; }

/* ── Provas da marca ─────────────────────────────────────────────────── */
.doc-mark-stage { display: flex; flex-direction: column; align-items: center;
  gap: var(--space-6); padding: clamp(32px, 6vw, 72px); margin: 0;
  border: 1px solid var(--line); border-radius: var(--radius-surface);
  background: var(--panel); }
.doc-mark-stage img { width: min(340px, 62vw); height: auto; }
.doc-mark-stage figcaption { color: var(--dim); }
.doc-note { max-width: 42rem; margin-top: var(--space-6); }

.doc-specs { display: grid; gap: 1px; background: var(--line);
  border: 1px solid var(--line); border-radius: var(--radius-surface);
  overflow: hidden; }
.doc-spec { display: flex; align-items: baseline; justify-content: space-between;
  gap: var(--space-6); padding: var(--space-4); background: var(--ink);
  font-size: var(--size-body-sm); }
.doc-spec dt { color: var(--muted); }
.doc-spec dd { margin: 0; color: var(--bone); text-align: right;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.doc-ladder { display: flex; flex-wrap: wrap; align-items: flex-end;
  gap: clamp(24px, 5vw, 64px); padding: clamp(24px, 4vw, 48px);
  border: 1px solid var(--line); border-radius: var(--radius-surface);
  background: var(--panel); }
/* o reset zera width/height do <img>, então a altura do degrau vive no CSS */
.doc-scale { display: flex; flex-direction: column; align-items: center;
  gap: var(--space-3); margin: 0; }
.doc-scale img { display: block; height: var(--mark-h); width: auto; max-width: none; }
.doc-scale figcaption { color: var(--dim); }

.doc-grounds, .doc-lockups { display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: var(--space-6); }
.doc-ground, .doc-lockup { display: flex; flex-direction: column;
  align-items: center; justify-content: space-between; gap: var(--space-4);
  margin: 0; padding: var(--space-6); border: 1px solid var(--line);
  border-radius: var(--radius-surface); text-align: center; }
.doc-ground > img { height: 77px; width: auto; max-width: none;
  margin: clamp(24px, 4vw, 44px) 0; }
.doc-ground figcaption, .doc-lockup figcaption { color: var(--muted); }
.doc-ground figcaption span, .doc-lockup figcaption span { display: block;
  margin-top: 4px; color: var(--dim); letter-spacing: 0; text-transform: none; }
.doc-ground--dark { background: var(--ink); }
/* a prova em papel precisa declarar o esquema: o T do logo.svg troca de cor
   por prefers-color-scheme, e sem isto quem estiver no escuro veria um T
   papel sobre papel */
.doc-ground--light { background: var(--color-paper); color-scheme: light; }
.doc-ground--light figcaption { color: #3f444d; }
.doc-ground--light figcaption span { color: #555a64; }
.doc-ground--mono { background: var(--ink); }
.doc-ground--mono > img { filter: grayscale(1); }

.doc-lockup-clear { display: flex; align-items: center; justify-content: center;
  padding: 22px; outline: 1px dashed var(--dim-line); outline-offset: 0; }
.doc-lockup-h { display: flex; align-items: center; gap: 14px; }
.doc-lockup-v { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.doc-lockup img { height: var(--mark-h, 40px); width: auto; max-width: none; }
.doc-lockup-name { font-family: var(--font-display); font-weight: 800;
  font-size: 17px; line-height: 1.05; letter-spacing: -.02em; color: var(--bone);
  text-align: left; }
.doc-lockup-v .doc-lockup-name { font-size: 15px; text-align: center; }
.doc-foot { padding-block: clamp(40px, 6vw, 72px); border-top: 1px solid var(--line-2); }

@media (max-width: 880px) {
  .doc-head, .doc-rule { grid-template-columns: minmax(0, 1fr); gap: var(--space-4); }
  .doc-swatch { grid-template-columns: 28px minmax(0, 1fr); }
  .doc-swatch .doc-val { display: none; }
  .doc-swatch p { grid-column: 1 / -1; }
  .doc-type-row { grid-template-columns: minmax(0, 1fr); }
  .doc-type-meta { flex-direction: row; flex-wrap: wrap; gap: var(--space-3); }
  .doc-space-row { grid-template-columns: 7rem 4.5rem minmax(0, 1fr); }
  .doc-space-row > :last-child { display: none; }
  .doc-step { grid-template-columns: minmax(0, 1fr); }
}
`;

const COPIAR = `
  document.querySelectorAll('.doc-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const alvo = btn.closest('.doc-code').querySelector('code');
      let ok = false;
      try {
        await navigator.clipboard.writeText(alvo.textContent);
        ok = true;
      } catch (e) {
        /* área de transferência bloqueada (arquivo local, sandbox): cai para o campo temporário */
        try {
          const ta = document.createElement('textarea');
          ta.value = alvo.textContent;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = '0';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          ta.remove();
        } catch (e2) { ok = false; }
      }
      if (!ok) {
        /* último recurso: seleciona o bloco para o leitor copiar à mão */
        const sel = getSelection();
        const r = document.createRange();
        r.selectNodeContents(alvo);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      btn.textContent = ok ? 'Copiado' : 'Selecionado';
      if (ok) btn.setAttribute('data-ok', '');
      window.setTimeout(() => {
        btn.textContent = 'Copiar';
        btn.removeAttribute('data-ok');
      }, 1800);
    });
  });
`;

const nCamadas = 11;
const doc = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="Design system Caderno Noturno — marca, tokens, componentes e regras de Toni Coimbra, num documento só, pronto para aplicar em outro projeto.">
<link rel="icon" type="image/svg+xml" sizes="any" href="${SELO}">
<title>Caderno Noturno</title>
<!-- Gerado por design-system/compilar-caderno.mjs — não edite à mão. -->
<style>
${FOLHA_PAGINA}${CHROME}</style>
</head>

<body>
<div class="doc-wrap">
  <header class="doc-masthead">
    <img class="doc-mark" src="${LOGO}" alt="Monograma TC">
    <h1>Caderno<br>Noturno<span>.</span></h1>
    <p class="doc-lede">O design system de Toni Coimbra, recortado para sair do portfólio e entrar em outro projeto. <strong>Sóbrio e editorial:</strong> azul-noite com um amarelo de ação, Archivo 800 nos títulos, Geist na interface e no texto, JetBrains Mono só para código, medidas e rótulos curtos. O vermelho só aparece quando algo deu errado.</p>
    <p class="doc-lede">É o mesmo sistema do ProfessorDash, aqui no tema noturno. Esta página é renderizada pela própria folha que ela documenta: os componentes abaixo são o CSS real, rodando.</p>
    <div class="doc-facts">
      <div class="doc-fact mono-xs"><b>${nLinhas(FOLHA)}</b><span>linhas de CSS</span></div>
      <div class="doc-fact mono-xs"><b>${nCamadas}</b><span>camadas</span></div>
      <div class="doc-fact mono-xs"><b>${tokensDeCor.length}</b><span>tokens de cor</span></div>
      <div class="doc-fact mono-xs"><b>0</b><span>dependências</span></div>
    </div>
  </header>

  ${cabeca('Marca', 'O monograma TC foi desenhado à mão, não composto com uma fonte. O corte do T acompanha a curva externa do C e deixa entre as letras uma fenda curva de largura constante. T e C têm a mesma espessura de traço — é essa espessura única que faz o par ler como um sinal só.')}
    <figure class="doc-mark-stage">
      <img src="${LOGO}" alt="Monograma TC: um T claro com o braço direito cortado em curva, ao lado de um C amarelo, separados por uma fenda curva.">
      <figcaption class="mono-xs">logo.svg · viewBox 403,93×226,77</figcaption>
    </figure>
    <p class="body-sm doc-note">Todas as provas desta página carregam o arquivo real embutido, não um redesenho. Se a marca mudar no <code>assets/</code>, rode o compilador de novo — é a marca que manda.</p>

    <h3 class="doc-sub">Construção</h3>
    <p class="body-sm doc-note" style="margin-top:0;margin-bottom:var(--space-6)">Unidades relativas à altura do monograma, que vale 80. O desenho original é de 142,5 × 80 mm.</p>
    <dl class="doc-specs">
      <div class="doc-spec"><dt>Caixa total (largura × altura)</dt><dd>142,5 × 80</dd></div>
      <div class="doc-spec"><dt>Espessura única: haste do T, traços do C</dt><dd>20</dd></div>
      <div class="doc-spec"><dt>Travessa do T (altura × largura)</dt><dd>25 × 80</dd></div>
      <div class="doc-spec"><dt>Raio do C, externo / interno</dt><dd>40 / 20</dd></div>
      <div class="doc-spec"><dt>Fenda entre T e C, concêntrica ao C</dt><dd>7,5</dd></div>
      <div class="doc-spec"><dt>Braços retos do C além do centro</dt><dd>36,8</dd></div>
      <div class="doc-spec"><dt>Cor do T / do C</dt><dd>#f1f0ec / #ffd43b</dd></div>
    </dl>

    <h3 class="doc-sub">Redução</h3>
    <p class="body-sm doc-note" style="margin-top:0;margin-bottom:var(--space-6)">Não há corte óptico próprio: a fenda de 7,5 unidades continua aberta em 16 px. Abaixo de 24 px de altura, use o selo, que põe o monograma sobre o campo noturno.</p>
    <div class="doc-ladder">
${[64, 48, 32, 24].map((h) => `      <figure class="doc-scale" style="--mark-h: ${h}px"><img src="${LOGO}" alt=""><figcaption class="mono-xs">${h}</figcaption></figure>`).join('\n')}
      <figure class="doc-scale" style="--mark-h: 16px"><img src="${SELO}" alt=""><figcaption class="mono-xs">16 · selo</figcaption></figure>
    </div>

    <h3 class="doc-sub">Fundos</h3>
    <div class="doc-grounds">
      <figure class="doc-ground doc-ground--dark"><img src="${LOGO}" alt=""><figcaption class="mono-xs">Noturno · #080c17 <span>uso padrão</span></figcaption></figure>
      <figure class="doc-ground doc-ground--light"><img src="${LOGO}" alt=""><figcaption class="mono-xs">Papel · #f1f0ec <span>o T vira tinta; o C continua amarelo</span></figcaption></figure>
      <figure class="doc-ground doc-ground--mono"><img src="${LOGO}" alt=""><figcaption class="mono-xs">Monocromático <span>a fenda sustenta a leitura sem o amarelo</span></figcaption></figure>
    </div>

    <h3 class="doc-sub">Lockups</h3>
    <p class="body-sm doc-note" style="margin-top:0;margin-bottom:var(--space-6)">O respiro mínimo em toda a volta é a altura da travessa do T — é a linha tracejada. O lockup horizontal não desce de 160 px de largura.</p>
    <div class="doc-lockups">
      <figure class="doc-lockup" style="--mark-h: 40px"><span class="doc-lockup-clear"><span class="doc-lockup-h"><img src="${LOGO}" alt=""><span class="doc-lockup-name">Toni<br>Coimbra</span></span></span><figcaption class="mono-xs">Horizontal <span>cabeçalho e assinatura de e-mail</span></figcaption></figure>
      <figure class="doc-lockup" style="--mark-h: 54px"><span class="doc-lockup-clear"><span class="doc-lockup-v"><img src="${LOGO}" alt=""><span class="doc-lockup-name">Toni Coimbra</span></span></span><figcaption class="mono-xs">Vertical <span>capa de projeto, apresentação, impresso</span></figcaption></figure>
      <figure class="doc-lockup" style="--mark-h: 64px"><span class="doc-lockup-clear"><img src="${SELO}" alt=""></span><figcaption class="mono-xs">Selo <span>avatar e favicon · favicon.svg</span></figcaption></figure>
    </div>

    <h3 class="doc-sub">Regras da marca</h3>
    <div class="doc-rules">
      <div class="doc-rule"><strong>Carregue o arquivo</strong><p class="body-sm">Use <code>logo.svg</code> e <code>favicon.svg</code>. Não redesenhe o monograma a partir de uma fonte: o corte curvo do T e a fenda concêntrica ao C não existem em fonte nenhuma.</p></div>
      <div class="doc-rule"><strong>Declare o esquema de cor</strong><p class="body-sm">O T troca de cor por <code>prefers-color-scheme</code>. Numa superfície escura, a página precisa declarar <code>color-scheme: dark</code>; sem isso, quem estiver com o sistema no claro recebe um T <code>#16181d</code> sobre fundo escuro.</p></div>
      <div class="doc-rule"><strong>Respiro é medida, não estimativa</strong><p class="body-sm">A altura da travessa do T em toda a volta. Nada entra nessa faixa: nem texto, nem borda, nem outra marca.</p></div>
      <div class="doc-rule"><strong>O amarelo é do C</strong><p class="body-sm">O C é sempre <code>#ffd43b</code>, inclusive sobre papel. Não tinja o T, não aplique gradiente e não troque o amarelo por outro tom.</p></div>
      <div class="doc-rule"><strong>Uma marca, dois produtos</strong><p class="body-sm">O portfólio e o ProfessorDash assinam com o mesmo desenho. Mudou num, muda no outro no mesmo dia.</p></div>
    </div>

    <h3 class="doc-sub">Os dois arquivos</h3>
    <p class="body-sm doc-note" style="margin-top:0">Salve como <code>assets/logo.svg</code> e <code>assets/favicon.svg</code>. São caminhos desenhados à mão — não os regenere a partir de uma fonte.</p>
    ${codigo('logo.svg', logoSvg.trim(), 'O T segue o esquema de cor do sistema — papel no escuro, tinta no claro. O C é amarelo fixo.')}
    ${codigo('favicon.svg', faviconSvg.trim(), 'O selo: o mesmo desenho sobre o campo noturno <code>#0a0e1a</code>, com canto arredondado.')}
  </section>

  ${cabeca('Instalar', 'Três passos, nesta ordem. Não há etapa de compilação, bundler nem dependência de runtime — o sistema é um arquivo CSS e uma classe no <code>&lt;html&gt;</code>.')}
    <div class="doc-steps">
      <div class="doc-step"><div>
        <h3>As três fontes</h3>
        <p class="body-sm">Archivo 700–800, Geist 400–700 e JetBrains Mono 400–500. Servir local em <code>.woff2</code> é o que o portfólio faz e evita o salto de tipografia na primeira pintura; o Google Fonts serve para começar rápido. Esta página já traz as três embutidas, para abrir sem rede.</p>
        ${codigo('index.html · <head>', FONTES_HEAD, '', false)}
      </div></div>
      <div class="doc-step"><div>
        <h3>A folha</h3>
        <p class="body-sm">Copie o último bloco desta página para <code>assets/css/style.css</code> e sirva com <code>?v=AAAAMMDD</code>. As três <code>@font-face</code> no topo apontam para <code>../fonts/</code> — ajuste o caminho, ou apague-as se estiver usando o Google Fonts do passo anterior.</p>
      </div></div>
      <div class="doc-step"><div>
        <h3>A classe <code>.js</code></h3>
        <p class="body-sm">Todo o bloco <em>REVEAL SYSTEM</em> vive atrás de <code>.js</code>. Sem script, o conteúdo aparece inteiro e parado — que é o estado correto, não o degradado. Estas linhas são o runtime inteiro que o sistema exige.</p>
        ${codigo('boot.js', BOOT, '', false)}
      </div></div>
    </div>
  </section>

  ${cabeca('Cor', `${tokensDeCor.length} tokens semânticos, mais apelidos curtos que os componentes consomem (<code>--ink</code>, <code>--panel</code>, <code>--bone</code>, <code>--signal</code>…). Azul-noite e amarelo são identidade; verde, âmbar e vermelho são só estado. Os valores com conta de contraste no comentário são medida, não gosto.`)}
    <div class="doc-swatches">
${swatches}
    </div>
    ${codigo('Camada · DESIGN TOKENS', C.tokens, 'O bloco completo: as três <code>@font-face</code>, os tokens semânticos e os apelidos de compatibilidade, a escala tipográfica, os passos de espaço, os raios, as curvas, e as bases de <code>html</code>/<code>body</code>, barra de rolagem e foco visível.')}
  </section>

  ${cabeca('Tipografia', 'Três famílias com papéis que não se misturam. Archivo 800 em caixa de frase para títulos e numerais; Geist para tudo o que se lê; JetBrains Mono para código, medidas e o rótulo curto em caixa alta. Os tamanhos são fluidos por <code>clamp()</code>; o piso do rótulo é 12px.')}
    <div>
${tipos}
    </div>
    ${codigo('Camada · TYPE SCALE', C.tipo, 'Inclui <code>.measure</code>, medida em <code>rem</code> e não em <code>ch</code>: a mesma variável encontra Geist e mono, e <code>ch</code> daria duas linhas diferentes.')}
  </section>

  ${cabeca('Ritmo', 'Oito passos de espaço, raios com intenção declarada e três curvas de motion. Nenhuma medida solta — se um valor não está aqui, ele precisa se justificar.')}
    <h3 class="doc-sub">Espaço</h3>
    <div>
${espacos}
    </div>
    <h3 class="doc-sub">Raio</h3>
    <div class="doc-demo">
      <span class="chip">--radius-pill · botão, chip, navegação</span>
      <span class="chip">--radius-control · ${token('--radius-control')} · campo e mensagem</span>
      <span class="chip">--radius-surface · ${token('--radius-surface')} · card</span>
      <span class="chip">--radius-emphasis · ${token('--radius-emphasis')} · bloco destacado</span>
      <span class="chip">--radius-media · ${token('--radius-media')} · recorte de imagem</span>
    </div>
    <h3 class="doc-sub">Motion</h3>
    <div class="doc-swatches">
      <div class="doc-swatch"><span></span><code>--e-out</code><span class="doc-val mono-xs">${esc(token('--e-out'))}</span><p class="body-sm">Entradas e hover de card. Sai forte e assenta devagar.</p></div>
      <div class="doc-swatch"><span></span><code>--e-io</code><span class="doc-val mono-xs">${esc(token('--e-io'))}</span><p class="body-sm">Transição comandada: o burger, a barra da fase.</p></div>
      <div class="doc-swatch"><span></span><code>--e-soft</code><span class="doc-val mono-xs">${esc(token('--e-soft'))}</span><p class="body-sm">Hover curto de cor e de borda.</p></div>
    </div>
  </section>

  ${cabeca('Primitivas', 'As peças que o resto compõe. Tudo abaixo está rodando com o CSS desta página — passe o ponteiro e navegue com o teclado para ver o foco.')}
    <h3 class="doc-sub">Ações</h3>
    <div class="doc-demo">
      <button class="btn" type="button">Ação principal</button>
      <button class="btn btn--ghost" type="button">Secundária</button>
      <button class="btn" type="button" disabled>Indisponível</button>
      <button class="btn is-busy" type="button" disabled>Enviando</button>
    </div>
    <h3 class="doc-sub">Chips</h3>
    <div class="doc-demo">
      <span class="chip">Padrão</span>
      <span class="chip chip--solid">Institucional</span>
      <span class="chip chip--signal">Em produção</span>
      <a class="chip" href="#regras">Link com alvo de 44px</a>
    </div>
    <h3 class="doc-sub">Superfície</h3>
    <div class="doc-demo doc-demo--grid">
      <article class="box box--card p-6">
        <span class="mono-xs">Componente · box</span>
        <h4 class="d-sm mt-4">Clareza antes de ornamento</h4>
        <p class="body-sm mt-4">Painel chapado, borda discreta e elevação curta quando a superfície carrega interação.</p>
      </article>
      <article class="box p-6">
        <span class="mono-xs">Sem interação</span>
        <h4 class="d-sm mt-4">Nem toda coisa é card</h4>
        <p class="body-sm mt-4">Sem <code>.box--card</code> a superfície não se levanta — porque não há o que clicar nela.</p>
      </article>
    </div>
    ${codigo('Camada · SHARED PRIMITIVES', C.primitivas, '<code>.shell</code>, <code>.sec</code>, <code>.chip</code>, <code>.btn</code> e <code>.box</code>. O botão é a cor de ação chapada, sem wipe: o hover escurece o preenchimento um degrau. O chip de destaque é tingido, não preenchido, para não disputar com a ação.')}
  </section>

  ${cabeca('Componentes', 'Peças maiores, montadas sobre as primitivas. Cada uma responde a hover, foco e movimento reduzido — um componente sem os três não está pronto.')}
    <h3 class="doc-sub">Métrica</h3>
    <div class="doc-demo doc-demo--grid">
      <div class="stat"><span class="mono-xs">Anos em sala</span><b>20<sup>+</sup></b></div>
      <div class="stat"><span class="mono-xs">Documentos processados</span><b>200<sup>K+</sup></b></div>
      <div class="stat"><span class="mono-xs">Sistemas no ar</span><b>4</b></div>
    </div>
    ${codigo('Camada · STAT CARDS', C.stat, 'Uma entrada pautada na página, não um painel: só um fio no topo. O numeral é Archivo; a unidade, num <code>&lt;sup&gt;</code>, leva o amarelo — o mesmo que o portal dá ao número da aula.')}

    <h3 class="doc-sub">Fase</h3>
    <div class="doc-demo doc-demo--grid">
      <div class="phase"><span class="num">01 · Padrão</span><h3>Estrutura</h3><div class="bar"><i></i></div><p class="body-sm">Reúna conteúdo que compartilha uma mesma decisão.</p><ul><li>Hierarquia visível</li><li>Ritmo consistente</li></ul></div>
      <div class="phase"><span class="num">02 · Padrão</span><h3>Prova</h3><div class="bar"><i></i></div><p class="body-sm">A barra preenche no hover e no foco — estado, não enfeite.</p><ul><li>Estados completos</li><li>Teclado incluído</li></ul></div>
    </div>
    ${codigo('Camada · PHASE CARDS', C.fase, 'O rótulo de topo é um kicker: mono, caixa alta, cor neutra. Nunca a cor de ação.')}

    <h3 class="doc-sub">Formulário</h3>
    <div class="doc-demo" style="display:block">
      <div class="form" style="max-width:36rem">
        <div class="form-row">
          <label class="form-label" for="demo-nome">Nome</label>
          <input class="form-field" id="demo-nome" type="text" placeholder="Como devo chamar você">
        </div>
        <div class="form-row">
          <label class="form-label" for="demo-mail">E-mail de contato</label>
          <input class="form-field" id="demo-mail" type="email" placeholder="nome@exemplo.com" aria-invalid="true" aria-describedby="demo-erro" value="nome@exemplo">
          <p class="form-error" id="demo-erro">Confira o e-mail — é por ele que eu respondo.</p>
        </div>
        <div class="form-result form-result--ok">Mensagem enviada. Respondo em até um dia útil.</div>
        <div class="form-result form-result--warn mt-4">O envio falhou. Escreva direto para o e-mail do rodapé — a mensagem continua aqui.</div>
      </div>
    </div>
    ${codigo('Camada · FORM CONTROLS', C.form, 'O campo é <code>16px</code> fixo para o iOS não dar zoom no foco. <code>aria-invalid</code> é o que revela o erro — nunca a carga da página. Vermelho só significa “isto deu errado”: sucesso é verde, rota alternativa é âmbar.')}

    <h3 class="doc-sub">Galeria em arco</h3>
    <p class="body-sm" style="max-width:42rem;margin-bottom:var(--space-6)">Rodando de verdade, aqui embaixo. Arraste, gire a roda na horizontal, use os botões, ou dê foco no palco e navegue com as setas, <code>Home</code> e <code>End</code>.</p>
    <div class="gallery" data-gallery data-gallery-label="Ver">
      <div class="gallery-stage" data-gallery-stage aria-label="Projetos e capas editoriais">
        <ul class="gallery-track" data-gallery-track>
${fichas}
        </ul>
      </div>
      <div class="gallery-controls">
        <button class="gallery-nav gallery-nav--prev" type="button" data-gallery-prev aria-label="Imagem anterior">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5 6 12l7 7M6 12h12"/></svg>
        </button>
        <button class="gallery-nav gallery-nav--next" type="button" data-gallery-next aria-label="Próxima imagem">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5 6 12l7 7M6 12h12"/></svg>
        </button>
        <p class="gallery-status" data-gallery-status role="status"></p>
      </div>
    </div>
    <p class="body-sm" style="max-width:42rem;margin-top:var(--space-8)">Para superfícies com muitas imagens. Dois estados no mesmo bloco: o CSS declara um trilho com <code>scroll-snap</code>, e o script acrescenta <code>.is-live</code> — só então as fichas entram no anel 3D, com arrasto, roda horizontal, setas do teclado e deriva lenta. Sob <code>prefers-reduced-motion</code> nenhum quadro é agendado e os botões passam a rolar o trilho.</p>
    <p class="body-sm mt-4" style="max-width:42rem">Precisa dos dois blocos abaixo e de nada mais. Marcação mínima: <code>[data-gallery]</code> &gt; <code>[data-gallery-stage]</code> &gt; <code>[data-gallery-track]</code>, uma <code>.gcard</code> por item, e opcionalmente <code>[data-gallery-prev]</code>, <code>[data-gallery-next]</code> e <code>[data-gallery-status]</code>. Toda imagem precisa de <code>alt</code> real: o trilho sem script é o que sobra quando o resto falha.</p>
    ${codigo('Camada · GALERIA EM ARCO', C.galeria, 'O véu sob a legenda é contraste, não decoração: a legenda fica sobre uma imagem qualquer, e sem ele o texto claro cai sobre o que a captura tiver.')}
    ${codigo('gallery.js', galeriaJs.trim(), 'Autônomo: não importa nada, não depende do runtime principal e liga sozinho em qualquer <code>[data-gallery]</code> da página.')}
  </section>

  ${cabeca('Reveal e reset', 'A entrada é de mão única e vive inteira sob <code>.js</code>. Entradas usam só opacidade e deslocamento curto — sem desfoque, sem recorte animado. O conteúdo nunca fica estacionado esperando observador: se o script falhar, a página continua legível.')}
    ${codigo('Camada · REVEAL SYSTEM', C.reveal)}
    ${codigo('Camada · REDUCED MOTION', C.reduzido, 'Movimento reduzido pede menos viagem, não menos resposta: o que roda em laço para, mas hover e foco mantêm a transição curta de cor.')}
    ${codigo('Camada · LAYOUT UTILITIES', C.utilidades)}
    ${codigo('Camada · RESET', C.reset, 'Inclui a <code>.skip-link</code>. Atenção ao reset de <code>img</code>: <code>height: auto</code> anula os atributos <code>width</code>/<code>height</code>, então altura de imagem se resolve no CSS.')}
  </section>

  ${cabeca('Regras', 'O que separa um sistema de uma folha de estilo. Um componente se substitui; uma regra quebrada contamina tudo o que vier depois.', 'regras')}
    <div class="doc-rules">
      <div class="doc-rule"><strong>Comece pelos tokens</strong><p class="body-sm">Use uma cor, passo de espaço, raio, escala e curva que já existam antes de inventar um valor. Um valor novo precisa justificar por que os existentes não serviam.</p></div>
      <div class="doc-rule"><strong>Um amarelo por tela</strong><p class="body-sm">O amarelo marca a ação, o numeral e a marca. Se duas coisas estão em amarelo, nenhuma está. Rótulo curto nunca vai na cor de ação.</p></div>
      <div class="doc-rule"><strong>Vermelho é erro</strong><p class="body-sm">O vermelho deixou de ser acento. Ele aparece em campo inválido e em mensagem de falha — e em nenhum outro lugar.</p></div>
      <div class="doc-rule"><strong>Roxo continua proibido</strong><p class="body-sm">Convenção do sistema, não preferência do dia. Nada de violeta, índigo ou gradiente arco-íris; o azul do sistema é o azul-noite e o azul de foco.</p></div>
      <div class="doc-rule"><strong>Contraste é conta, não olho</strong><p class="body-sm">Os tokens com comentário de contraste carregam a matemática WCAG. Se mudar o valor, refaça a conta — não “arrume” o número porque ele parece estranho.</p></div>
      <div class="doc-rule"><strong>Sem ornamento</strong><p class="body-sm">Nada de lavagem radial no fundo, fio de luz no topo de cartão, luz que segue o ponteiro ou faixa lateral colorida. A superfície é chapada; quem fala é o conteúdo.</p></div>
      <div class="doc-rule"><strong>Estados são completos</strong><p class="body-sm">Toda interação considera hover, foco, desabilitado, carregando, erro, sucesso e movimento reduzido. Faltando um, o componente não está pronto.</p></div>
      <div class="doc-rule"><strong>Teste em 320px</strong><p class="body-sm">A composição pode mudar; a informação não pode sumir. Alvo de toque mínimo é <code>--tap</code>, 44px, inclusive para um chip que virou link.</p></div>
      <div class="doc-rule"><strong>Cada seletor uma vez</strong><p class="body-sm">A ordem da cascata é contrato. O valor final de um componente mora na regra dele, não num bloco de correção no fim do arquivo.</p></div>
      <div class="doc-rule"><strong>Versione o que a página pede</strong><p class="body-sm">Se houver CDN na frente, ele ignora o <code>no-cache</code> do servidor. Sem <code>?v=</code> a página nova recebe o arquivo velho.</p></div>
    </div>
  </section>

  ${cabeca('O que ficou de fora', 'A folha é o sistema, não o site. Estas peças moram no portfólio porque são daquele projeto — se você precisar de alguma, copie de lá conscientemente, não por engano.')}
    <div class="doc-out">
      <div><h3>Herói e colagem</h3><p class="body-sm">Composição de capas com paralaxe de ponteiro, amarrada ao conteúdo daquela abertura.</p></div>
      <div><h3>Cartões de projeto</h3><p class="body-sm"><code>.box--media</code> com captura emoldurada e capa girada. Formato editorial específico.</p></div>
      <div><h3>Cabeçalho e gaveta</h3><p class="body-sm">Barra noturna fixa, burger, trava de foco e scroll-spy. Depende dos ids daquela página.</p></div>
      <div><h3>Rodapé e faixa</h3><p class="body-sm">Faixa de palavras em laço e relógio de fuso. Conteúdo daquele rodapé.</p></div>
      <div><h3>Skins de seção</h3><p class="body-sm">Onde uma seção reafirma um componente por ser ela própria o assunto.</p></div>
      <div><h3>Folhas do catálogo</h3><p class="body-sm">O <code>.ds-*</code> que desenha a página de catálogo do design system.</p></div>
    </div>
  </section>

  ${cabeca('A folha', 'Tudo acima, em um arquivo, na ordem de cascata correta. É este o arquivo que vai para <code>assets/css/style.css</code>.')}
    ${codigo('caderno-noturno.css', FOLHA.trim(), 'A ordem não é arbitrária: reset e tokens antes de tudo, movimento reduzido por último. Cada seletor aparece uma única vez — se precisar sobrescrever algo, edite a regra original em vez de acrescentar um bloco no fim.')}
  </section>

  <footer class="doc-foot">
    <p class="mono-xs">Caderno Noturno · Design system de Toni Coimbra</p>
    <p class="body-sm mt-4" style="max-width:40rem">Fonte da verdade: <code>assets/css/style.css</code> no repositório do portfólio, e <code>static/css/caderno.css</code> no ProfessorDash. Este documento é gerado por <code>design-system/compilar-caderno.mjs</code>; não o edite à mão.</p>
  </footer>
</div>

<script>
${galeriaJs.trim()}
</script>
<script>
${COPIAR}
</script>
</body>
</html>
`;

writeFileSync(SAIDA, doc);
console.log(`design-system/caderno-noturno.html · ${nLinhas(doc)} linhas · ${(Buffer.byteLength(doc) / 1024).toFixed(0)} KB`);
