const SqlLite = require('nativescript-sqlite');
import { StorageService } from '~/app/shared';

export default async function loadMigration(migrationId: string) {
  const odb = await new SqlLite(StorageService.DatabaseName);

  try {
    odb.resultType(SqlLite.RESULTSASOBJECT);

    const migrationFile = await import(`./${migrationId}`);
    const migrations = migrationFile.default();

    const migrationKeys = Object.keys(migrations);
    if (!Array.isArray(migrationKeys)) throw new Error('Malformed migration file, aborting...');

    while (migrationKeys.length) {
      const key = migrationKeys.shift();

      console.log(`[Migration]
          Migration File:   './${migrationId}'
          Migration Method: '${key}'
      `);

      const migration = migrations[key];
      await migration(odb);
    }

    await odb.close();
    return true;
  } catch (err) {
    console.log(`[Migration] FAILURE
          Migration File:   './${migrationId}'
          ERROR: ${err.message ? err.message : err}
    `);

    await odb.close();
    return null;
  }
}
