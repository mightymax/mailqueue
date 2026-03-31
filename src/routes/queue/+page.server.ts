import { fail, redirect } from '@sveltejs/kit';
import { getConfig } from '$lib/server/env';
import { cancelQueueItem, listQueue, retryQueueItem } from '$lib/server/repositories';
import { deliverMailBatch } from '$lib/server/worker';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const sentParam = url.searchParams.get('sent');
  const action = url.searchParams.get('action');
  return {
    items: await listQueue(250),
    sent: Number.parseInt(sentParam ?? '0', 10) || 0,
    hadSendResult: sentParam !== null,
    action
  };
};

export const actions: Actions = {
  retry: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');
    if (typeof id !== 'string' || !id) {
      return fail(400, { error: 'Missing queue item id' });
    }
    await retryQueueItem(id);
    redirect(303, '/queue?action=retry');
  },
  cancel: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');
    if (typeof id !== 'string' || !id) {
      return fail(400, { error: 'Missing queue item id' });
    }
    await cancelQueueItem(id);
    redirect(303, '/queue?action=cancel');
  },
  sendBatch: async () => {
    const config = getConfig();
    const sent = await deliverMailBatch(config.workerBatchSize);
    redirect(303, `/queue?sent=${sent}`);
  }
};
