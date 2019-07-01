import { StorageService } from '~/app/shared';

export default () => {
  return {
    /**
     * This fixes a discovered bug where a REAL number was stored improperly
     * within SQLITE.
     * 
     * Unspent and Transactions should now store values as a TEXT prop
     * and be converted onload/destructure into a NUMBER.
     * 
     * This way we ensure we are saving the correct value and do not cause
     * stuck funds.
     * 
     * Unfortunately, this update will be a HARD PURGE of the entire wallet
     * structute for every previously released build to ensure previously
     * saved unspents are actually correct.
     */
    ChangeUnspentTypeToText: async (db: any): Promise<boolean> => {
      const storage = new StorageService();
      await storage.connect();
      await storage.purgeTable('logs')
      await storage.purgeGroup('wallet');
      await storage.createGroup('wallet');
      await storage.createTable('logs', StorageService.CreateLogsTable);
      return true;
    }
  };
};
