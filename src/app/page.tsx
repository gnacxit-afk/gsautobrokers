"use client";

import { useMemo } from 'react';
import { getLeads, getStaff } from "@/lib/mock-data";
import { useDateRange } from '@/hooks/use-date-range';
import { useAuth } from '@/lib/auth';
import { Users, BarChart3 } from "lucide-react";
import type { Lead } from '@/lib/types';

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => {
  const colors: { [key: string]: string } = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color] || colors.blue} shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};


export default function DashboardPage() {
  const { dateRange } = useDateRange();
  const { user } = useAuth();
  const allLeads = getLeads();
  const allStaff = getStaff();

  const stats = useMemo(() => {
    if (!user) return { totalLeads: 0, closedSales: 0, conversion: 0, totalRevenue: 0, totalCommissions: 0, totalMargin: 0, channels: {}, sellerStats: {} };

    const visibleLeads = allLeads.filter(lead => {
      if (user.role === 'Admin') return true;
      if (user.role === 'Broker') return lead.ownerId === user.id;
      if (user.role === 'Supervisor') {
        const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
        return lead.ownerId === user.id || teamIds.includes(lead.ownerId);
      }
      return false;
    });

    const filteredLeads = visibleLeads.filter(l => {
      const leadDate = new Date(l.createdAt);
      return leadDate >= dateRange.start && leadDate <= dateRange.end;
    });

    const totalLeads = filteredLeads.length;
    const closedSales = filteredLeads.filter(l => l.status === 'Closed' || l.status === 'Sale').length;
    const conversion = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;
    const totalRevenue = closedSales * 30000;
    const totalCommissions = closedSales * 500;
    const totalMargin = closedSales * 2500;

    const channels: { [key: string]: { leads: number; sales: number } } = {};
    filteredLeads.forEach(l => {
      if (!channels[l.channel]) channels[l.channel] = { leads: 0, sales: 0 };
      channels[l.channel].leads++;
      if (l.status === 'Closed' || l.status === 'Sale') channels[l.channel].sales++;
    });

    const sellerStats: { [key: string]: { leads: number; sales: number; id: string } } = {};
    filteredLeads.forEach(l => {
      if (!sellerStats[l.ownerName]) sellerStats[l.ownerName] = { leads: 0, sales: 0, id: l.ownerId };
      sellerStats[l.ownerName].leads++;
      if (l.status === 'Closed' || l.status === 'Sale') sellerStats[l.ownerName].sales++;
    });

    return {
      totalLeads, closedSales, conversion, totalRevenue, totalCommissions, totalMargin,
      channels, sellerStats
    };
  }, [allLeads, allStaff, dateRange, user]);

  const topSellers = Object.entries(stats.sellerStats).sort(([, a], [, b]) => b.sales - a.sales);
  const topChannel = Object.entries(stats.channels).sort(([, a], [, b]) => (b.sales / (b.leads || 1)) - (a.sales / (a.leads || 1)))[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Leads" value={stats.totalLeads} color="blue" />
        <StatCard label="Closed Sales" value={stats.closedSales} color="green" />
        <StatCard label="Conversion" value={`${stats.conversion.toFixed(1)}%`} color="indigo" />
        <StatCard label="Commissions" value={`$${stats.totalCommissions.toLocaleString()}`} color="amber" />
        {user?.role === 'Admin' && (
            <StatCard label="Gross Margin" value={`$${stats.totalMargin.toLocaleString()}`} color="emerald" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" /> Seller Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium text-center">Leads</th>
                  <th className="pb-3 font-medium text-center">Sales</th>
                  <th className="pb-3 font-medium text-center">Conv.</th>
                  <th className="pb-3 font-medium text-right">To Pay</th>
                  {user?.role === 'Admin' && (
                    <th className="pb-3 font-medium text-right">Margin</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {topSellers.map(([name, data]) => (
                  <tr key={name}>
                    <td className="py-3 font-medium text-slate-700">{name}</td>
                    <td className="py-3 text-center">{data.leads}</td>
                    <td className="py-3 text-center">{data.sales}</td>
                    <td className="py-3 text-center font-bold text-blue-600">
                      {data.leads > 0 ? ((data.sales / data.leads) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 text-right text-amber-600 font-medium">${(data.sales * 500).toLocaleString()}</td>
                    {user?.role === 'Admin' && (
                      <td className="py-3 text-right text-emerald-600 font-medium">${(data.sales * 2500).toLocaleString()}</td>
                    )}
                  </tr>
                ))}
                 {topSellers.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'Admin' ? 6 : 5} className="text-center py-8 text-gray-500">No seller data for this period.</td>
                  </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" /> Channel Conversion
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.channels).map(([channel, data]) => (
              <div key={channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-600 capitalize">{channel}</span>
                  <span className="text-slate-400">{data.sales} sales / {data.leads} leads</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${(data.sales / (data.leads || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
             {Object.keys(stats.channels).length === 0 && (
                <div className="text-center py-8 text-gray-500">No channel data for this period.</div>
             )}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Executive Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Most Profitable Channel</p>
                <p className="font-bold text-slate-800 capitalize">{topChannel ? topChannel[0] : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estimated Revenue</p>
                <p className="font-bold text-slate-800">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Top Seller</p>
                <p className="font-bold text-emerald-600">{topSellers[0] ? topSellers[0][0] : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Lagging Seller</p>
                <p className="font-bold text-red-400">{topSellers.length > 1 ? topSellers[topSellers.length - 1][0] : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
