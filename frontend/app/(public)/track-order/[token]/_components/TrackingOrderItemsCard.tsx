'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  decideReplacementByTrackingAction,
  rejectOrderByTrackingAction,
} from '@/actions/order-tracking-actions';
import { formatCurrency } from '@/lib/utils/currency';
import {
  OrderStatus,
  ReplacementDecisionStatus,
} from '@/types/enums';
import { OrderItem } from '@/types/models/order';

type TrackingOrderItemsCardProps = {
  token: string;
  initialOrderStatus: OrderStatus;
  initialItems: OrderItem[];
};

export default function TrackingOrderItemsCard({
  token,
  initialOrderStatus,
  initialItems,
}: TrackingOrderItemsCardProps) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialOrderStatus);
  const [orderRejectReason, setOrderRejectReason] = useState('');
  const [itemRejectReasons, setItemRejectReasons] = useState<
    Record<number, string>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDecisionWindow =
    orderStatus === OrderStatus.DRAFT || orderStatus === OrderStatus.CONFIRMED;

  const handleApprove = (itemId: number) => {
    startTransition(async () => {
      const response = await decideReplacementByTrackingAction(token, itemId, {
        decision: 'approve',
      });

      if (!response.success) {
        setFeedback(response.error || 'تعذر تسجيل الموافقة');
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          return {
            ...item,
            replaced_by_product_id: item.pending_replacement_product_id || null,
            replaced_by_product: item.pending_replacement_product || null,
            pending_replacement_product_id: null,
            pending_replacement_product: null,
            replacement_decision_status: ReplacementDecisionStatus.APPROVED,
            replacement_decision_reason: null,
            replacement_decided_at: new Date().toISOString(),
          };
        }),
      );

      router.refresh();
      setFeedback('تمت الموافقة على البديل');
    });
  };

  const handleReject = (itemId: number) => {
    startTransition(async () => {
      const reason = itemRejectReasons[itemId]?.trim();
      const response = await decideReplacementByTrackingAction(token, itemId, {
        decision: 'reject',
        reason: reason || undefined,
      });

      if (!response.success) {
        setFeedback(response.error || 'تعذر تسجيل الرفض');
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          return {
            ...item,
            replaced_by_product_id: null,
            replaced_by_product: null,
            pending_replacement_product_id: null,
            pending_replacement_product: null,
            replacement_decision_status: ReplacementDecisionStatus.REJECTED,
            replacement_decision_reason: reason || null,
            replacement_decided_at: new Date().toISOString(),
          };
        }),
      );

      router.refresh();
      setFeedback('تم رفض البديل المقترح');
    });
  };

  const handleRejectOrder = () => {
    startTransition(async () => {
      const reason = orderRejectReason.trim();
      const response = await rejectOrderByTrackingAction(token, {
        reason: reason || undefined,
      });

      if (!response.success) {
        setFeedback(response.error || 'تعذر رفض الطلب');
        return;
      }

      setOrderStatus(OrderStatus.REJECTED_BY_CUSTOMER);
      router.refresh();
      setFeedback('تم رفض الطلب بالكامل');
    });
  };

  const getDecisionStatus = (item: OrderItem) =>
    item.replacement_decision_status || ReplacementDecisionStatus.NONE;

  const resolveSelectionText = (item: OrderItem): string => {
    if (item.selection_mode === 'weight' && item.selection_grams) {
      return `${item.selection_grams} جم`;
    }

    if (item.selection_mode === 'price' && item.selection_amount_egp) {
      return `${Number(item.selection_amount_egp)} جنيه`;
    }

    if (item.selection_mode === 'quantity' && item.selection_quantity) {
      return String(item.selection_quantity);
    }

    return item.quantity;
  };

  return (
    <>
      {isDecisionWindow && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">رفض الطلب بالكامل</p>
          <p className="mt-1 text-xs text-red-700">
            يمكنك رفض الطلب بالكامل طالما الطلب في حالة قيد المراجعة أو مؤكد.
          </p>
          <textarea
            value={orderRejectReason}
            onChange={(event) => setOrderRejectReason(event.target.value)}
            placeholder="سبب الرفض (اختياري)"
            rows={2}
            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
          />
          <button
            type="button"
            onClick={handleRejectOrder}
            disabled={isPending}
            className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            رفض الطلب
          </button>
        </div>
      )}

      {feedback && (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {feedback}
        </p>
      )}

      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
        {items && items.length > 0 ? (
          items.map((item) => {
            const decisionStatus = getDecisionStatus(item);
            const replacementName = item.replaced_by_product?.name;
            const pendingReplacementName = item.pending_replacement_product?.name;
            const displayName = replacementName || item.name_snapshot;

            const showPendingDecision =
              isDecisionWindow &&
              decisionStatus === ReplacementDecisionStatus.PENDING &&
              Boolean(pendingReplacementName);

            return (
              <li key={item.id} className="pl-3 pr-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="w-0 flex-1">
                    <span className="ml-2 block truncate font-medium">
                      {displayName} x {resolveSelectionText(item)}
                    </span>
                  </div>
                  <div className="ml-4 shrink-0">
                    {item.total_price !== null && item.total_price !== undefined
                      ? formatCurrency(Number(item.total_price) || 0)
                      : 'يُحدد لاحقاً'}
                  </div>
                </div>

                {showPendingDecision && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <p className="text-xs font-semibold text-amber-800">
                      تم اقتراح بديل: {pendingReplacementName}
                    </p>
                    <textarea
                      value={itemRejectReasons[item.id] || ''}
                      onChange={(event) =>
                        setItemRejectReasons((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="سبب الرفض (اختياري)"
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-amber-400"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        disabled={isPending}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        موافقة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        disabled={isPending}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                )}

                {decisionStatus === ReplacementDecisionStatus.APPROVED && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    تمت الموافقة على الاستبدال
                  </p>
                )}

                {decisionStatus === ReplacementDecisionStatus.REJECTED && (
                  <div className="mt-2 text-xs font-semibold text-rose-700">
                    <p>تم رفض الاستبدال</p>
                    {item.replacement_decision_reason && (
                      <p className="mt-1 text-rose-600">
                        السبب: {item.replacement_decision_reason}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <li className="pl-3 pr-4 py-3 text-sm text-gray-700 italic">
            لا يوجد عناصر
          </li>
        )}
      </ul>
    </>
  );
}
