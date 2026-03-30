import { getDashboardStats, listQueue, listTokens } from '$lib/server/repositories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [stats, recentQueue, recentTokens] = await Promise.all([
    getDashboardStats(),
    listQueue(8),
    listTokens()
  ]);

  return {
    stats,
    recentQueue,
    recentTokens: recentTokens.slice(0, 5)
  };
};
