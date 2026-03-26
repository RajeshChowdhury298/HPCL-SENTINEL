"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, ShieldX } from 'lucide-react';

export default function IgnoreFeedbackModal({ lead, isOpen, onClose, router }: any) {
  const [reason, setReason] = useState("");
  const [sourceUnreliable, setSourceUnreliable] = useState(false);
  const [notes, setNotes] = useState("");

  const submitFeedback = async () => {
    if (!reason) return alert("Please select a reason for ignoring.");

    // 1. Logic: Negative Reinforcement Recalibration
    const newPriorityScore = Math.max(0, (lead.priority_score || 0) * 0.8);

    // 2. SAFE-MODE CONSOLIDATION
    // Bundling all info into 'rejection_reason' to avoid missing column errors
    const consolidatedRejection = `
      REASON: ${reason} | 
      SOURCE_UNRELIABLE: ${sourceUnreliable ? 'YES' : 'NO'} | 
      CONTEXT: ${notes || 'None'}
    `.trim();

    const { error } = await supabase.from('leads').update({
      status: 'Rejected',
      priority_score: newPriorityScore, // Updates AI weights
      rejection_reason: consolidatedRejection // Use existing column as catch-all
    }).eq('id', lead.id);

    if (!error) {
      alert("Feedback has been submitted.");
      onClose();
      router.push('/dashboard');
    } else {
      console.error("Submission error:", error.message);
      alert("Database Sync Error: " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-red-50/50">
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase leading-none">Refine Lead Queue</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">Training AI to avoid false positives</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 shadow-sm transition-colors hover:bg-red-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Reason Selection */}
          <section>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Reason for ignoring?</label>
            <select 
              onChange={(e) => setReason(e.target.value)} 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
            >
              <option value="">Select Primary Reason...</option>
              <option value="Invalid Signal">False Positive: Company not expanding</option>
              <option value="Incorrect Location">Out of Territory: Site is too far</option>
              <option value="Duplicate">Redundant: Already called/engaged</option>
              <option value="Bad Product Fit">Mismatch: They don't need this product</option>
            </select>
          </section>

          {/* Source Governance */}
          <section className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100">
            <input 
              type="checkbox" 
              id="source_unreliable"
              className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
              onChange={(e) => setSourceUnreliable(e.target.checked)}
            />
            <label htmlFor="source_unreliable" className="text-[11px] font-black text-red-700 uppercase leading-tight cursor-pointer">
              This signal source website is unreliable
            </label>
          </section>

          {/* Additional Notes */}
          <section>
            <textarea 
              rows={3}
              placeholder="Any specific field notes? (e.g., Tender was cancelled)"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-blue-600 transition-all text-slate-700"
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        {/* Footer Button */}
        <div className="p-8 bg-slate-50 border-t">
          <button 
            onClick={submitFeedback} 
            className="w-full py-5 rounded-2xl font-black uppercase text-xs shadow-xl bg-red-600 text-white shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Confirm & Remove Lead
          </button>
        </div>
      </div>
    </div>
  );
}