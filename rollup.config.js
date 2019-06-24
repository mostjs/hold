import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      tsconfig: './src/tsconfig.json'
    })
  ],
  external: ['@most/core', '@most/scheduler'],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'mostHold',
      sourcemap: true,
      globals: {
        '@most/core': 'mostCore',
        '@most/scheduler': 'mostScheduler'
      }
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ]
}
