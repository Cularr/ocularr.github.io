const path = require('path');

module.exports = {
  plugins: {
    autoprefixer: {},
    '@csstools/postcss-global-data': {
      files: [path.join(__dirname, 'src/Styles/Variables/breakpoints.css')]
    },
    'postcss-custom-media': {},
    'postcss-nested': {}
  }
};
