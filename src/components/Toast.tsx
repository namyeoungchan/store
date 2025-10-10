import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={() => setIsVisible(false)}>
          ×
        </button>
      </div>

      <style>{`
        .toast {
          position: fixed;
          top: 2rem;
          right: 2rem;
          min-width: 300px;
          max-width: 500px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          transition: all 0.3s ease;
        }

        .toast-show {
          opacity: 1;
          transform: translateX(0);
        }

        .toast-hide {
          opacity: 0;
          transform: translateX(100%);
        }

        .toast-success {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
        }

        .toast-error {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .toast-warning {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
        }

        .toast-info {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
        }

        .toast-content {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          gap: 0.75rem;
        }

        .toast-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          font-weight: 500;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .toast-close:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .toast {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

// Toast Manager Component
interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  onRemoveToast: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${2 + index * 5}rem`,
            right: '2rem',
            zIndex: 1001 + index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default Toast;