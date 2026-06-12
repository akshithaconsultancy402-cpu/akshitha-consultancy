"use client";
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClientRecord } from '../lib/types'; // Using your working relative import path

interface ChartProps {
  records: ClientRecord[];
  currentIncome: number;
  currentPending: number;
}

export default function MoneyVsMonthsChart({ records, currentIncome, currentPending }: ChartProps) {
  
  // Performance Fix: useMemo prevents scanning arrays/generating dates on every render cycle
  const chartData = useMemo(() => {
    const data = [];
    const current = new Date();

    // Generate a 6-month tracking array [5 months ago -> today]
    for (let i = 5; i >= 0; i--) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();
      
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const yearLabel = d.getFullYear().toString().slice(-2);
      
      if (i === 0) {
        // Active month uses live calculated state totals directly
        data.push({
          month: `${monthLabel} '${yearLabel}`,
          "Income Collected": currentIncome,
          "Outstanding Receivables": currentPending,
        });
      } else {
        // Historical months: scan the real records array
        let historicalIncome = 0;
        let historicalPending = 0;

        records.forEach((record) => {
          if (!record.createdAt) return;
          
          const recordDate = new Date(record.createdAt);
          
          // Check if record belongs to this specific loop month and year
          if (recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear) {
            const total = Number(record.totalFee) || 0;
            const paid = Number(record.amountPaid) || 0;
            
            historicalIncome += paid;
            historicalPending += Math.max(0, total - paid);
          }
        });

        data.push({
          month: `${monthLabel} '${yearLabel}`,
          "Income Collected": historicalIncome, 
          "Outstanding Receivables": historicalPending, 
        });
      }
    }
    return data;
  }, [records, currentIncome, currentPending]); // Only updates if these props break reference

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">Money vs Months Analysis</h3>
        <p className="text-sm text-slate-400">6-month rolling performance ledger tracking overview</p>
      </div>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`]}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
            <Area type="monotone" dataKey="Income Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Income Collected" />
            <Area type="monotone" dataKey="Outstanding Receivables" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" name="Outstanding Receivables" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}