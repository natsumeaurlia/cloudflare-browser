const path = require('path')

module.exports = {
  '*.{js,jsx,ts,tsx}': ["bun lint", 'bun format'],
}
