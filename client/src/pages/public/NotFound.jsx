import React from 'react';
import { Link } from 'react-router-dom';
import { SectionHeading, AnimatedButton } from '../../components/ui';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-slate-800 mb-4 select-none">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page not found</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        <AnimatedButton to="/" icon={ArrowLeft}>
          Back to Home
        </AnimatedButton>
      </div>
    </div>
  );
};

export default NotFound;
