import bannerPlugin from './plugins/banner.js';

export default ({ mode }: { mode: string }) => ({
  define: {
    __BUILD_MODE__: JSON.stringify(mode),
  },
  resolve: {
    alias: { '~': '/src' },
  },
  plugins: [
    bannerPlugin({ text: 'built by nodeless' }),
    {
      name: 'build-info',
      resolveId: (source: string) =>
        source === 'virtual:build-info' ? '/virtual/build-info.js' : null,
      load: (id: string) =>
        id === '/virtual/build-info.js'
          ? `export const builtAt = ${JSON.stringify(new Date(0).toISOString())};`
          : null,
    },
  ],
});
