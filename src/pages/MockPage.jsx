import React from 'react';

const MockPage = ({ title }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="bg-cz-card-bg rounded-xl border border-cz-border p-8 text-center text-cz-text-secondary">
        This is a mock page for <strong>{title}</strong>.
      </div>
    </div>
  );
};

export default MockPage;
