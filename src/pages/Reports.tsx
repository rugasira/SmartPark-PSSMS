import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ParkingRecord, Car } from '../types';
import { BarChart3, Calendar, FileDown, Printer, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';

export default function Reports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const selectedDate = new Date(reportDate);
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);

      const q = query(
        collection(db, 'parkingRecords'),
        where('status', '==', 'Paid'),
        where('exitTime', '>=', start),
        where('exitTime', '<=', end)
      );

      const snapshot = await getDocs(q);
      setDailyRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingRecord)));
      setLoading(false);
    };

    fetchReport();
  }, [reportDate]);

  const totalRevenue = dailyRecords.reduce((sum, r) => sum + (r.totalFee || 0), 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Reports</h1>
          <p className="text-slate-500">Financial summaries and daily parking logs.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="text-sm font-medium focus:outline-none bg-transparent"
              />
           </div>
           <button 
             onClick={() => window.print()}
             className="btn btn-outline border-none text-slate-600 hover:text-emerald-600 flex items-center gap-2"
           >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Report</span>
           </button>
        </div>
      </header>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
         <div className="card p-6 bg-slate-900 text-white">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Daily Earnings</p>
            <p className="text-4xl font-display font-bold mt-2">{totalRevenue} RWF</p>
         </div>
         <div className="card p-6">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Vehicles Processed</p>
            <p className="text-4xl font-display font-bold text-slate-900 mt-2">{dailyRecords.length}</p>
         </div>
         <div className="card p-6">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Avg. Stay Duration</p>
            <p className="text-4xl font-display font-bold text-slate-900 mt-2">
               {dailyRecords.length > 0 
                 ? Math.round(dailyRecords.reduce((s, r) => s + (r.duration || 0), 0) / dailyRecords.length) 
                 : 0}
               <span className="text-xl ml-1 text-slate-400">min</span>
            </p>
         </div>
      </div>

      {/* Main Report Table */}
      <div className="card overflow-hidden print:border-none print:shadow-none">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
           <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Daily Parking Payment Report</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Generated for: {format(new Date(reportDate), 'MMMM dd, yyyy')}</p>
           </div>
           <BarChart3 className="w-8 h-8 text-emerald-500/20" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-6 py-4">Plate Number</th>
                <th className="px-6 py-4">Entry</th>
                <th className="px-6 py-4">Exit</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4">
                     <span className="font-bold text-slate-900 block">{record.plateNumber}</span>
                     <span className="text-[10px] text-slate-400 font-medium tracking-wider">SLOT: {record.slotNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {record.entryTime ? format(record.entryTime.toDate(), 'HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {record.exitTime ? format(record.exitTime.toDate(), 'HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                    {record.duration} mins
                  </td>
                  <td className="px-6 py-4 text-right font-display font-bold text-slate-900">
                    {record.totalFee} RWF
                  </td>
                </tr>
              ))}
              {dailyRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No transactions recorded for this date.
                  </td>
                </tr>
              )}
            </tbody>
            {dailyRecords.length > 0 && (
              <tfoot className="bg-slate-50 font-display">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-bold text-slate-500">Total Revenue:</td>
                  <td className="px-6 py-4 text-right text-xl font-bold text-emerald-600 border-t-2 border-slate-200">
                    {totalRevenue} RWF
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="hidden print:block fixed bottom-8 left-8 right-8 text-center border-t pt-4 text-[10px] text-slate-400 uppercase tracking-widest">
         SmartPark PSSMS • Official Daily Report • Rubavu District
      </div>
    </div>
  );
}
