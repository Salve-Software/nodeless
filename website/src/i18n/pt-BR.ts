import type { Copy } from './types';

export const ptBR: Copy = {
  nav: {
    docs: 'Docs',
    github: 'GitHub',
    npm: 'npm',
    theme: 'Alternar tema',
    language: 'Mudar idioma',
  },
  hero: {
    badge: 'v0.2 — roda o Vite config do próprio projeto',
    title: ['Builde um projeto frontend.', 'Sem Node.'],
    lead: 'A nodeless instala do npm e produz o seu `dist/` em memória, no processo que você já tem — num servidor ou dentro de uma aba do navegador. Sem shell, sem sistema de arquivos, sem container.',
    install: 'npm install @salve-software/nodeless',
    copy: 'Copiar',
    copied: 'Copiado',
    primary: 'Ver a documentação',
    secondary: 'Abrir o playground',
    stats: [
      { value: '~200', unit: 'ms', label: 'build quente do React' },
      { value: '4', unit: '', label: 'dependências de runtime' },
      { value: '0', unit: '', label: 'containers pra operar' },
    ],
  },
  insight: {
    eyebrow: 'A ideia',
    title: 'Um build nunca roda o seu app',
    lead: 'Bundlar é ler arquivos, resolver imports e transformar TSX em JS. Os seus componentes só rodam depois, no navegador de quem abre o site. O container que todo mundo sobe está isolando uma coisa que nunca esteve executando.',
    rows: [
      {
        job: 'Um lugar pra ler e escrever arquivos',
        vm: 'não',
        note: 'um objeto em memória resolve',
      },
      { job: 'npm install e o build', vm: 'não', note: 'os dois cabem neste processo' },
      { job: 'Isolar o código gerado', vm: 'não', note: 'bundlar não executa' },
    ],
    vmLabel: 'Precisa de VM?',
  },
  graphs: {
    eyebrow: 'Como se sustenta',
    title: 'Dois conjuntos de arquivos que nunca se tocam',
    lead: 'Um projeto tem uma ferramenta de build e uma aplicação, e os próprios imports já separam as duas. Ninguém precisa decidir de que lado cada arquivo está.',
    toolchain: {
      title: 'A ferramenta',
      verdict: 'Executada, num sandbox',
      note: 'Ferramenta de build que não roda é ferramenta que você vai ter que reimplementar — uma vez por ferramenta, pra sempre.',
      files: [
        'vite.config.ts',
        '@vitejs/plugin-react',
        '@tailwindcss/vite',
        'seu-plugin.js',
      ],
    },
    app: {
      title: 'A sua aplicação',
      verdict: 'Lida como texto. Nunca executada.',
      note: 'Resolver um import e transpilar TSX não executam nada. Essa metade é o motivo de não precisar de VM.',
      files: ['index.html', 'src/main.tsx', 'src/App.tsx', 'react, react-dom'],
    },
    footnote:
      '`App.tsx` nunca é importado pelo `vite.config.ts`. `react` também não — quem importa é o `App.tsx`, que está do outro lado.',
  },
  code: {
    eyebrow: 'Na prática',
    title: 'Três linhas dos dois lados do fio',
    lead: 'O mesmo pacote, a mesma API. O que muda é quem está chamando.',
    tabs: [
      {
        id: 'api',
        label: 'Na sua API',
        file: 'controller.ts',
        note: 'Devolve um site buildado de dentro de um handler, sem nada pra provisionar.',
        code: `import { NodelessProject } from '@salve-software/nodeless';

export async function build(files: Record<string, string>) {
  const project = new NodelessProject({ files, isolation: 'none' });

  await project.install();          // registry → tarball → memória
  const result = await project.build();

  if (!result.ok) return { errors: result.errors };

  return result.files;              // index.html, bundle.js, bundle.css
}`,
      },
      {
        id: 'browser',
        label: 'No navegador',
        file: 'editor.tsx',
        note: 'Rebuilda enquanto o usuário digita. A ferramenta roda num worker, fora da página.',
        code: `const project = new NodelessProject({
  files: STARTER,
  wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
  isolation: 'worker',
});

project.watch(async () => {
  const result = await project.build({ mode: 'development' });

  if (result.ok) iframe.srcdoc = decode(result.files['index.html']);
});`,
      },
      {
        id: 'config',
        label: 'O config do projeto',
        file: 'vite.config.ts',
        note: 'O `node:fs` aqui é o sistema de arquivos virtual. O plugin nunca descobre.',
        code: `import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync('/package.json', 'utf8'));

export default ({ mode }) => ({
  plugins: [react(), tailwind()],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '~': '/src' } },
});`,
      },
    ],
  },
  features: {
    eyebrow: 'O que você leva',
    title: 'Tudo que um build precisa, nada da maquinaria',
    items: [
      {
        title: 'Um npm install de verdade',
        body: 'Ranges de semver, checagem de integridade, o layout flat do npm, lockfile e workspaces. Direto do registry.npmjs.org pra memória.',
      },
      {
        title: 'O seu próprio Vite config',
        body: 'Plugins do npm, módulos virtuais, `define`, `resolve.alias` e `defineConfig(({ mode }) => …)`. Uma ferramenta que a gente nunca ouviu falar custa zero código aqui.',
      },
      {
        title: 'Roda no navegador',
        body: 'Um job com Chromium headless prova ponta a ponta a cada commit: instala do npm numa aba, builda, e o iframe executa o resultado.',
      },
      {
        title: 'Erro é dado',
        body: 'Um build que falha devolve `{ ok: false, errors }` com arquivo, linha e coluna. Nada lança, então quem chamou consegue agir.',
      },
      {
        title: 'Toolchain funciona sozinha',
        body: 'Tailwind v4 e Sass compilam sem configuração, como peers opcionais carregados só quando algum arquivo precisa. CSS modules já vem junto.',
      },
      {
        title: 'Atravessa o fio',
        body: '`snapshot()` serializa o workspace inteiro. Instala no servidor, rebuilda no navegador, sai o mesmo bundle.',
      },
    ],
  },
  isolation: {
    eyebrow: 'Rodando o config dos outros',
    title: 'Um realm separado, ou nenhum',
    lead: 'Config é código. Se quem escreve é o seu usuário, é código de estranho rodando do lado do seu. O `isolation: worker` põe isso num realm próprio — e tem um teste em CI que tenta escapar dele.',
    columns: {
      probe: 'O que o config tenta',
      none: 'isolation: none',
      worker: 'isolation: worker',
    },
    probes: [
      { probe: 'Ler o env da API', none: 'hunter2', worker: 'bloqueado' },
      { probe: 'Contar o env da API', none: '76 chaves', worker: '0 chaves' },
      { probe: 'Pegar um binding nativo de fs', none: 'conseguiu', worker: 'bloqueado' },
      {
        probe: 'Arrumar um jeito de subir processo',
        none: 'conseguiu',
        worker: 'bloqueado',
      },
      { probe: 'Matar o processo do host', none: 'conseguiu', worker: 'bloqueado' },
      { probe: 'Descobrir o cwd do host', none: 'conseguiu', worker: 'bloqueado' },
      { probe: 'Descobrir o binário do node', none: 'conseguiu', worker: 'bloqueado' },
    ],
    note: "`isolation: none` é o padrão e não é um sandbox fraco — é `require('./vite.config.js')`, que é perfeitamente seguro pro config que você escreveu.",
  },
  compare: {
    eyebrow: 'Onde isso se encaixa',
    title: 'Não é container, não é emulador',
    items: [
      {
        title: 'Um container por build',
        body: 'Provisionar, subir, montar, derrubar. Segundos de latência e uma frota pra operar, tudo pra isolar um passo que nunca executou nada.',
        verdict: 'O que isso substitui',
        tone: 'muted',
      },
      {
        title: 'nodeless',
        body: 'Uma chamada de função. Em memória, no processo que você já tem, e o mesmo caminho de código numa aba do navegador. Sai um dist.',
        verdict: 'Uma chamada de função',
        tone: 'accent',
      },
      {
        title: 'Um emulador de Node',
        body: 'Shell, dev server e HMR no navegador. Superfície maior, objetivo diferente, e só browser — não produz artefato de build.',
        verdict: 'Outro produto',
        tone: 'muted',
      },
    ],
  },
  faq: {
    eyebrow: 'Dúvidas',
    title: 'As que sempre aparecem',
    items: [
      {
        q: 'Como um build funciona sem Node?',
        a: 'Porque build é texto entrando e texto saindo. Ele lê arquivos, resolve cada import até o `node_modules`, transforma TSX em JS e junta tudo. Nada disso executa os seus componentes — eles rodam depois, no navegador de quem abre o site.',
      },
      {
        q: 'E os plugins do Vite, como rodam então?',
        a: 'Eles rodam, e essa é a sacada. Um projeto tem dois conjuntos de arquivos: a ferramenta e a aplicação. A ferramenta é executada, num sandbox onde `node:fs` é o sistema de arquivos em memória. A aplicação é só lida.',
      },
      {
        q: 'Roda `postinstall`?',
        a: 'Não, e nunca vai. Instalar é baixar um tarball e descompactar. Se um pacote precisa de lifecycle script pra funcionar, ele está fora do escopo por construção.',
      },
      {
        q: 'E pacotes com binding nativo?',
        a: 'Não funcionam aqui — precisam de um processo com `dlopen`, e não existe. Um pacote que tem build WASM dá pra mapear; um que não tem, não roda.',
      },
      {
        q: 'Dá pra rodar projeto de terceiro com segurança?',
        a: 'A metade da aplicação, sim — ela nunca executa. Pra metade do config, use `isolation: worker`, que roda num realm separado sem DOM, sem rede e sem nada do seu ambiente. A CI tem sete sondas tentando escapar.',
      },
      {
        q: 'Builda Next.js?',
        a: 'Não. O Next precisa do SWC nativo e de um servidor de verdade. O alvo são projetos Vite, e ser compatível com plugin de Vite é o que faz o resto do ecossistema funcionar.',
      },
    ],
  },
  cta: {
    title: 'Builde na aba que você já tem aberta',
    lead: 'O playground instala o React do npm no seu navegador e rebuilda enquanto você digita. Não tem nada rodando num servidor.',
    primary: 'Abrir o playground',
    secondary: 'Ler as notas de design',
  },
  footer: {
    tagline: 'npm install e um build de frontend, em processo.',
    madeBy: 'Feito pela Salve Software',
    license: 'MIT',
    columns: [
      {
        title: 'Projeto',
        links: [
          ['GitHub', 'https://github.com/Salve-Software/nodeless'],
          ['npm', 'https://www.npmjs.com/package/@salve-software/nodeless'],
          ['Releases', 'https://github.com/Salve-Software/nodeless/releases'],
        ],
      },
      {
        title: 'Docs',
        links: [
          ['README', 'https://github.com/Salve-Software/nodeless#readme'],
          [
            'Notas de design',
            'https://github.com/Salve-Software/nodeless/tree/main/docs/design',
          ],
          ['Exemplos', 'https://github.com/Salve-Software/nodeless/tree/main/example'],
        ],
      },
      {
        title: 'Mais',
        links: [
          ['Issues', 'https://github.com/Salve-Software/nodeless/issues'],
          [
            'Contribuindo',
            'https://github.com/Salve-Software/nodeless/blob/main/CONTRIBUTING.md',
          ],
          ['Salve Software', 'https://github.com/Salve-Software'],
        ],
      },
    ],
  },
};
