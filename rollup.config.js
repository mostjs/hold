import buble from 'rollup-plugin-buble'
import nodeResolve from 'rollup-plugin-node-resolve'
import pkg from './package.json'

export default {
  input: 'src/index.js',
  plugins: [
    buble(),
    nodeResolve()
  ],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'mostHold',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ]
}
