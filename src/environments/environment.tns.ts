import { environment as devEnvironment } from './environment.dev';
import { environment as prodEnvironment } from './environment.prod';
import { environment as regEnvironment } from './environment.reg';

export const environment = (() => {
  let envVars;

  console.log('Running Environment Loader');

  try {
    switch (global['env'].environment) {
      case 'prod':
        envVars = prodEnvironment;
        break;
      case 'reg':
        envVars = regEnvironment;
        break;
      default:
        envVars = devEnvironment;
    }

    console.log(`Detected Environment: [${global['env'].environment}]`);
  } catch (err) {
    console.log('Environment load issue:');
    console.log(err.message ? err.message : err);

    console.log(`Default Environment: [dev]`);
    envVars = devEnvironment;
  }

  return envVars;
})();
