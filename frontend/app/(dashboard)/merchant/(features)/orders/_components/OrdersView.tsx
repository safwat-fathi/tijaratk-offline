"use client";


import { useMemo, useState, useEffect } from "react";
import { Order } from "@/types/models/order";
import { OrderStatus } from "@/types/enums";
import OrderStats from "./OrderStats";
import StatusTabs from "./StatusTabs";
import OrderCard from "./OrderCard";

interface OrdersViewProps {
  initialOrders: Order[];
  selectedDate?: string;
  tenantId?: number | null;
}

export default function OrdersView({ initialOrders, selectedDate, tenantId }: OrdersViewProps) {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>(OrderStatus.DRAFT);
  const [orders, setOrders] = useState<Order[]>(initialOrders);


  // Sync state when initialOrders changes (e.g. date filter)
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);


  // Memoize filtered orders and counts from LOCAL STATE (orders)
  const { filteredOrders, statusCounts } = useMemo(() => {
    const counts: Record<string, number> = {
      [OrderStatus.DRAFT]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.OUT_FOR_DELIVERY]: 0,
      [OrderStatus.COMPLETED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    const filtered: Order[] = [];

    orders.forEach((order) => {
      // Count every order
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      } else {
        counts[order.status] = (counts[order.status] || 0) + 1;
      }

      // Filter for current view
      if (order.status === activeStatus) {
        filtered.push(order);
      }
    });

    return { filteredOrders: filtered, statusCounts: counts };
  }, [orders, activeStatus]);

  // Total for the current view (based on orders)
  const totalCount = orders.length; 

  const renderEmptyState = () => {
    switch (activeStatus) {
      case OrderStatus.DRAFT:
        return (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">لا توجد طلبات جديدة.</p>
            <p className="text-sm text-gray-400 mt-1">ستظهر الطلبات هنا تلقائياً.</p>
          </div>
        );
      case OrderStatus.COMPLETED:
        return (
          <div className="text-center py-12 px-4">
             <p className="text-gray-500">لا توجد طلبات مكتملة.</p>
             <p className="text-sm text-gray-400 mt-1">ستظهر الطلبات المكتملة هنا.</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">لا توجد طلبات في هذه الحالة.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Sticky Header */}
      <OrderStats count={totalCount} selectedDate={selectedDate} />

      {/* 2. Status Tabs */}
      <div className="sticky top-[57px] z-10 bg-white shadow-sm">
        <StatusTabs 
          currentStatus={activeStatus} 
          counts={statusCounts} 
          onTabChange={setActiveStatus} 
        />
      </div>

      {/* 3. Orders List */}
      <div className="bg-gray-50 min-h-[calc(100vh-120px)]">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
