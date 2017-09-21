import buble from 'rollup-plugin-buble'
import pkg from './package.json'

export default {
  input: 'src/index.js',
  plugins: [
    buble()
  ],
  external: ['@most/core'],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'mostHold',
      sourcemap: true,
      globals: {
        '@most/core': 'mostCore'
      }
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ]
}
