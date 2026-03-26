"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EngagementFeedbackModal({ lead, isOpen, onClose, router }: any) {
  const [status, setStatus] = useState("Accepted");
  const [rating, setRating] = useState(0);
  const [productFit, setProductFit] = useState<boolean | null>(null);
  const [actualProduct, setActualProduct] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [notes, setNotes] = useState("");

const submitFeedback = async () => {
    // 1. Logic: Priority Score Recalibration
    let newPriorityScore = lead.priority_score || 0;
    
    if (status === 'Converted') {
      newPriorityScore = 10.0; 
    } else if (status === 'Rejected') {
      newPriorityScore = Math.max(0, newPriorityScore * 0.5); 
    } else {
      newPriorityScore = Math.min(10, newPriorityScore * 1.15); 
    }

    // 2. CONSOLIDATED DATA MAPPING
    // We combine all "Intelligence" into rejection_reason to avoid schema errors
    const consolidatedNotes = `
      Product: ${productFit === false ? actualProduct : 'Correct'} | 
      Competitor: ${competitor || 'None'} | 
      Notes: ${notes || 'No extra notes'} | 
      Reason: ${rejectionReason || 'N/A'}
    `.trim();

    const { error } = await supabase.from('leads').update({
      status: status,
      priority_score: newPriorityScore,
      feedback_rating: rating,
      product_fit_verified: productFit,
      // FIX: Use rejection_reason as a "catch-all" for all feedback data
      rejection_reason: consolidatedNotes 
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
    <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl my-8 overflow-hidden text-slate-900">
        
        {/* Header - ML Signal Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-blue-50/50">
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase leading-none">Signal Feedback Loop</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest leading-tight">
              Recalibrating inference engine for {lead?.normalized_company}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          
          {/* 1. Lead Outcome Outcome */}
          <section>
            <label className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 block underline decoration-blue-200">1. Primary Lead Outcome</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Accepted', 'Rejected', 'Converted'].map((opt) => (
                <button 
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)} 
                  className={`p-3 rounded-2xl border-2 font-bold text-[10px] uppercase transition-all ${status === opt ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-inner' : 'border-slate-100 text-slate-400 hover:border-blue-200'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Lead Quality Rating */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">2. Intelligence Quality (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    onClick={() => setRating(s)} 
                    className={`cursor-pointer transition-all ${rating >= s ? 'fill-orange-400 text-orange-400 scale-110' : 'text-slate-200 hover:text-orange-200'}`} 
                  />
                ))}
              </div>
            </div>

            {/* 3. Product Fit Accuracy */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">3. Correct Product Mapping?</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setProductFit(true)} className={`flex-1 py-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${productFit === true ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-100'}`}>Yes</button>
                <button type="button" onClick={() => setProductFit(false)} className={`flex-1 py-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${productFit === false ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-100'}`}>No</button>
              </div>
            </div>
          </section>

          {/* 4. Wrong Product Mapping (Conditional) */}
          {productFit === false && (
            <section className="bg-red-50 p-6 rounded-3xl animate-in zoom-in-95 duration-300">
              <label className="text-[10px] font-black text-red-600 uppercase mb-3 block">4. Actual Product Needed</label>
              <select 
                onChange={(e) => setActualProduct(e.target.value)}
                className="w-full bg-white border-red-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 focus:ring-red-500"
              >
                <option value="">Select Portfolio Product...</option>
                <option value="HSD">HSD (Diesel for Generators)</option>
                <option value="FO">Furnace Oil (FO)</option>
                <option value="Bitumen">Bitumen (Road Work)</option>
                <option value="JBO">Jute Batching Oil (JBO)</option>
                <option value="Hexane">Hexane (Solvent Extraction)</option>
                <option value="Other">Other</option>
              </select>
            </section>
          )}

          {/* 5. Reason for Rejection */}
          {status === 'Rejected' && (
            <section className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">5. False Positive Reason</label>
              <select 
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-700"
              >
                <option value="">Select Reason...</option>
                <option value="Invalid Signal">Invalid Signal: No expansion occurring</option>
                <option value="Incorrect Location">Location: Outside DSRO radius</option>
                <option value="Plant Closure">Status: Facility closed</option>
                <option value="Already Supplied">Competition: Existing contract</option>
                <option value="No Current Need">Timing: Requirement expired</option>
              </select>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            {/* 6. Unsuccessful Deal Details */}
            <section>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">6. Additional Context</label>
              <textarea 
                rows={3}
                placeholder="e.g. Contracted with IOCL until 2027..."
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>

            {/* 7. Competitor Intelligence */}
            <section>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">7. Competitor at Site</label>
              <input 
                placeholder="e.g. Shell, IOCL, BPCL"
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                onChange={(e) => setCompetitor(e.target.value)}
              />
            </section>
          </div>
        </div>

        {/* Footer with Market Intelligence Label */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
          <button 
            type="button"
            onClick={submitFeedback} 
            className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Submit Market Intelligence & Retrain Model
          </button>
          <div className="flex items-center gap-2 justify-center text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
            <AlertCircle size={10} /> Data will recalibrate Sector Weights and Regional DSRO Priority
          </div>
        </div>
      </div>
    </div>
  );
}