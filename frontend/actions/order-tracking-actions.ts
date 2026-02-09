'use server';

import { revalidatePath } from 'next/cache';

import { clearTrackedOrdersCookie } from '@/lib/tracking/customer-tracking-cookie';

export async function clearTrackedOrdersAction() {
  await clearTrackedOrdersCookie();
  revalidatePath('/track-orders');
}
