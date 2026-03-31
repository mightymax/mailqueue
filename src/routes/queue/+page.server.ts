import { fail, redirect } from '@sveltejs/kit';
import { getConfig } from '$lib/server/env';
import { deleteQueueItems, listQueue, resetQueueItems, setQueueItemsStatus } from '$lib/server/repositories';
import { deliverMailBatch } from '$lib/server/worker';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const sentParam = url.searchParams.get('sent');
  const action = url.searchParams.get('action');
  const status = url.searchParams.get('status')?.trim() || '';
  return {
    items: await listQueue(250, status || undefined),
    sent: Number.parseInt(sentParam ?? '0', 10) || 0,
    hadSendResult: sentParam !== null,
    action,
    status
  };
};

function parseIds(data: FormData) {
  return data
    .getAll('ids')
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
}

function filterSuffixFromData(data: FormData) {
  const status = data.get('currentStatus');
  if (typeof status !== 'string' || !status.trim()) return '';
  return `&status=${encodeURIComponent(status.trim())}`;
}

export const actions: Actions = {
  reset: async ({ request }) => {
    const data = await request.formData();
    const ids = parseIds(data);
    if (ids.length === 0) {
      return fail(400, { error: 'Missing queue item id' });
    }
    await resetQueueItems(ids);
    redirect(303, `/queue?action=reset${filterSuffixFromData(data)}`);
  },
  setStatus: async ({ request }) => {
    const data = await request.formData();
    const ids = parseIds(data);
    const status = data.get('nextStatus');
    if (ids.length === 0) {
      return fail(400, { error: 'Missing queue item id' });
    }
    if (status !== 'queued' && status !== 'cancelled' && status !== 'failed') {
      return fail(400, { error: 'Invalid queue status' });
    }
    await setQueueItemsStatus(ids, status);
    redirect(303, `/queue?action=status-${status}${filterSuffixFromData(data)}`);
  },
  delete: async ({ request }) => {
    const data = await request.formData();
    const ids = parseIds(data);
    if (ids.length === 0) {
      return fail(400, { error: 'Missing queue item id' });
    }
    await deleteQueueItems(ids);
    redirect(303, `/queue?action=delete${filterSuffixFromData(data)}`);
  },
  sendBatch: async ({ request }) => {
    const data = await request.formData();
    const config = getConfig();
    console.log(`[queue] sendBatch requested limit=${config.workerBatchSize}`);
    const sent = await deliverMailBatch(config.workerBatchSize);
    console.log(`[queue] sendBatch finished processed=${sent}`);
    redirect(303, `/queue?sent=${sent}${filterSuffixFromData(data)}`);
  }
};
