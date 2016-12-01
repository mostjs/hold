import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/hold.js',
  moduleName: 'mostHold',
  format: 'umd',
  sourceMap: true,
  plugins: [buble()]
}
