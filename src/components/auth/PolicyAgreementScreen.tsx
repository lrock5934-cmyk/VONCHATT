import React, { useState } from 'react';
import { Flame, Shield, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface PolicyAgreementScreenProps {
  onAgree: () => void;
}

export const PolicyAgreementScreen: React.FC<PolicyAgreementScreenProps> = ({ onAgree }) => {
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState<'terms' | 'privacy' | 'guidelines' | null>(null);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white p-4 relative overflow-hidden font-sans">
      {/* Ambient Red Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg liquid-glass rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E50914] to-[#FF303B] flex items-center justify-center text-white shadow-xl shadow-[#E50914]/30 mb-4">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to vonChat</h1>
          <p className="text-sm text-[#A1A1AA] mt-1 max-w-md">
            Before you can register, sign in, or access your secure conversations, please review and accept our policies.
          </p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 space-y-3 text-xs text-[#A1A1AA] leading-relaxed">
          <div className="font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E50914]" />
            <span>Data and Account Security</span>
          </div>
          <p>
            vonChat uses end-to-end encryption principles, Supabase PostgreSQL with strict Row-Level Security, and Firebase Authentication to ensure your conversations remain private and secure.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-[#FF303B] font-medium">
            <button onClick={() => setShowModal('terms')} className="hover:underline cursor-pointer">Terms of Service</button>
            <span>•</span>
            <button onClick={() => setShowModal('privacy')} className="hover:underline cursor-pointer">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setShowModal('guidelines')} className="hover:underline cursor-pointer">Community Guidelines</button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-[#E50914] rounded cursor-pointer shrink-0"
            />
            <span className="text-xs text-white leading-relaxed group-hover:text-white/90">
              I have read and agree to the vonChat <strong className="text-white">Terms of Service</strong>, <strong className="text-white">Privacy Policy</strong> and <strong className="text-white">Community Guidelines</strong>.
            </span>
          </label>

          <button
            onClick={onAgree}
            disabled={!agreed}
            className="w-full bg-[#E50914] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#FF303B] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E50914]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>I AGREE AND CONTINUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Policy Modal Viewer */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111115] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold capitalize text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E50914]" />
                {showModal.replace('_', ' ')}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-[#A1A1AA] hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="text-xs text-[#A1A1AA] space-y-3 leading-relaxed">
              {showModal === 'terms' && (
                <>
                  <p>1. <strong>Acceptance of Terms</strong>: By accessing vonChat, you agree to abide by these Terms of Service and all applicable laws.</p>
                  <p>2. <strong>User Accounts</strong>: You are responsible for safeguarding your Firebase authentication credentials and maintaining account security.</p>
                  <p>3. <strong>Acceptable Use</strong>: You agree not to use vonChat for unlawful activities, harassment, spam, or distribution of malicious software.</p>
                </>
              )}
              {showModal === 'privacy' && (
                <>
                  <p>1. <strong>Information Collected</strong>: We store your profile metadata, encrypted message payloads, attachments, and status updates securely in Supabase PostgreSQL.</p>
                  <p>2. <strong>Data Usage</strong>: Your data is used exclusively to provide real-time messaging, presence, and status features.</p>
                  <p>3. <strong>Third-Party Services</strong>: Authentication is processed securely via Firebase Auth. We never sell your personal information.</p>
                </>
              )}
              {showModal === 'guidelines' && (
                <>
                  <p>1. <strong>Respect & Safety</strong>: Treat fellow participants with respect. Hate speech and abusive behavior will result in account termination.</p>
                  <p>2. <strong>Content Ownership</strong>: You retain rights to your uploaded images, voice notes, and media attachments.</p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="w-full bg-[#E50914] text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-[#FF303B] cursor-pointer"
            >
              Close & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
