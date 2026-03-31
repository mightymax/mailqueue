import { error } from '@sveltejs/kit';
import { getQueueItem } from '$lib/server/repositories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const item = await getQueueItem(params.id);
  if (!item) {
    error(404, 'Queue item not found');
  }

  return {
    item
  };
};
