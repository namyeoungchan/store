import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleBackdropClick}>
      <div className={`dialog-content dialog-${type}`}>
        <div className="dialog-header">
          <h3 className="dialog-title">{title}</h3>
        </div>

        <div className="dialog-body">
          <p className="dialog-message">{message}</p>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .dialog-content {
          background: white;
          border-radius: 12px;
          min-width: 400px;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: dialogSlideIn 0.3s ease-out;
        }

        @keyframes dialogSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dialog-header {
          padding: 1.5rem 1.5rem 0 1.5rem;
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem;
        }

        .dialog-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }

        .dialog-warning .dialog-title {
          color: #f57c00;
        }

        .dialog-danger .dialog-title {
          color: #d32f2f;
        }

        .dialog-info .dialog-title {
          color: #2196f3;
        }

        .dialog-body {
          padding: 0 1.5rem 1.5rem;
        }

        .dialog-message {
          margin: 0;
          line-height: 1.5;
          color: #555;
          white-space: pre-line;
        }

        .dialog-footer {
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          min-width: 80px;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary {
          background: #2196f3;
          color: white;
        }

        .btn-primary:hover {
          background: #1976d2;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover {
          background: #eee;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #d32f2f;
        }

        @media (max-width: 500px) {
          .dialog-content {
            min-width: auto;
            width: 90vw;
            margin: 1rem;
          }

          .dialog-footer {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;