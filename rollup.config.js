import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const vendors = []
  // Make all external dependencies to be exclude from rollup
  .concat(
    Object.keys(pkg.dependencies),
    Object.keys(pkg.peerDependencies),
    'redux-saga/effects'
  )

export default {
  input: `src/index.js`,
  output: [
    { file: `lib/index.cjs.js`, format: 'cjs', exports: 'named' },
    { file: `lib/index.esm.js`, format: 'esm' },
  ],
  external: vendors,
  plugins: [babel({ exclude: 'node_modules/**' })]
}
