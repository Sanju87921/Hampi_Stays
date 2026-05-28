import { ResortIndexer } from './resortIndexer.js';
import { logSecureInfo, logSecureError } from '../../logging/logger.js';

export async function triggerAlgoliaSync(env) {
  try {
    const indexer = new ResortIndexer(env);
    
    // First, configure the indices with faceting and ranking algorithms
    await indexer.algolia.configureIndices();
    
    // Then, batch index all approved resorts
    const count = await indexer.indexAllActiveResorts();
    
    logSecureInfo('ALGOLIA_SYNC_SUCCESS', `Successfully synced ${count} resorts to Algolia.`);
    return { success: true, count };
  } catch (err) {
    logSecureError('ALGOLIA_SYNC_FAILED', 'Failed to synchronize with Algolia', { error: err.message });
    return { success: false, error: err.message };
  }
}
