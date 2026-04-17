const fs = require('fs');

const content = `export const environment = {
  serverAddress: '${process.env.serverAddress}',
  bluemapUrl: '${process.env.bluemapUrl}',
  statusApiBase: '${process.env.statusApiBase}',
  tmsApiBase: '${process.env.tmsApiBase}',
};
`;

fs.writeFileSync('src/environments/environment.ts', content);
fs.writeFileSync('src/environments/environment.prod.ts', content);
console.log('Generated environment.ts and environment.prod.ts');
