import React from 'react';
import { SectionHeading } from '../../components/ui';

const About = () => {
  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <SectionHeading
        badge="Our Story"
        title="Unifying the world's "
        highlight="scattered data."
        description="We believe that your digital life shouldn't be fragmented across dozens of disconnected silos."
      />
      
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-xl text-slate-300 leading-relaxed mb-8">
          In 2024, our founders realized they were spending more time searching for files across different cloud platforms than actually working on them. DriveUnify was born out of frustration and built for productivity.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 my-16">
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-slate-400">To build the definitive abstraction layer for cloud storage, enabling seamless data flow across any provider, anywhere in the world.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
            <p className="text-slate-400">A future where you don't think about "where" a file is saved, but rather "what" the file is. We handle the logistics.</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-8 mt-16">Backed by the best</h2>
        <p className="text-slate-400 mb-12">
          DriveUnify is a venture-backed startup, supported by leading investors who share our vision for a unified digital ecosystem.
        </p>
        
        {/* Placeholder for team or investors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[1,2,3,4].map(i => (
             <div key={i} className="aspect-square rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-slate-700 mb-4 skeleton"></div>
                <div className="h-4 w-20 bg-slate-700 rounded skeleton mb-2"></div>
                <div className="h-3 w-16 bg-slate-700/50 rounded skeleton"></div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default About;
