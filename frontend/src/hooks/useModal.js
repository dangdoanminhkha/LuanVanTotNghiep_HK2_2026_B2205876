import { useState } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info', // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Hủy',
    showCancel: false,
    onConfirm: null
  });

  const showModal = (config) => {
    setModal({
      isOpen: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Hủy',
      showCancel: config.showCancel || false,
      onConfirm: config.onConfirm || null
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const showSuccess = (title, message, onConfirm) => {
    showModal({
      type: 'success',
      title,
      message,
      onConfirm
    });
  };

  const showError = (title, message, onConfirm) => {
    showModal({
      type: 'error',
      title,
      message,
      onConfirm
    });
  };

  const showWarning = (title, message, onConfirm, showCancel = false) => {
    showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'Tiếp tục',
      cancelText: 'Hủy',
      showCancel,
      onConfirm
    });
  };

  const showInfo = (title, message, onConfirm) => {
    showModal({
      type: 'info',
      title,
      message,
      onConfirm
    });
  };

  return {
    modal,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useModal;
