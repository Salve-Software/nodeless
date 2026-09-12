import type { Copy } from './types';

export const ptBR: Copy = {
  nav: {
    home: 'Início',
    docs: 'Docs',
    github: 'GitHub',
    npm: 'npm',
    theme: 'Alternar tema',
    language: 'Mudar idioma',
  },

  home: {
    badge: 'v0.2 disponível',
    title: 'Builde um projeto frontend sem Node',
    lead: 'A nodeless instala pacotes do npm e bundla o seu app em memória. Roda dentro da sua API e dentro do navegador, sem container pra gerenciar.',
    install: 'npm install @salve-software/nodeless',
    copy: 'Copiar',
    copied: 'Copiado',
    primary: 'Começar',
    secondary: 'Ver no GitHub',

    stats: [
      { value: '200', unit: 'ms', label: 'pra buildar um app React' },
      { value: '4', unit: '', label: 'dependências' },
      { value: '0', unit: '', label: 'containers' },
    ],

    cards: [
      {
        title: 'Um npm install de verdade',
        body: 'Ranges de semver, checagem de integridade e lockfile. Direto do registry pra memória.',
      },
      {
        title: 'O seu Vite config roda',
        body: 'Plugins, aliases e define funcionam do jeito que já funcionam no seu projeto.',
      },
      {
        title: 'Um pacote, os dois lados',
        body: 'O mesmo código roda no seu servidor e numa aba do navegador.',
      },
      {
        title: 'Erro volta como dado',
        body: 'Build que falha devolve arquivo, linha e coluna. Nada lança exceção.',
      },
    ],

    why: {
      eyebrow: 'Como funciona',
      title: 'Um bundler nunca roda o seu app',
      body: 'Ele lê os seus arquivos e reescreve. Os seus componentes rodam depois, no navegador de quem abre o site. Esse passo nunca precisou de container.',
      link: 'Ver os detalhes',
      toolchain: {
        title: 'Ferramentas de build',
        verdict: 'Rodam, num sandbox',
        files: ['vite.config.ts', '@vitejs/plugin-react', '@tailwindcss/vite'],
      },
      app: {
        title: 'O seu app',
        verdict: 'Só lido',
        files: ['src/main.tsx', 'src/App.tsx', 'react, react-dom'],
      },
      note: 'O seu app nunca é importado pelo seu config. Os dois não se encontram.',
    },

    sample: {
      eyebrow: 'Na sua API',
      title: 'Três chamadas e você tem um dist',
      file: 'controller.ts',
      code: `import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({ files, isolation: 'none' });

await project.install();
const result = await project.build();

result.files; // index.html, bundle.js, bundle.css`,
    },

    cta: {
      title: 'Teste no seu navegador',
      body: 'O playground instala o React do npm na sua aba e rebuilda enquanto você digita.',
      primary: 'Abrir o playground',
      secondary: 'Ler a documentação',
    },
  },

  docs: {
    title: 'Docs',
    subtitle: 'Instale, builde alguma coisa, depois ajuste do jeito que você precisa.',
    onThisPage: 'Nesta página',
    more: 'Notas de design',
    sections: [
      {
        id: 'install',
        title: 'Instalação',
        body: 'Node 20 ou mais novo, ou qualquer navegador com fetch e WebAssembly.',
        code: 'npm install @salve-software/nodeless',
        lang: 'bash',
      },
      {
        id: 'quick-start',
        title: 'Primeiros passos',
        body: 'Passe um mapa de arquivos. Você recebe index.html, bundle.js e bundle.css como bytes.',
        code: `import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({
  files: {
    '/package.json': '{ "dependencies": { "react": "^19.0.0" } }',
    '/src/main.tsx': "import { createRoot } from 'react-dom/client';",
  },
  isolation: 'none',
});

await project.install();

const result = await project.build();

if (result.ok) {
  writeSomewhere(result.files);
} else {
  console.error(result.errors);
}`,
      },
      {
        id: 'browser',
        title: 'No navegador',
        body: 'Passe um wasmURL pro esbuild e o resto é igual. Use watch pra rebuildar quando os arquivos mudarem.',
        code: `const project = new NodelessProject({
  files: STARTER,
  wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
  isolation: 'worker',
});

project.watch(async () => {
  const result = await project.build({ mode: 'development' });

  if (result.ok) {
    iframe.srcdoc = new TextDecoder().decode(result.files['index.html']);
  }
});`,
      },
      {
        id: 'config',
        title: 'Config do projeto',
        body: 'Se o projeto tem um vite.config.ts, a nodeless roda ele. Plugins do npm, módulos virtuais, define e resolve.alias funcionam. node:fs dentro de um plugin lê o sistema de arquivos virtual.',
        code: `import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync('/package.json', 'utf8'));

export default ({ mode }) => ({
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '~': '/src' } },
});`,
      },
      {
        id: 'isolation',
        title: 'Isolamento',
        body: 'Config é código. Use none quando você escreveu, que é o mesmo que dar require nele. Use worker quando quem escreve é o seu usuário, e ele roda num realm separado sem DOM, sem rede e sem nada do seu ambiente.',
        code: `// Navegador
new NodelessProject({ files, isolation: 'worker' });

// Servidor
import { createNodeChannel } from '@salve-software/nodeless/node';

new NodelessProject({ files, isolation: 'worker', channel: createNodeChannel });`,
      },
      {
        id: 'errors',
        title: 'Erros',
        body: 'build nunca lança exceção por causa de um projeto quebrado. Ele devolve um resultado que você checa.',
        code: `const result = await project.build();

if (!result.ok) {
  for (const error of result.errors) {
    console.log(error.file, error.line, error.text);
  }
}`,
      },
      {
        id: 'options',
        title: 'Opções de build',
        body: 'Cada campo sobrescreve um padrão.',
        table: [
          ['entry', 'o primeiro src/main.* que existir'],
          ['mode', "'production'"],
          ['outdir', '/dist'],
          ['target', "'es2020'"],
          ['define', '{}'],
          ['external', '[]'],
          ['publicDir', '/public'],
          ['assetLimit', '4096 bytes'],
          ['env', 'entra no import.meta.env'],
          ['cdn', 'desligado'],
        ],
      },
      {
        id: 'limits',
        title: 'O que ela não faz',
        body: 'Pacotes com binding nativo, scripts de postinstall, Next.js, e hooks de output tipo generateBundle. O raciocínio completo está nas notas de design.',
      },
    ],
  },

  footer: {
    tagline: 'npm install e um build de frontend, em memória.',
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
        title: 'Aprender',
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
