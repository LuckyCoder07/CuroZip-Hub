import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cz-dark-bg flex flex-col items-center justify-center px-6 text-center">
      {/* Curozip icon */}
      <img
        src="https://finixia.in/logo%27s/curozip-icon.png?v=1.4"
        alt="Curozip"
        className="w-20 h-20 object-contain mb-8 opacity-60"
      />

      {/* 404 */}
      <p className="font-mono text-cz-accent-orange font-black mb-4"
        style={{ fontSize: 96, lineHeight: 1, letterSpacing: '-4px' }}>
        404
      </p>

      {/* Text */}
      <h1 className="text-white font-bold text-3xl mb-3">Page not found</h1>
      <p className="text-cz-text-secondary text-base max-w-sm mb-10">
        The page you're looking for doesn't exist or has been moved to a new location.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-cz-border text-cz-text-secondary hover:text-white hover:border-white/30 rounded-xl font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2.5 bg-cz-accent-orange hover:bg-[#ea6c0a] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <Home size={16} />
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
