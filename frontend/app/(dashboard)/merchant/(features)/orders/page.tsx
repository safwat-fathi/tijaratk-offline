import { ordersService } from "@/services/api/orders.service";
import { OrderStatus } from "@/types/enums";

export const metadata = {
	title: "Orders",
};

async function getOrders() {
  try {
    const response = await ordersService.getOrders();
    console.log("🚀 ~ :13 ~ getOrders ~ response:", response)
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return [];
  }
}

export default async function Orders() {
  const orders = await getOrders();

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case OrderStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        {/* Placeholder for 'New Order' button later */}
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              No orders found.
            </li>
          ) : (
            orders.map((order) => (
              <li key={order.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-indigo-600">
                        Order #{order.id}
                      </p>
                      <div className="ml-2 flex shrink-0">
                        <p
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {(order.customer?.name as string) || "Unknown Customer"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Total:{" "}
                          <span className="font-medium text-gray-900">
                            {order.total || 0} EGP
                          </span>
                        </p>
                        <p className="ml-4">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
