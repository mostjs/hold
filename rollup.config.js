import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'
import pkg from './package.json'

export default {
  input: 'src/index.js',
  plugins: [
    flow(),
    buble()
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
