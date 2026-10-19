'use client';
import React, { useState } from 'react';
import { SectionHeading, AnimatedButton, GlassCard } from '@/components/ui';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <SectionHeading
        badge="Get In Touch"
        title="We're here to "
        gradientWord="support you."
        subtitle="Have questions about multi-account setup, security, or enterprise capabilities? Reach out to our team."
      />

      <div className="grid md:grid-cols-2 gap-10">
        <GlassCard>
          {submitted ? (
            <div className="text-center py-10">
              <span className="text-4xl mb-3 block">✓</span>
              <h3 className="text-xl font-bold text-ink mb-2">Message Sent!</h3>
              <p className="text-muted text-sm">Thank you for reaching out. A team member will reply within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Your Name</label>
                <input
                  required
                  type="text"
                  className="bg-page border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-line transition-colors"
                  placeholder="Aarav Mehta"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Email Address</label>
                <input
                  required
                  type="email"
                  className="bg-page border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-line transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Message</label>
                <textarea
                  required
                  rows={4}
                  className="bg-page border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-line transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <AnimatedButton type="submit" className="mt-2 w-full">
                Send Message
              </AnimatedButton>
            </form>
          )}
        </GlassCard>

        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-line">
            <h3 className="text-lg font-bold text-ink mb-1">General Inquiries</h3>
            <p className="text-muted text-sm mb-3">Questions about features or getting started?</p>
            <a href="mailto:support@driveunify.com" className="text-brand hover:underline text-sm font-semibold">
              support@driveunify.com
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-line">
            <h3 className="text-lg font-bold text-ink mb-1">Security & Privacy</h3>
            <p className="text-muted text-sm mb-3">Questions about OAuth tokens, data protection, and encryption?</p>
            <a href="mailto:security@driveunify.com" className="text-brand hover:underline text-sm font-semibold">
              security@driveunify.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
