const OrderTimeline = ({ order }) => {
  // Xây dựng các bước timeline dựa vào trạng thái hiện tại
  const getTimelineSteps = () => {
    const steps = [
      {
        status: 'pending',
        label: 'Đặt hàng',
        description: 'Đơn hàng đã được đặt',
        icon: '📝',
        time: order.created_at,
        completed: ['pending', 'confirmed', 'shipping', 'delivered', 'failed_delivery', 'failed_delivery_retry', 'return', 'refund', 'return_requested', 'return_approved', 'return_rejected', 'return_received'].includes(order.status)
      },
      {
        status: 'confirmed',
        label: 'Xác nhận đơn',
        description: 'Đơn hàng đã được xác nhận',
        icon: '✓',
        time: order.confirmed_at,
        completed: ['confirmed', 'shipping', 'delivered', 'failed_delivery', 'failed_delivery_retry', 'return', 'refund', 'return_requested', 'return_approved', 'return_rejected', 'return_received'].includes(order.status)
      },
      {
        status: 'shipping',
        label: 'Đang vận chuyển',
        description: 'Shipper đang giao hàng',
        icon: '🚚',
        time: order.shipping_at,
        completed: ['shipping', 'delivered', 'failed_delivery', 'failed_delivery_retry', 'return', 'refund', 'return_requested', 'return_approved', 'return_rejected', 'return_received'].includes(order.status)
      }
    ];

    // Kiểm tra flow: 
    // Flow 1 (Giao thất bại): failed_delivery_at→return→refund (không có return_requested_at)
    // Flow 2 (Hoàn hàng): delivered→return_requested→return_approved→return_received→refund (có return_requested_at)
    const isReturnFlow = order.return_requested_at; // Flow hoàn hàng có return_requested_at

    // Thêm bước giao thất bại nếu là FLOW 1 (giao thất bại, không phải hoàn hàng)
    if (!isReturnFlow && ['failed_delivery_retry', 'failed_delivery', 'return', 'refund'].includes(order.status)) {
      steps.push({
        status: 'failed_delivery_retry',
        label: `Giao thất bại (Lần ${order.retry_count || 1})`,
        description: `Không thể giao hàng - ${order.retry_count || 1}/3 lần thử`,
        icon: '⚠️',
        time: order.failed_delivery_at,
        completed: ['failed_delivery', 'return', 'refund'].includes(order.status),
        ongoing: order.status === 'failed_delivery_retry'
      });
    }

    // Thêm bước giao thất bại cuối cùng nếu là FLOW 1
    if (!isReturnFlow && ['return', 'refund'].includes(order.status)) {
      steps.push({
        status: 'failed_delivery',
        label: 'Giao thất bại (Cuối cùng)',
        description: 'Đã hết lượt thử giao hàng',
        icon: '❌',
        time: order.failed_delivery_final_at,
        completed: ['return', 'refund'].includes(order.status)
      });
    }

    // Thêm bước giao thành công hoặc trả hàng
    if (order.status === 'delivered') {
      steps.push({
        status: 'delivered',
        label: 'Giao hàng thành công',
        description: 'Khách hàng đã nhận hàng',
        icon: '✅',
        time: order.delivered_at,
        completed: true
      });
    } else if (['return_requested', 'return_approved', 'return_rejected', 'return_received', 'refund'].includes(order.status) && isReturnFlow) {
      // Flow 2: Customer-initiated return flow
      steps.push({
        status: 'delivered',
        label: 'Giao hàng thành công',
        description: 'Khách hàng đã nhận hàng',
        icon: '✅',
        time: order.delivered_at,
        completed: true
      });
      steps.push({
        status: 'return_requested',
        label: 'Yêu cầu hoàn trả',
        description: order.return_reason ? `Lý do: ${order.return_reason}` : 'Khách hàng gửi yêu cầu hoàn trả',
        icon: '📦',
        time: order.return_requested_at,
        completed: ['return_approved', 'return_rejected', 'return_received', 'refund'].includes(order.status),
        ongoing: order.status === 'return_requested'
      });
      if (['return_approved', 'return_received', 'refund'].includes(order.status)) {
        steps.push({
          status: 'return_approved',
          label: 'Hoàn trả được duyệt',
          description: 'Admin đã chấp thuận yêu cầu, gửi hàng về kho',
          icon: '✅',
          time: order.return_approved_at,
          completed: ['return_received', 'refund'].includes(order.status),
          ongoing: order.status === 'return_approved'
        });
      }
      if (['return_received', 'refund'].includes(order.status)) {
        steps.push({
          status: 'return_received',
          label: 'Đã nhận hàng hoàn',
          description: 'Kho đã nhận hàng, tồn kho được cộng lại',
          icon: '🏠',
          time: order.return_received_at,
          completed: ['refund'].includes(order.status)
        });
      }
      if (order.status === 'return_rejected') {
        steps.push({
          status: 'return_rejected',
          label: 'Yêu cầu bị từ chối',
          description: order.return_rejection_reason ? `Lý do: ${order.return_rejection_reason}` : 'Yêu cầu hoàn trả không được chấp thuận',
          icon: '❌',
          time: order.return_rejected_at,
          completed: true
        });
      }
    } else if (!isReturnFlow && ['return', 'refund'].includes(order.status)) {
      // Flow 1: Failed delivery return flow (không qua hoàn hàng)
      steps.push({
        status: 'return',
        label: 'Trả hàng',
        description: 'Hàng đã trả về kho',
        icon: '↩️',
        time: order.return_at,
        completed: ['refund'].includes(order.status)
      });
    }

    if (order.status === 'refund') {
      steps.push({
        status: 'refund',
        label: 'Đã hoàn tiền',
        description: 'Khách hàng đã nhận lại tiền',
        icon: '✅',
        time: order.refunded_at,
        completed: true
      });
    }

    // Thêm bước hủy đơn nếu có
    if (order.status === 'cancelled') {
      steps.push({
        status: 'cancelled',
        label: 'Đơn bị hủy',
        description: 'Đơn hàng đã bị hủy bỏ',
        icon: '❌',
        time: order.cancelled_at,
        completed: true
      });
    }

    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="w-full bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 sticky top-0 bg-white pb-2">Quy trình xử lý đơn hàng</h3>
      <div className="w-full max-w-full overflow-x-auto rounded bg-gray-50 p-2 mb-2 border border-gray-200" style={{ minHeight: '180px', scrollbarWidth: 'auto' }}>
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {steps.map((step, index) => (
            <div key={step.status} className="flex items-stretch gap-1 flex-shrink-0">
              {/* Timeline step card */}
              <div
                className={`relative flex flex-col items-center justify-start min-w-max px-4 py-3 rounded border-l-4 ${
                  step.completed
                    ? 'bg-green-50 border-l-green-500'
                    : step.ongoing
                    ? 'bg-blue-50 border-l-blue-500 animate-pulse'
                    : 'bg-gray-50 border-l-gray-300'
                }`}
              >
                {/* Status dot */}
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mb-2 flex-shrink-0 ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.ongoing
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}
                >
                  {step.completed ? '✓' : step.ongoing ? '▶' : '○'}
                </div>

                {/* Timeline content */}
                <div className={`text-center text-xs ${step.completed || step.ongoing ? 'text-gray-900' : 'text-gray-400'}`}>
                  <p className="font-semibold whitespace-nowrap">{step.label}</p>
                  {step.time && (
                    <div className="mt-2">
                      <p className="text-gray-600 whitespace-nowrap font-medium">
                        {new Date(step.time).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-gray-500 whitespace-nowrap">
                        {new Date(step.time).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center px-1 flex-shrink-0">
                  <div className="h-0.5 w-3 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
        💡 <strong>Mẹo:</strong> Cuộn ngang để xem toàn bộ quy trình xử lý
      </div>
    </div>
  );
};

export default OrderTimeline;
