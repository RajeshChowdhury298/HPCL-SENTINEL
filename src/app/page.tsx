"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Truck, MapPin, CheckCircle, XCircle, ShieldCheck, 
  AlertCircle, Phone, Mail, Globe, Zap, X, UserCheck
} from 'lucide-react';

// --- MOCK DATA: SALES OFFICER REGISTRY (Requirement 4) ---
const HPCL_OFFICERS: Record<string, { name: string, hub: string }> = {
  "Nagpur": { name: "Rohan Sharma", hub: "Maharashtra West" },
  "Kolkata": { name: "Amit Das", hub: "Bengal Regional" },
  "Visakhapatnam": { name: "Suresh Reddy", hub: "Andhra Coastal" },
  "Ahmedabad": { name: "Priya Patel", hub: "Gujarat Central" },
  "Jamshedpur": { name: "Vikram Singh", hub: "Jharkhand Industrial" },
  "Chennai": { name: "Meera Krishnan", hub: "Tamil Nadu North" }
};

function getAssignedOfficer(location: string) {
  const city = location.split(',')[0].trim();
  return HPCL_OFFICERS[city] || { name: "Regional Sales Manager", hub: "Zonal Office" };
}

// --- SUB-COMPONENT: DEEP INTELLIGENCE LEAD DOSSIER ---
function LeadDossier({ lead, onClose, onUpdateStatus }: { lead: any, onClose: () => void, onUpdateStatus: (e: any, id: string, status: string) => void }) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  if (!lead) return null;

  const urgencyLabel = lead.urgency_score > 7 ? "IMMEDIATE ACTION" : "ACTIVE PLANNING";
  const cinPlaceholder = `L${Math.floor(10000 + Math.random() * 90000)}WB2026PLC${Math.floor(100000 + Math.random() * 900000)}`;
  const officer = getAssignedOfficer(lead.location);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-200">
        
        {/* HEADER: Strategic Summary (Requirement 3.2) */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 z-20">
          <div className="flex justify-between items-start mb-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                Priority Score: {lead.priority_score?.toFixed(1)}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${lead.urgency_score > 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {urgencyLabel}
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{lead.normalized_company}</h2>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
             <Globe size={14} className="text-blue-500" />
             <span className="text-sm italic text-slate-500">Legal Name: {lead.company_name}</span>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* SECTION: AI METRICS */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">AI Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Combined Priority</p>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-600 fill-blue-600" />
                  <span className="text-xl font-black text-slate-800">{lead.priority_score?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-600" />
                  <span className="text-xl font-black text-slate-800">{(lead.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: ENTITY PROFILE (Requirement 2.0) */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b pb-2">Entity Intelligence</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 text-left">Corporate ID (CIN)</p>
                <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 uppercase tracking-tighter">{cinPlaceholder}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 text-left">Industry Sector</p>
                <p className="text-sm font-bold text-slate-800 text-left">{lead.industry_sector}</p>
              </div>
              {/* Requirement 4: Automated Routing Information */}
              <div className="col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white"><UserCheck size={18}/></div>
                    <div className="text-left">
                        <p className="text-[9px] text-blue-600 font-black uppercase mb-0.5">Assigned Sales Officer</p>
                        <p className="text-sm font-black text-slate-800">{officer.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Region Hub</p>
                    <p className="text-xs font-bold text-slate-600">{officer.hub}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1 text-left">
                   <MapPin size={10} /> Target Project Location
                </p>
                <p className="text-sm font-medium text-slate-800 text-left">{lead.location}</p>
              </div>
            </div>
          </section>

          {/* SECTION: STRATEGIC INTELLIGENCE (Requirement 3.2) */}
          <section className="bg-blue-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
             <div className="relative z-10 text-left">
                <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-6">Strategic Intelligence</h3>
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-16 w-16 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-400/20">
                        <Truck size={32} />
                    </div>
                    <div>
                        <p className="text-2xl font-black leading-tight mb-1 tracking-tight">{lead.recommended_product}</p>
                        <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">Cross-sell: {lead.secondary_product}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-blue-200 font-bold uppercase mb-1 tracking-widest">Est. Volume</p>
                        <p className="text-lg font-black">500-800 MT</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-blue-200 font-bold uppercase mb-1 text-left tracking-widest">HPCL Proximity</p>
                        <p className="text-lg font-black tracking-tighter">15.2 KM</p>
                    </div>
                </div>
             </div>
             <div className="absolute -right-12 -bottom-12 opacity-10">
                <ShieldCheck size={240} />
             </div>
          </section>

          {/* SECTION: SIGNAL EVIDENCE (Requirement 5.0) */}
          <section className="space-y-4 text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500" /> Intelligence Signal Evidence
            </h3>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-inner italic text-sm text-slate-700 leading-relaxed font-medium">
                "{lead.raw_text_snippet}"
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <Globe size={18} className="text-blue-600" />
                </div>
                <div className="overflow-hidden w-full">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Source Provenance</p>
                    <a 
                      href={lead.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 font-bold underline break-all block hover:text-blue-800 transition-colors"
                    >
                      {lead.source_url}
                    </a>
                </div>
            </div>
          </section>

          {/* SECTION: FEEDBACK LOOP (Requirement 5.0) */}
          <div className="bg-green-50 border border-green-100 p-6 rounded-[2.5rem] mb-12 shadow-sm text-left">
            <h3 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">Sales Strategy Script</h3>
            <p className="text-sm font-bold text-green-900 mb-6 leading-snug italic">
               "{lead.next_action || `Congratulate the team on the ${lead.industry_sector} project. Highlight HPCL logistics edge and terminal proximity to ${lead.location}.`}"
            </p>
            
            {!showRejectReason ? (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-green-100 mb-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs font-mono tracking-tighter">DM</div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Inferred Decision Maker</p>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Procurement Head / Site Manager</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { onUpdateStatus(e, lead.id, 'Accepted'); onClose(); }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
                        >
                            <CheckCircle size={16} /> Accept & Start Call
                        </button>
                        <button 
                            onClick={() => setShowRejectReason(true)}
                            className="bg-white border border-green-200 text-green-700 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                        >
                            Ignore
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <p className="text-[10px] font-black text-red-700 uppercase mb-3 tracking-widest text-center">Help the AI learn: Why reject this?</p>
                    <div className="grid grid-cols-1 gap-2">
                        {['Wrong Product Fit', 'Location Mismatch', 'Low Reliability'].map((reason) => (
                            <button 
                                key={reason}
                                onClick={(e) => { onUpdateStatus(e, lead.id, `Rejected: ${reason}`); onClose(); }}
                                className="w-full py-3 bg-white border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            >
                                {reason}
                            </button>
                        ))}
                        <button onClick={() => setShowRejectReason(false)} className="mt-2 text-[9px] font-bold text-slate-400 uppercase underline text-center">Cancel</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT: LEADS QUEUE ---
export default function LeadsQueue() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

 async function fetchLeads() {
  // Requirement 5: Only show 'New' leads in the primary work queue
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'New') // This is the 'Removal' logic
    .order('priority_score', { ascending: false })
    .limit(50);
  
  if (data) setLeads(data);
  setLoading(false);
}

  async function updateStatus(e: any, id: string, newStatus: string) {
    if (e && e.stopPropagation) e.stopPropagation(); 
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) fetchLeads();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <div className="h-12 w-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-blue-900 uppercase tracking-widest text-[10px]">Processing Pulse Database...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="mb-8 px-2 max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-blue-900 tracking-tight leading-none mb-1">Priority Leads</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Market Intelligence Queue</p>
      </div>

      {/* Leads List (Requirement 5.0) */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {leads.map((lead) => (
          <div 
            key={lead.id} 
            onClick={() => setSelectedLead(lead)}
            className="group cursor-pointer bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
          >
            {/* Trust Banner (Requirement 1.0) */}
            <div className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${lead.is_verified ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {lead.is_verified ? <ShieldCheck size={11} className="fill-green-700/10" /> : <AlertCircle size={11} />}
              {lead.is_verified ? 'Verified Intelligence' : 'Public Web signal'} — {lead.source_trust}% Source Trust
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-left">
                  <h2 className="text-xl font-black text-slate-800 leading-tight group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                    {lead.normalized_company}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{lead.company_name}</p>
                </div>
                {/* Priority Scoring (Requirement 4.0) */}
                <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl text-center min-w-16.25 shadow-lg shadow-blue-200 ml-2">
                  <span className="text-[8px] block font-black uppercase opacity-70 leading-none mb-1 tracking-widest">Priority</span>
                  <span className="text-xl font-black leading-none">{lead.priority_score?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              
              <div className="flex items-center text-slate-500 text-[11px] font-bold mb-5 tracking-tight text-left">
                <MapPin size={13} className="mr-1 text-blue-500 shrink-0" /> {lead.location}
              </div>

              {/* Product Inference (Requirement 3.0) */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100 group-hover:bg-blue-50 transition-colors text-left">
                <div className="flex items-center text-blue-900 font-black text-[10px] mb-2 uppercase tracking-widest">
                  <Truck size={14} className="mr-2 text-blue-600" /> {lead.recommended_product}
                </div>
                <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-2">
                  "{lead.raw_text_snippet}"
                </p>
              </div>

              {/* Action Buttons (Requirement 5.0) */}
              <div className="flex gap-3">
                <button 
                  onClick={(e) => updateStatus(e, lead.id, 'Accepted')}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors active:scale-95 shadow-md shadow-slate-200"
                >
                  <CheckCircle size={14} /> Accept Lead
                </button>
                <button 
                  onClick={(e) => updateStatus(e, lead.id, 'Rejected')}
                  className="px-4 bg-white text-slate-400 py-3 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                >
                  <XCircle size={14} /> Ignore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RENDER SLIDE-OVER DOSSIER (Requirement 3.2, 5.0) */}
      {selectedLead && (
        <LeadDossier 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </main>
  );
}