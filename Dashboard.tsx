
import React, { useState } from 'react';

// --- Simple Chart Components (No external libraries needed) ---

const KPICard = ({ title, value, subtext, change, changeType }: { title: string, value: string, subtext?: string, change?: string, changeType?: 'positive' | 'negative' | 'neutral' }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <span className="text-3xl font-extrabold text-gray-900">{value}</span>
      {change && (
        <span className={`ml-2 text-sm font-medium ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
          {change}
        </span>
      )}
    </div>
    {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
  </div>
);

const SimpleBarChart = ({ data, color = "bg-indigo-600" }: { data: { label: string, value: number, max: number }[], color?: string }) => (
  <div className="space-y-4">
    {data.map((item, idx) => (
      <div key={idx}>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{item.label}</span>
          <span className="text-sm font-medium text-gray-500">{item.value}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
            style={{ width: `${(item.value / item.max) * 100}%` }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);

const ComparisonBarChart = ({ labels, dataBefore, dataAfter }: { labels: string[], dataBefore: number[], dataAfter: number[] }) => (
  <div className="relative h-64 mt-4">
    <div className="flex h-full items-end space-x-4 justify-between px-2">
      {labels.map((label, idx) => (
        <div key={idx} className="flex flex-col items-center w-full h-full group">
           <div className="relative flex space-x-1 w-full justify-center items-end h-full pb-8">
                {/* Before Bar */}
                <div className="w-3 md:w-6 bg-gray-400 rounded-t-sm relative transition-all duration-700 hover:bg-gray-500" style={{ height: `${dataBefore[idx]}%` }}>
                     <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100">{dataBefore[idx]}%</span>
                </div>
                {/* After Bar */}
                <div className="w-3 md:w-6 bg-indigo-600 rounded-t-sm relative transition-all duration-700 hover:bg-indigo-700" style={{ height: `${dataAfter[idx]}%` }}>
                     <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{dataAfter[idx]}%</span>
                </div>
           </div>
           <span className="absolute bottom-0 text-[10px] md:text-xs text-gray-600 text-center w-16 md:w-24 leading-tight">{label}</span>
        </div>
      ))}
    </div>
    {/* Legend */}
    <div className="absolute top-0 right-0 flex space-x-4 text-xs">
        <div className="flex items-center"><div className="w-3 h-3 bg-gray-400 mr-1 rounded-sm"></div> Before AI-First</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 mr-1 rounded-sm"></div> After (Now)</div>
    </div>
  </div>
);

// --- Constants & Data Generators ---

const DIVISIONS = [
  "Comms & Marketing",
  "CIO Office",
  "Digital Governance",
  "Finance",
  "Internal Audit",
  "Legal",
  "Organisational Excellence",
  "Partnerships and Engagement",
  "People & Organisation",
  "Procurement",
  "Strategy Planning & Transformation",
  "Other"
];

// Generate consistent "random" data based on division string to simulate realistic profiles
const getSimulatedData = (division: string) => {
  const isTech = division === "CIO Office" || division === "Digital Governance";
  const isRisk = division === "Legal" || division === "Internal Audit" || division === "Procurement";
  const isOps = division === "People & Organisation" || division === "Finance";
  
  // Base multipliers
  let confBoost = 1;
  let velBoost = 1;
  
  if (isTech) { confBoost = 1.2; velBoost = 1.3; }
  if (isRisk) { confBoost = 0.9; velBoost = 0.8; }
  if (division === "All Divisions") { confBoost = 1; velBoost = 1; }

  // Participation (Randomized)
  const hash = division.length * 7; 
  const participation = division === "All Divisions" ? "150" : Math.floor(12 + (hash % 15)).toString();
  
  // KPI Data
  const kpiData = {
    participation: participation,
    satisfaction: division === "All Divisions" ? "4.2/5" : (3.5 + (hash % 15)/10).toFixed(1) + "/5",
    solutionsBuilt: division === "All Divisions" ? "38" : Math.floor((parseInt(participation) / 3) * velBoost).toString(),
    hoursSaved: division === "All Divisions" ? "850+" : Math.floor(parseInt(participation) * 5.5 * velBoost).toString() + "+",
  };

  // Mindset Data (Shifted by profile)
  const mindsetData = {
    labels: ["Not Confident", "Slightly", "Moderately", "Confident", "Very Confident"],
    before: [45, 30, 15, 8, 2], 
    after: isTech 
        ? [2, 5, 15, 40, 38] 
        : isRisk 
            ? [10, 20, 40, 25, 5] 
            : [5, 10, 25, 40, 20],
  };

  // Speed Data
  const speedData = {
    labels: ["No Idea", "Months+", "Weeks", "Days", "Hours"],
    before: [60, 25, 10, 5, 0],
    after: isTech
        ? [0, 5, 20, 45, 30]
        : isRisk
            ? [10, 25, 40, 20, 5]
            : [5, 10, 30, 40, 15],
  };

  // Barriers
  const topBarriers = [
    { label: "Time Constraints", value: Math.min(90, 65 + (isOps ? 15 : 0)), max: 100 },
    { label: "Data Access", value: Math.min(90, 42 + (isTech ? 20 : 0)), max: 100 },
    { label: "Integration", value: Math.min(90, 38 + (isTech ? 10 : 0)), max: 100 },
    { label: "Governance/Policy", value: Math.min(90, 25 + (isRisk ? 40 : 0)), max: 100 },
  ].sort((a,b) => b.value - a.value).slice(0,4);

  // Impact
  const topImpacts = [
    { label: "Complete work faster", value: Math.min(95, 78 + (isOps ? 10 : 0)), max: 100 },
    { label: "Less repetitive tasks", value: Math.min(95, 72 + (isOps ? 12 : 0)), max: 100 },
    { label: "Higher quality outputs", value: 60, max: 100 },
    { label: "More creative work", value: 55, max: 100 },
  ];

  return { kpiData, mindsetData, speedData, topBarriers, topImpacts };
};

export default function Dashboard() {
  const [selectedDivision, setSelectedDivision] = useState("All Divisions");
  const data = getSimulatedData(selectedDivision);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 animate-fade-in">
      
      {/* Header & Filter */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900">AI-First Transformation Dashboard</h2>
            <p className="text-gray-600 mt-2">
                Analytics for <span className="font-semibold text-indigo-600">{selectedDivision}</span>
            </p>
        </div>
        
        <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by Division</label>
            <select 
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
            >
                <option value="All Divisions">All Divisions (Aggregate)</option>
                <option disabled>----------------</option>
                {DIVISIONS.map(div => (
                    <option key={div} value={div}>{div}</option>
                ))}
            </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Participants" value={data.kpiData.participation} subtext={selectedDivision === "All Divisions" ? "Response Rate: 82%" : "Division Reps"} change={selectedDivision === "All Divisions" ? "+12%" : undefined} changeType="positive" />
        <KPICard title="Avg Program Rating" value={data.kpiData.satisfaction} subtext="Effectiveness Score (Q12)" change="Target: 4.0" changeType="positive" />
        <KPICard title="Solutions Created" value={data.kpiData.solutionsBuilt} subtext="Prototypes & Deployed (Q8a)" changeType="positive" />
        <KPICard title="Wkly Hours Repurposed" value={data.kpiData.hoursSaved} subtext="Est. based on slider data (Q10)" changeType="neutral" />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* 1. Mindset Shift (Q3 vs Q4) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">The Confidence Shift</h3>
                    <p className="text-sm text-gray-500">Comparison of ability to build AI solutions</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">Proof Point 1</span>
            </div>
            <ComparisonBarChart 
                labels={data.mindsetData.labels} 
                dataBefore={data.mindsetData.before} 
                dataAfter={data.mindsetData.after} 
            />
        </div>

        {/* 2. Velocity Shift (Q7 vs Q8) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Velocity: Days not Months</h3>
                    <p className="text-sm text-gray-500">Time required to build a solution</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">Proof Point 2</span>
            </div>
            <ComparisonBarChart 
                labels={data.speedData.labels} 
                dataBefore={data.speedData.before} 
                dataAfter={data.speedData.after} 
            />
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Top Impacts */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">How AI Changed Work (Q11)</h3>
            <SimpleBarChart data={data.topImpacts} color="bg-teal-500" />
        </div>

        {/* Top Barriers */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Blockers (Q18)</h3>
            <SimpleBarChart data={data.topBarriers} color="bg-amber-500" />
        </div>

        {/* Deployment Status Donut (Simulated CSS) */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Solution Maturity (Q8a)</h3>
            
            <div className="flex items-center justify-center my-4">
                {/* Simple CSS Conic Gradient for Donut Chart */}
                <div className="w-40 h-40 rounded-full relative" style={{ background: 'conic-gradient(#4F46E5 0% 35%, #10B981 35% 55%, #F59E0B 55% 80%, #E5E7EB 80% 100%)' }}>
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold text-gray-800">35%</span>
                        <span className="text-xs text-gray-500 uppercase">Deployed</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 mr-2 rounded-full"></div> Active Deployed</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 mr-2 rounded-full"></div> Prototype Ready</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 mr-2 rounded-full"></div> Still Exploring</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-gray-200 mr-2 rounded-full"></div> Not Yet</div>
            </div>
        </div>
      </div>

      {/* Division Performance Matrix */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Division Performance Matrix</h3>
              <p className="text-sm text-gray-500">Comparative view of engagement and maturity across all divisions</p>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-100">
                      <tr>
                          <th className="px-6 py-3 font-bold text-gray-600">Division</th>
                          <th className="px-6 py-3 font-bold text-gray-600">Participants</th>
                          <th className="px-6 py-3 font-bold text-gray-600">Avg Rating</th>
                          <th className="px-6 py-3 font-bold text-gray-600">AI Confidence (High)</th>
                          <th className="px-6 py-3 font-bold text-gray-600">Primary Blocker</th>
                          <th className="px-6 py-3 font-bold text-gray-600">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {DIVISIONS.map((div, idx) => {
                          // Generate row data locally
                          const rowData = getSimulatedData(div);
                          // Extract "Very Confident" + "Confident" % roughly from sim data
                          const highConf = rowData.mindsetData.after[3] + rowData.mindsetData.after[4];
                          const topBlocker = rowData.topBarriers[0].label;
                          
                          return (
                            <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{div}</td>
                                <td className="px-6 py-4 text-gray-500">{rowData.kpiData.participation}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${parseFloat(rowData.kpiData.satisfaction) >= 4 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {rowData.kpiData.satisfaction}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${highConf}%` }}></div>
                                        </div>
                                        {highConf}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{topBlocker}</td>
                                <td className="px-6 py-4">
                                    {parseInt(rowData.kpiData.solutionsBuilt) > 5 ? (
                                        <span className="text-green-600 font-bold text-xs flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Scaling</span>
                                    ) : (
                                        <span className="text-amber-600 font-bold text-xs flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span> Emerging</span>
                                    )}
                                </td>
                            </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Phase 2 Recommendation Box */}
      <div className="bg-indigo-900 rounded-xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Phase 2 Strategic Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-800/50 p-4 rounded-lg border border-indigo-700">
                  <h4 className="font-bold text-yellow-400 mb-2">1. Scale Infrastructure</h4>
                  <p className="text-sm text-indigo-100">Address the 65% of users citing "Time" and "Data Access" as blockers by providing dedicated environments and pre-approved data connectors.</p>
              </div>
              <div className="bg-indigo-800/50 p-4 rounded-lg border border-indigo-700">
                  <h4 className="font-bold text-yellow-400 mb-2">2. From Prototype to Production</h4>
                  <p className="text-sm text-indigo-100">With 20% of solutions in the "Prototype" phase, introduce a "Deployment Clinic" to help teams cross the finish line.</p>
              </div>
              <div className="bg-indigo-800/50 p-4 rounded-lg border border-indigo-700">
                  <h4 className="font-bold text-yellow-400 mb-2">3. Advanced Upskilling</h4>
                  <p className="text-sm text-indigo-100">Shift training focus from "Basics" to "Complex Integration" to support the 40% of users now confident in building solutions.</p>
              </div>
          </div>
      </div>

    </div>
  );
}
