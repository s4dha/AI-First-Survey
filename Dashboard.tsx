
import React from 'react';
import { SURVEY_DATA } from './constants';

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

export default function Dashboard() {
  // --- Simulated Aggregated Data (N = 150) ---
  const kpiData = {
    participation: "142",
    satisfaction: "4.2/5",
    solutionsBuilt: "38",
    hoursSaved: "850+",
  };

  const mindsetData = {
    labels: ["Not Confident", "Slightly", "Moderately", "Confident", "Very Confident"],
    before: [45, 30, 15, 8, 2], // % distribution
    after: [5, 10, 25, 40, 20],  // % distribution
  };

  const speedData = {
    labels: ["No Idea", "Months+", "Weeks", "Days", "Hours"],
    before: [60, 25, 10, 5, 0],
    after: [5, 10, 30, 40, 15],
  };

  const topBarriers = [
    { label: "Time Constraints", value: 65, max: 100 },
    { label: "Data Access", value: 42, max: 100 },
    { label: "Integration Challenges", value: 38, max: 100 },
    { label: "Scaling from PoC", value: 25, max: 100 },
  ];

  const topImpacts = [
    { label: "Complete work faster", value: 78, max: 100 },
    { label: "Less repetitive tasks", value: 72, max: 100 },
    { label: "Higher quality outputs", value: 60, max: 100 },
    { label: "More creative/strategic work", value: 55, max: 100 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">AI-First Transformation Dashboard</h2>
        <p className="text-gray-600 mt-2">
            Simulated Analysis based on <span className="font-semibold">150 Respondents</span> across 8 Divisions.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Participants" value={kpiData.participation} subtext="Response Rate: 82%" change="+12%" changeType="positive" />
        <KPICard title="Avg Program Rating" value={kpiData.satisfaction} subtext="Effectiveness Score (Q12)" change="High" changeType="positive" />
        <KPICard title="Solutions Created" value={kpiData.solutionsBuilt} subtext="Prototypes & Deployed (Q8a)" change="+8 this month" changeType="positive" />
        <KPICard title="Wkly Hours Repurposed" value={kpiData.hoursSaved} subtext="Est. based on slider data (Q10)" changeType="neutral" />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* 1. Mindset Shift (Q3 vs Q4) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">The Confidence Shift</h3>
                    <p className="text-sm text-gray-500">Comparison of ability to build AI solutions (Q3 vs Q4)</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">Proof Point 1</span>
            </div>
            <ComparisonBarChart 
                labels={mindsetData.labels} 
                dataBefore={mindsetData.before} 
                dataAfter={mindsetData.after} 
            />
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium">💡 Insight: 60% of staff now feel "Confident" or "Very Confident" building solutions, up from only 10% prior to the program.</p>
            </div>
        </div>

        {/* 2. Velocity Shift (Q7 vs Q8) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Velocity: Days not Months</h3>
                    <p className="text-sm text-gray-500">Time required to build a solution (Q7 vs Q8)</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">Proof Point 2</span>
            </div>
            <ComparisonBarChart 
                labels={speedData.labels} 
                dataBefore={speedData.before} 
                dataAfter={speedData.after} 
            />
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium">💡 Insight: The capability to build in "Days" or "Hours" has increased by 5X. The "No Idea" cohort has almost vanished.</p>
            </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Impacts */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">How AI Changed Work (Q11)</h3>
            <SimpleBarChart data={topImpacts} color="bg-teal-500" />
        </div>

        {/* Top Barriers */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Blockers for Phase 2 (Q18)</h3>
            <SimpleBarChart data={topBarriers} color="bg-amber-500" />
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
                <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 mr-2 rounded-full"></div> 35% Actively Deployed</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 mr-2 rounded-full"></div> 20% Prototype Ready</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 mr-2 rounded-full"></div> 25% Still Exploring</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-gray-200 mr-2 rounded-full"></div> 20% Not Yet</div>
            </div>
        </div>

      </div>

      {/* Phase 2 Recommendation Box */}
      <div className="mt-8 bg-indigo-900 rounded-xl shadow-xl p-8 text-white">
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
