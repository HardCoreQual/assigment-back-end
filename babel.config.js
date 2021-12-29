module.exports = {
  'presets': [['@babel/preset-env', {
    'targets': {'node': 12},
  }], '@babel/preset-typescript'],
  env: {
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};