const path = require('path');
const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'flux-server',
      script: 'server/index.js',
      cwd: root,
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'flux-client',
      script: 'npx',
      args: 'vite',
      cwd: path.join(root, 'client')
    }
  ]
};
