import { environment as devEnvironment } from './environment.dev';

export const environment = (() => {
  console.log('Missing access to environment locals...');
  console.log(`Default Environment: [dev]`);
  return devEnvironment;
})();
