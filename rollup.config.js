import buble from 'rollup-plugin-buble'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.js',
  plugins: [
    buble(),
    nodeResolve({
      jsnext: true
    })
  ],
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'mostHold',
      sourcemap: true
    },
    {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true
    }
  ]
}
