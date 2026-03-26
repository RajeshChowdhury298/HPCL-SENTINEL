"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
// IMPORTANT: Importing specialized components to handle Adaptive Logic
import EngagementFeedbackModal from '@/components/EngagementFeedbackModal';
import IgnoreFeedbackModal from '@/components/IgnoreFeedbackModal';
import { 
  Truck, MapPin, CheckCircle, ShieldCheck, Phone, 
  Globe, Zap, AlertCircle, ChevronLeft, UserCheck, Mail, Calendar, Star, X
} from 'lucide-react';
// Generic import removed to prevent component conflict

// 1. HPCL TERMINAL REGISTRY (Requirement: Geographic Proximity)
const HPCL_TERMINALS = [
  { name: "Visakh Terminal", lat: 17.6868, lng: 83.2185 },
  { name: "Mumbai Refinery", lat: 19.0760, lng: 72.8777 },
  { name: "Kolkata Terminal", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad Depot", lat: 23.0225, lng: 72.5714 },
  { name: "Ennore Terminal", lat: 13.2300, lng: 80.3200 }
];

// 2. Haversine Formula for Autonomous Distance Calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

const HPCL_OFFICERS: Record<string, { name: string, hub: string }> = {
  "Nagpur": { name: "Rohan Sharma", hub: "Maharashtra West" },
  "Kolkata": { name: "Amit Das", hub: "Bengal Regional" },
  "Visakhapatnam": { name: "Suresh Reddy", hub: "Andhra Coastal" },
  "Ahmedabad": { name: "Priya Patel", hub: "Gujarat Central" },
  "Jamshedpur": { name: "Vikram Singh", hub: "Jharkhand Industrial" },
  "Chennai": { name: "Meera Krishnan", hub: "Tamil Nadu North" }
};

function getAssignedOfficer(location: string) {
  const city = location?.split(',')?.[0]?.trim() || "Zonal";
  return HPCL_OFFICERS[city] || { name: "Regional Sales Manager", hub: "Zonal Office" };
}

export default function StandaloneDossier() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cin, setCin] = useState("");
  const [proximity, setProximity] = useState("Calculating...");
  const [estVolume, setEstVolume] = useState("");
  const [feedbackMode, setFeedbackMode] = useState<'ignore' | 'finish' | null>(null);
  const [originalScore, setOriginalScore] = useState<number>(0);
  
  const handleIgnoreClick = () => setFeedbackMode('ignore');

  useEffect(() => {
    setIsMounted(true);
    const controller = new AbortController();
    setCin(`L${Math.floor(10000 + Math.random() * 90000)}WB2026PLC${Math.floor(100000 + Math.random() * 900000)}`);

    async function fetchLead() {
      try {
        const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
        // .abortSignal(controller.signal)
        if (data) setLead(data);
        setOriginalScore(data.priority_score || 0); // Store the initial score for comparison
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error("Dossier Fetch Error:", err.message);
      }
    }

    if (id) fetchLead();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (lead) {
      const simulatedLat = 18.5204 + (Math.random() - 0.5); 
      const simulatedLng = 73.8567 + (Math.random() - 0.5);
      let minDistance = 999;
      HPCL_TERMINALS.forEach(terminal => {
        const dist = parseFloat(calculateDistance(simulatedLat, simulatedLng, terminal.lat, terminal.lng));
        if (dist < minDistance) minDistance = dist;
      });
      setProximity(`${minDistance} KM`);
      setEstVolume(`${lead.industry_sector?.includes('Road') ? 800 : 300} MT`);
    }
  }, [lead]);

  async function handleAccept() {
    setIsUpdating(true);
    await supabase.from('leads').update({ status: 'Accepted' }).eq('id', id);
    setIsAccepted(true);
    setIsUpdating(false);
  }

  const triggerCall = () => { window.location.href = `tel:+919220318881`; };
  
  const triggerEmail = () => {
    if (!lead || !lead.normalized_company) return;
    const subject = `HPCL Direct Sales Proposal: ${lead.normalized_company}`;
    const body = `Dear Team,\n\nFollowing up on the project signal in ${lead.location}, we would like to propose a supply chain solution for ${lead.recommended_product}.`;
    window.location.href = `mailto:procurement@${lead.normalized_company.toLowerCase().replace(/\s/g, '')}.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const triggerMeeting = () => {
    if (!lead) return;
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=HPCL+Site+Meeting:+${lead.normalized_company}&details=Discussing+bulk+${lead.recommended_product}+supply+at+${lead.location}`, '_blank');
  };

  if (!isMounted || !lead) return <div className="p-20 text-center font-black text-blue-900 animate-pulse uppercase tracking-widest text-slate-900">Synchronizing Dossier...</div>;

  const officer = getAssignedOfficer(lead.location);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 font-sans">
      
      {/* 1. RENDER ENGAGEMENT MODAL IF MODE IS 'finish' */}
      <EngagementFeedbackModal 
        lead={lead} 
        isOpen={feedbackMode === 'finish'} 
        onClose={() => setFeedbackMode(null)} 
        router={router} 
      />

      {/* 2. RENDER IGNORE MODAL IF MODE IS 'ignore' */}
      <IgnoreFeedbackModal 
        lead={lead} 
        isOpen={feedbackMode === 'ignore'} 
        onClose={() => setFeedbackMode(null)} 
        router={router} 
      />

      <div className="bg-white p-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-blue-900 uppercase tracking-[0.2em]">Autonomous Dossier Terminal</h1>
      </div>

      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
          
          <div className="bg-white border-b border-slate-100 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                Priority Score: {lead.priority_score?.toFixed(1) || "0.0"}
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded border bg-orange-50 text-orange-600 border-orange-100 uppercase tracking-tight">Active Planning</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">{lead.normalized_company}</h2>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
               <Globe size={14} className="text-blue-500" />
               <span className="text-sm italic">Legal Name: {lead.company_name}</span>
            </div>
          </div>

          <div className="p-8 space-y-10">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">AI Score Breakdown</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Live Priority Score</p>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className={`${lead.priority_score > originalScore ? 'text-green-500' : lead.priority_score < originalScore ? 'text-red-500' : 'text-blue-600'} fill-current`} />
                    <span className="text-xl font-black text-slate-800 tracking-tighter">
                      {lead.priority_score?.toFixed(1) || "0.0"}
                    </span>
                    {/* Visual Change Indicator */}
                    {lead.priority_score !== originalScore && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${lead.priority_score > originalScore ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {lead.priority_score > originalScore ? '↑ GAIN' : '↓ LOSS'}
                      </span>
                    )}
                  </div>
                  {/* Progress bar showing score relative to 10.0 */}
                  <div className="absolute bottom-0 left-0 h-1 bg-blue-100 w-full">
                    <div 
                      className={`h-full transition-all duration-1000 ${lead.priority_score > 7 ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${(lead.priority_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Inference Status</p>
                  <div className="flex items-center gap-2 text-green-600">
                    {lead.priority_score >= originalScore ? <ShieldCheck size={16} /> : <AlertCircle size={16} className="text-red-500" />}
                    <span className="text-xs font-black text-slate-800 uppercase">
                      {lead.priority_score > originalScore ? "Reinforced" : lead.priority_score < originalScore ? "Recalibrated" : "Stable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b pb-2">Entity Intelligence</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">CIN</p>
                  <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 uppercase tracking-tighter">{cin}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Industry Sector</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{lead.industry_sector || "Industrial Infrastructure"}</p>
                </div>
                <div className="col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm"><UserCheck size={18}/></div>
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={10} /> Target Project Location</p>
                  <p className="text-sm font-medium text-slate-800">{lead.location}</p>
                </div>
              </div>
            </section>

            <section className="bg-blue-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                  <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-6">Strategic Intelligence</h3>
                  <div className="flex items-center gap-6 mb-4">
                      <div className="h-16 w-16 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-400/20"><Truck size={32} /></div>
                      <div>
                          <p className="text-2xl font-black leading-tight mb-1">{lead.recommended_product}</p>
                          <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">Cross-sell: {lead.secondary_product || "LDO Fuel"}</p>
                      </div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl col-span-2 border border-white/5 mb-6">
                    <p className="text-[10px] text-blue-300 font-black uppercase mb-1">Automatic Portfolio Matched</p>
                    <p className="text-xs italic text-blue-100">
                        {lead.recommended_product === 'Bitumen' 
                          ? "System matched 'Expressway' signal from snippet to HP Bitumen Portfolio." 
                          : `Automated match: ${lead.industry_sector} requirement → ${lead.recommended_product}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-blue-200 font-bold uppercase mb-1 tracking-widest">Est. Volume</p>
                          <p className="text-lg font-black">{estVolume}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-blue-200 font-bold uppercase mb-1 tracking-widest">HPCL Proximity</p>
                          <div className="flex items-baseline gap-1">
                             <p className="text-lg font-black tracking-tighter">{proximity}</p>
                             <p className="text-[8px] text-blue-300 font-bold uppercase">Nearest Depot</p>
                          </div>
                      </div>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-500" /> Signal Evidence
              </h3>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-inner italic text-sm text-slate-700 leading-relaxed font-medium">
                  "{lead.raw_text_snippet || lead.reason}"
              </div>
            </section>

            {/* ACTION AREA */}
            <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem] shadow-sm text-left">
              {!isAccepted ? (
                <div className="space-y-4 text-center">
                    <h3 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">Sales Strategy Script</h3>
                    <p className="text-sm font-bold text-green-900 mb-6 leading-snug italic text-left">
                       "{lead.next_action || `Inquire about ${lead.recommended_product} requirements for current site expansion.`}"
                    </p>
                    <div className="flex gap-3">
                        <button onClick={handleAccept} disabled={isUpdating} className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                            <CheckCircle size={18} /> Accept & Start Call
                        </button>
                        <button onClick={() => setFeedbackMode('ignore')}
                          className="bg-white border border-green-200 text-green-700 px-6 py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-sm"
                        >
                          Ignore
                        </button>
                    </div>
                </div>
              ) : (
                <div className="animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-center gap-2 mb-6 text-slate-900">
                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white"><CheckCircle size={16}/></div>
                    <p className="text-xs font-black text-green-800 uppercase tracking-widest text-center">Lead Accepted: Engagement Suite</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={triggerCall} className="w-full bg-white border-2 border-green-600 text-green-700 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"><Phone size={18} /> Call Customer Now</button>
                    <button onClick={triggerEmail} className="w-full bg-white border-2 border-blue-600 text-blue-700 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"><Mail size={18} /> Draft Proposal Email</button>
                    <button onClick={triggerMeeting} className="w-full bg-white border-2 border-purple-600 text-purple-700 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"><Calendar size={18} /> Schedule Site Meeting</button>
                  </div>
                  
                  <div className="mt-8 flex flex-col gap-4">
                    <button onClick={() => setFeedbackMode('finish')} className="text-[10px] font-black text-blue-900 bg-blue-100 py-4 rounded-xl uppercase tracking-widest w-full hover:bg-blue-200 transition-colors">
                      Finish Engagement & Log Feedback →
                    </button>
                    <button onClick={() => setIsAccepted(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full text-center py-2 hover:text-slate-600 transition-colors">
                      ← Back to Accept/Ignore
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}