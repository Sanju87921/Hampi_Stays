import algoliasearch from 'algoliasearch/lite';

const appId = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '';

// Initialize client only if keys exist to prevent crashing in dev if unset
export const searchClient = appId && searchKey ? algoliasearch(appId, searchKey) : null;

// Helper to mock search client if not configured yet
export const getSearchClient = () => {
  if (searchClient) return searchClient;
  
  // Return a mock object satisfying the InstantSearch interface for graceful degradation
  return {
    search(requests: any[]) {
      console.warn('[ALGOLIA_MOCK] Search executed, but keys are missing.');
      return Promise.resolve({
        results: requests.map(() => ({
          hits: [],
          nbHits: 0,
          nbPages: 0,
          page: 0,
          processingTimeMS: 0,
        }))
      });
    },
    searchForFacetValues() {
      return Promise.resolve([{ facetHits: [] }]);
    }
  };
};
