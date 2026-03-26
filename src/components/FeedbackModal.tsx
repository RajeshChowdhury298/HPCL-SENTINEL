"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, X } from 'lucide-react';

export default function FeedbackModal({ lead, isOpen, onClose, mode, router }: any) {
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");
  const [productFit, setProductFit] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");

  const submitFeedback = async () => {
    // 1. Logic: Adaptive Priority Recalibration
    let newPriorityScore = lead.priority_score || 0;

    if (mode === 'ignore') {
      newPriorityScore = Math.max(0, newPriorityScore * 0.8);
    } else if (status === 'Converted') {
      newPriorityScore = 10.0;
    } else if (status === 'Accepted') {
      newPriorityScore = Math.min(10, newPriorityScore * 1.15);
    }

    const finalStatus = mode === 'ignore' ? 'Rejected' : (status || 'Accepted');

    // 2. Database Update
    const { error } = await supabase.from('leads').update({
      status: finalStatus,
      priority_score: newPriorityScore,
      feedback_rating: rating,
      rejection_reason: reason,
      product_fit_verified: productFit
    }).eq('id', lead.id);

    if (!error) {
      // 3. Pop-up and Close as requested
      alert("Success: Feedback has been received and AI model recalibrated.");
      onClose();
      if (router) router.push('/dashboard');
    } else {
      console.error("Feedback Error:", error.message);
      alert("Critical: Could not sync feedback pulse.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase">AI Model Training</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Recalibrating Priority for {lead.normalized_company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="text-slate-400" /></button>
        </div>

        {mode !== 'ignore' && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Final Lead Outcome</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setStatus('Accepted')} 
                className={`py-3 rounded-xl font-bold text-xs uppercase border-2 transition-all ${status === 'Accepted' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
              >Accepted</button>
              <button 
                onClick={() => setStatus('Converted')} 
                className={`py-3 rounded-xl font-bold text-xs uppercase border-2 transition-all ${status === 'Converted' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
              >Converted</button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Signal Accuracy Rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} onClick={() => setRating(s)} className={`cursor-pointer transition-all ${rating >= s ? 'fill-orange-400 text-orange-400 scale-110' : 'text-slate-200'}`} />
            ))}
          </div>
        </div>

        <div className="mb-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Strategic Detail</p>
          <select 
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select Reason...</option>
            <option value="Invalid Signal">Invalid Signal (False Positive)</option>
            <option value="Competitor Active">Supplied by Competitor</option>
            <option value="Wrong Product">Wrong Product Inference</option>
            <option value="Site Verified">Verified: High Potential</option>
          </select>
        </div>

        <button 
          onClick={submitFeedback}
          className={`w-full text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all ${mode === 'ignore' ? 'bg-red-600 shadow-red-200' : 'bg-blue-900 shadow-blue-200'}`}
        >
          {mode === 'ignore' ? 'Confirm & Downgrade Score' : 'Submit & Recalibrate Model'}
        </button>
      </div>
    </div>
  );
}