import { useState, useEffect } from 'react';
import axios from 'axios';

const OrderTimeline = ({ order }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusLogs = async () => {
      try {
        if (order?.id) {
          const response = await axios.get(`/orders/${order.id}/status-logs`);
          setLogs(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Lỗi lấy log trạng thái:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchStatusLogs();
  }, [order?.id]);

  // Tìm thời điểm chuyển sang status cụ thể từ logs
  const getTimeForStatus = (status) => {
    if (!Array.isArray(logs)) return null;
    if (status === 'pending') return order?.created_at;
    const log = logs.find(l => l.status_new === status);
    return log ? log.created_at : null;
  };

  // Xây dựng các bước timeline dựa vào trạng thái hiện tại và logs
  const getTimelineSteps = () => {
    // Định nghĩa các bước cơ bản
    const baseSteps = [
      { status: 'pending', label: 'Đặt hàng', description: 'Đơn hàng đã được đặt', icon: '📝' },
      { status: 'confirmed', label: 'Xác nhận đơn', description: 'Đơn hàng đã được xác nhận', icon: '✓' },
      { status: 'shipping', label: 'Đang vận chuyển', description: 'Shipper đang giao hàng', icon: '🚚' },
      { status: 'delivered', label: 'Giao hàng thành công', description: 'Khách hàng đã nhận hàng', icon: '✅' }
    ];

    const steps = [];

    // Thêm các bước cơ bản dựa trên order.status
    const orderStatus = order?.status;
    const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered', 'return_requested', 'return_approved', 'return_shipped', 'return_rejected', 'return_received', 'failed_delivery', 'refund', 'cancelled'];
    const currentStatusIndex = statusOrder.indexOf(orderStatus);

    // Thêm các bước cơ bản
    for (const step of baseSteps) {
      const stepIndex = statusOrder.indexOf(step.status);
      const time = getTimeForStatus(step.status);
      const isCompleted = time || stepIndex < currentStatusIndex;
      const isOngoing = step.status === orderStatus;

      steps.push({
        ...step,
        time: time,
        completed: !!isCompleted,
        ongoing: isOngoing
      });
    }

    // Nếu có yêu cầu hoàn trả
    const isReturnFlow = !!getTimeForStatus('return_requested');
    if (isReturnFlow || orderStatus?.includes('return')) {
      const returnRequestedTime = getTimeForStatus('return_requested');
      steps.push({
        status: 'return_requested',
        label: 'Yêu cầu hoàn trả',
        description: order?.return_reason ? `Lý do: ${order.return_reason}` : 'Khách hàng gửi yêu cầu hoàn trả',
        icon: '📦',
        time: returnRequestedTime,
        completed: returnRequestedTime ? true : currentStatusIndex >= statusOrder.indexOf('return_requested'),
        ongoing: orderStatus === 'return_requested'
      });

      const returnApprovedAt = getTimeForStatus('return_approved');
      if (returnApprovedAt || orderStatus === 'return_approved') {
        steps.push({
          status: 'return_approved',
          label: 'Hoàn trả được duyệt',
          description: 'Admin đã chấp thuận yêu cầu, gửi hàng về kho',
          icon: '✅',
          time: returnApprovedAt,
          completed: returnApprovedAt ? true : currentStatusIndex >= statusOrder.indexOf('return_approved'),
          ongoing: orderStatus === 'return_approved'
        });
      }

      const returnShippedAt = getTimeForStatus('return_shipped');
      if (returnShippedAt || orderStatus === 'return_shipped' || currentStatusIndex >= statusOrder.indexOf('return_shipped')) {
        steps.push({
          status: 'return_shipped',
          label: 'Khách đã gửi hàng',
          description: 'Khách hàng đã bàn giao kiện hàng cho ĐVVC',
          icon: '📤',
          time: returnShippedAt,
          completed: returnShippedAt ? true : currentStatusIndex >= statusOrder.indexOf('return_shipped'),
          ongoing: orderStatus === 'return_shipped'
        });
      }

      const returnRejectedAt = getTimeForStatus('return_rejected');
      if (returnRejectedAt || orderStatus === 'return_rejected') {
        steps.push({
          status: 'return_rejected',
          label: 'Yêu cầu bị từ chối',
          description: order?.return_rejection_reason ? `Lý do: ${order.return_rejection_reason}` : 'Yêu cầu hoàn trả không được chấp thuận',
          icon: '❌',
          time: returnRejectedAt,
          completed: true
        });
      }

      const returnReceivedAt = getTimeForStatus('return_received');
      if (returnReceivedAt || orderStatus === 'return_received') {
        steps.push({
          status: 'return_received',
          label: 'Đã nhận hàng hoàn',
          description: 'Kho đã nhận hàng, tồn kho được cộng lại',
          icon: '🏠',
          time: returnReceivedAt,
          completed: returnReceivedAt ? true : currentStatusIndex >= statusOrder.indexOf('return_received'),
          ongoing: orderStatus === 'return_received'
        });
      }
    }

    // Nếu giao hàng thất bại
    const failedAt = getTimeForStatus('failed_delivery');
    if (failedAt || orderStatus === 'failed_delivery') {
      steps.push({
        status: 'failed_delivery',
        label: 'Giao thất bại (Cuối cùng)',
        description: 'Đã hết lượt thử giao hàng',
        icon: '❌',
        time: failedAt,
        completed: failedAt ? true : currentStatusIndex >= statusOrder.indexOf('failed_delivery')
      });
    }

    // Hoàn tiền
    const refundAt = getTimeForStatus('refund');
    if (refundAt || orderStatus === 'refund') {
      steps.push({
        status: 'refund',
        label: 'Đã hoàn tiền',
        description: 'Khách hàng đã nhận lại tiền',
        icon: '💰',
        time: refundAt,
        completed: true
      });
    }

    // Hủy đơn
    const cancelledAt = getTimeForStatus('cancelled');
    if (cancelledAt || orderStatus === 'cancelled') {
      steps.push({
        status: 'cancelled',
        label: 'Đơn bị hủy',
        description: 'Đơn hàng đã bị hủy bỏ',
        icon: '❌',
        time: cancelledAt,
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
              <div
                className={`relative flex flex-col items-center justify-start min-w-max px-4 py-3 rounded border-l-4 ${
                  step.completed
                    ? 'bg-green-50 border-l-green-500'
                    : step.ongoing
                    ? 'bg-blue-50 border-l-blue-500 animate-pulse'
                    : 'bg-gray-50 border-l-gray-300'
                }`}
              >
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
