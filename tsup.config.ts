import { readFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/core/index.ts'],
  outDir: 'out',
  format: ['cjs'],
  clean: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  shims: true,
  noExternal: [/.*/],
  external: [
    '@actions/core',
  ],
  // see https://github.com/csstree/csstree/issues/314
  esbuildPlugins: [
    {
      name: 'css-tree-patch',
      setup(build) {
        build.onLoad(
          { filter: /node_modules\/css-tree\/.*\.js$/ },
          async (args) => {
            let contents = await readFile(args.path, 'utf8');

            if (contents.includes('createRequire(import.meta.url)')) {
              console.log('⚡ Patching css-tree file:', args.path);

              contents = contents.replace(
                /const\s+require\s*=\s*createRequire\(import\.meta\.url\);?/g,
                '',
              );
            }

            return {
              contents,
              loader: 'js',
            };
          },
        );
      },
    },
  ],
});
