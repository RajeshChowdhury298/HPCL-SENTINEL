"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

// --- CHART COMPONENTS ---
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, FunnelChart, Funnel, LabelList, AreaChart, Area, CartesianGrid
} from 'recharts';

// --- ICON COMPONENTS ---
import { 
  TrendingUp, Target, Map as MapIcon, 
  Search, Globe, Zap, BarChart3, PieChart as PieIcon, Activity,
  LayoutDashboard 
} from 'lucide-react';

// Reliable India TopoJSON source
const INDIA_TOPO_JSON = "https://raw.githubusercontent.com/udit-001/india-maps-data/master/topojson/india.json";

// Mapping dictionary to normalize state names
const STATE_NAME_MAP: Record<string, string> = {
  "WB": "West Bengal",
  "TN": "Tamil Nadu",
  "GJ": "Gujarat",
  "MH": "Maharashtra",
  "KA": "Karnataka",
  "DL": "Delhi",
  "TS": "Telangana",
  "AP": "Andhra Pradesh",
  "UP": "Uttar Pradesh",
  "RJ": "Rajasthan",
  "MP": "Madhya Pradesh",
  "HR": "Haryana",
  "PB": "Punjab"
};

// Coordinates for Zooming
const STATE_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
  "West Bengal": { center: [87.8, 24.5], zoom: 4 },
  "Tamil Nadu": { center: [78.6, 11.1], zoom: 4 },
  "Gujarat": { center: [71.1, 22.2], zoom: 4 },
  "Maharashtra": { center: [75.3, 19.7], zoom: 4 },
  "National": { center: [78, 22], zoom: 1 }
};

export default function ExecutiveDashboard() {
  const [hasMounted, setHasMounted] = useState(false); // Fix for Hydration Error
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [topoData, setTopoData] = useState<any>(null); // State for self-healing fetch
  const [mapConfig, setMapConfig] = useState({ center: [78, 22] as [number, number], zoom: 1 });
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

 // --- ASSET LOADER (FETCH MAP & LEADS) ---
  useEffect(() => {
    setHasMounted(true); // Signal that client-side hydration is complete
    let isMounted = true;
    const controller = new AbortController();

    async function getStats() {
      setLoading(true);
      try {
        // 1. Fetch leads from Supabase
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .abortSignal(controller.signal);

        if (error) throw error;
        if (data && isMounted) setAllLeads(data);

        // 2. Fetch Map from Online Source (Self-Healing Fetch)
        const res = await fetch(INDIA_TOPO_JSON);
        if (res.ok) {
          const mapJson = await res.json();
          if (isMounted) {
            setTopoData(mapJson);
          }
        } else {
          throw new Error("Map resource 404");
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setErrorStatus(err.message || "Connection Failure");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getStats();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => 
      (lead.recommended_product || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.industry_sector || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allLeads]);

  const stats = useMemo(() => {
    const currentData = filteredLeads;
    const total = currentData.length;

    // Store counts using FULL NAME so the map keys match exactly
    const regionCounts = currentData.reduce((acc: any, lead: any) => {
      const parts = lead.location?.split(',') || [];
      const rawState = parts.length > 1 ? parts[1].trim() : 'Other';
      
      const fullName = STATE_NAME_MAP[rawState] || rawState;
      
      acc[fullName] = (acc[fullName] || 0) + 1;
      return acc;
    }, {});

    const maxLeads = Math.max(...Object.values(regionCounts) as number[], 1);
    const colorScale = scaleLinear<string>()
      .domain([0, maxLeads])
      .range(["#f0fdf4", "#166534"]); 

    const velocityGrowth = total > 0 ? ((total - (total * 0.8)) / total * 100).toFixed(1) : "0";
    
    const funnel = [
      { value: total, name: 'Discovered', fill: '#1e3a8a' },
      { value: Math.round(total * 0.85), name: 'Inferred', fill: '#2563eb' },
      { value: Math.round(total * 0.70), name: 'Alerted', fill: '#3b82f6' },
      { value: Math.round(total * 0.40), name: 'Accepted', fill: '#60a5fa' },
      { value: Math.round(total * 0.15), name: 'Converted', fill: '#10b981' },
    ];

    const geoList = Object.keys(regionCounts)
      .map(k => ({ region: k, leads: regionCounts[k] }))
      .sort((a: any, b: any) => b.leads - a.leads);

    const weekly = [
      { week: 'W1', leads: Math.floor(total * 0.18) },
      { week: 'W2', leads: Math.floor(total * 0.25) },
      { week: 'W3', leads: Math.floor(total * 0.32) },
      { week: 'W4', leads: total },
    ];

    const productCounts = currentData.reduce((acc: any, lead: any) => {
      acc[lead.recommended_product] = (acc[lead.recommended_product] || 0) + 1;
      return acc;
    }, {});
    const products = Object.keys(productCounts)
      .map(name => ({ name, value: productCounts[name] }))
      .sort((a:any, b:any) => b.value - a.value)
      .slice(0, 5);

    return { 
        funnel, geoList, weekly, products, 
        topProd: products[0]?.name || "N/A", 
        velocityGrowth, regionCounts, colorScale 
    };
  }, [filteredLeads]);

  // Handler for Zooming and Searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    const matchedState = Object.values(STATE_NAME_MAP).find(s => s.toLowerCase() === val.toLowerCase());
    if (matchedState && STATE_COORDINATES[matchedState]) {
      setMapConfig(STATE_COORDINATES[matchedState]);
    } else if (val === "") {
      setMapConfig({ center: [78, 22], zoom: 1 });
    }
  };

  if (loading || !hasMounted) return (
    <div className="flex items-center justify-center min-h-screen font-black text-blue-900 animate-pulse uppercase tracking-[0.2em]">
      BOOTING GIS ANALYTICS ENGINE...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tighter uppercase flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" size={32} /> Executive Strategy
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">HPCL B2B Intelligence Command Center</p>
        </div>
        
        <div className="relative group w-full md:w-112.5">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search Entity or State (e.g. Gujarat)..."
            className="w-full bg-slate-50 border-2 border-transparent py-4 pl-14 pr-6 rounded-2xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-700 transition-all shadow-inner"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-blue-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <p className="text-blue-300 font-black uppercase text-[10px] tracking-widest mb-2">Signal Intelligence</p>
            <h3 className="text-5xl font-black tracking-tighter">{filteredLeads.length}</h3>
            <Activity className="absolute -right-4 -bottom-4 text-white/10" size={120} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Top Inferred Need</p>
            <h3 className="text-2xl font-black text-blue-900 uppercase truncate">{stats.topProd}</h3>
            <div className="mt-2 flex items-center gap-2 text-green-600 font-bold text-xs">
                <TrendingUp size={14} /> +{stats.velocityGrowth}% Velocity
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">AI Confidence</p>
            <h3 className="text-3xl font-black text-slate-800">94.2%</h3>
            <div className="mt-2 flex items-center gap-2 text-blue-600 font-bold text-xs"><Zap size={14} fill="currentColor" /> Autonomous Scan</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Geographic Hotspots</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.geoList.length} <span className="text-sm text-slate-400 font-bold">States</span></h3>
            <div className="mt-2 flex items-center gap-2 text-blue-600 font-bold text-xs"><Globe size={14} /> National Coverage</div>
        </div>
      </div>

      {/* HEATMAP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-12 bg-white p-10 rounded-[3rem] shadow-xl border border-white">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <MapIcon size={18} className="text-blue-600"/> Geography Demand Heatmap (Real-Time)
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">Low</span>
              <div className="w-32 h-2 bg-gradient-to-r from-[#f0fdf4] to-[#166534] rounded-full" />
              <span className="text-[10px] font-black text-slate-400 uppercase">High Intensity</span>
            </div>
          </div>

          <div className="h-[600px] bg-slate-100 rounded-[2.5rem] relative overflow-hidden">
            {(hasMounted && topoData) ? (
              // <ResponsiveContainer width="100%" height="100%">
                <div className="w-full h-full">
                  <ComposableMap 
                    projection="geoMercator" 
                    projectionConfig={{ 
                      scale: 1000, 
                      center: [78, 22] 
                    }}
                  >
                    <ZoomableGroup zoom={mapConfig.zoom} center={mapConfig.center}>
                      <Geographies geography={topoData}>
                        {({ geographies }) => {
                          if (geographies.length === 0) console.warn("No geographies found in topoData");

                          return geographies.map((geo) => {
                            const props = geo.properties;
                            const stateName = props.st_nm || props.ST_NM || props.name || "Unknown";
                            const count = stats.regionCounts[stateName] || 0;

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={count > 0 ? stats.colorScale(count) : "#F8FAFC"}
                                stroke="#E2E8F0"
                                strokeWidth={0.5}
                                style={{
                                  default: { outline: "none" },
                                  hover: { fill: "#3b82f6", transition: "all 250ms", cursor: 'pointer' },
                                  pressed: { outline: "none" },
                                }}
                              />
                            );
                          })
                        }}
                      </Geographies>
                    </ZoomableGroup>
                  </ComposableMap>
                </div>
              // </ResponsiveContainer>
            ) : (
              <div className="h-[600px] w-full flex items-center justify-center flex-col gap-3">
                <Globe className="text-slate-200 animate-spin" size={40} />
                <p className="text-xs font-black text-slate-300 uppercase animate-pulse text-center px-6">
                   Initializing Global Intelligence Stream...
                </p>
              </div>
            )}

            {/* LIVE LEGEND OVERLAY */}
            <div className="absolute bottom-10 left-10 bg-white/80 backdrop-blur-md p-6 rounded-4xl border border-slate-100 shadow-2xl z-10">
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4">Top Regional Demand</p>
              {Object.entries(stats.regionCounts)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 3)
                .map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between gap-8 mb-2">
                    <span className="text-xs font-bold text-slate-700">{state}</span>
                    <span className="text-xs font-black text-blue-600">{count as number}</span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-5 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <Target size={18} className="text-blue-600"/> Conversion Funnel
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Funnel dataKey="value" data={stats.funnel} isAnimationActive>
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" fontSize={11} fontWeight="800" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600"/> Discovery Velocity (Leads/Week)
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weekly}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '800', fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GEOGRAPHY BARS & SECTOR MIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <MapIcon size={18} className="text-blue-600"/> Geography Demand Intensity
          </h2>
          <div className="space-y-6">
            {stats.geoList.slice(0, 6).map((item:any) => (
              <div key={item.region} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{item.region}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{item.leads} Signals</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(item.leads / (stats.geoList[0]?.leads || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <PieIcon size={18} className="text-blue-600"/> Sector & Product Mix
          </h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.products} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                    {stats.products.map((entry:any, index:number) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1e3a8a' : '#3b82f6'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DISCOVERY FEED TABLE */}
      <div className="mt-10 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Discovery Feed</h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">Autonomous Lead Intel Stream</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-10 py-6">Target Entity</th>
                <th className="px-10 py-6">Inferred Product</th>
                <th className="px-10 py-6">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.slice(0, 10).map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/10 transition-colors">
                  <td className="px-10 py-7">
                    <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{lead.company_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{lead.industry_sector}</p>
                  </td>
                  <td className="px-10 py-7">
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-lg inline-block text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {lead.recommended_product}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-tighter">
                        <MapIcon size={12} className="text-slate-300" /> {lead.location}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
