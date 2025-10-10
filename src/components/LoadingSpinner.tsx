import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  overlay = false
}) => {
  const sizeClass = `spinner-${size}`;

  const spinner = (
    <div className={`loading-container ${overlay ? 'loading-overlay' : ''}`}>
      <div className={`spinner ${sizeClass}`}>
        <div className="spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      {message && <p className="loading-message">{message}</p>}

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          z-index: 999;
          backdrop-filter: blur(2px);
        }

        .spinner {
          display: inline-block;
          position: relative;
        }

        .spinner-small {
          width: 24px;
          height: 24px;
        }

        .spinner-medium {
          width: 40px;
          height: 40px;
        }

        .spinner-large {
          width: 64px;
          height: 64px;
        }

        .spinner-ring {
          display: inline-block;
          position: relative;
          width: 100%;
          height: 100%;
        }

        .spinner-ring div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid #2196f3;
          border-radius: 50%;
          animation: spinner-animation 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #2196f3 transparent transparent transparent;
        }

        .spinner-ring div:nth-child(1) {
          animation-delay: -0.45s;
        }

        .spinner-ring div:nth-child(2) {
          animation-delay: -0.3s;
        }

        .spinner-ring div:nth-child(3) {
          animation-delay: -0.15s;
        }

        @keyframes spinner-animation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-message {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          text-align: center;
        }

        .spinner-small + .loading-message {
          font-size: 0.8rem;
        }

        .spinner-large + .loading-message {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );

  return spinner;
};

export default LoadingSpinner;