import { AiOutlineCheckCircle, AiOutlineExclamationCircle, AiOutlineInfoCircle, AiOutlineClose } from 'react-icons/ai';

// Modal types: 'success', 'error', 'warning', 'info'
const Modal = ({ isOpen, type = 'info', title, message, onClose, onConfirm, confirmText = 'OK', cancelText = 'Hủy', showCancel = false }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <AiOutlineCheckCircle className="text-4xl text-green-500" />;
      case 'error':
        return <AiOutlineExclamationCircle className="text-4xl text-red-500" />;
      case 'warning':
        return <AiOutlineExclamationCircle className="text-4xl text-yellow-500" />;
      case 'info':
      default:
        return <AiOutlineInfoCircle className="text-4xl text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <AiOutlineClose className="text-xl" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        {title && (
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h2>
        )}

        {/* Message */}
        <p className="text-gray-700 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-6 py-2 text-white rounded-lg font-semibold transition ${getButtonColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
