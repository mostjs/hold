import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/hold.es2015.js',
  sourceMap: true,
  plugins: [buble()]
}
