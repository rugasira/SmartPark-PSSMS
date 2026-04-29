import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ParkingSlot, ParkingRecord, Payment } from '../types';
import { 
  Square, 
  CircleCheck, 
  Users, 
  TrendingUp, 
  Car as CarIcon,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfDay } from 'date-fns';

export default function Dashboard() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [activeRecords, setActiveRecords] = useState<ParkingRecord[]>([]);
  const [dailyPayments, setDailyPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Real-time slots
    const unsubSlots = onSnapshot(collection(db, 'parkingSlots'), (snapshot) => {
      setSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingSlot)));
    });

    // Real-time active records (cars currently parked)
    const qActive = query(collection(db, 'parkingRecords'), where('status', '==', 'Active'));
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      setActiveRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingRecord)));
    });

    // Daily payments
    const today = startOfDay(new Date());
    const qPayments = query(collection(db, 'payments'), where('paymentDate', '>=', today));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setDailyPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });

    return () => {
      unsubSlots();
      unsubActive();
      unsubPayments();
    };
  }, []);

  const stats = [
    { 
      label: 'Total Slots', 
      value: slots.length, 
      icon: Square, 
      color: 'bg-blue-500',
      description: 'Total capacity'
    },
    { 
      label: 'Available', 
      value: slots.filter(s => s.status === 'Available').length, 
      icon: CircleCheck, 
      color: 'bg-emerald-500',
      description: 'Ready for entry'
    },
    { 
      label: 'Currently Parked', 
      value: activeRecords.length, 
      icon: CarIcon, 
      color: 'bg-amber-500',
      description: 'Active records'
    },
    { 
      label: 'Revenue Today', 
      value: `${dailyPayments.reduce((acc, cr) => acc + cr.amountPaid, 0)} RWF`, 
      icon: TrendingUp, 
      color: 'bg-indigo-500',
      description: 'Daily collection'
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome to SmartPark PSSMS. Here's a snapshot of today's activity.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 flex items-start gap-4"
          >
            <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Vehicles List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-900">Recent Activity</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Live Feed</span>
          </div>
          
          <div className="card divide-y divide-slate-100">
            {activeRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No vehicles currently parked.
              </div>
            ) : (
              activeRecords.map(record => (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <CarIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{record.plateNumber}</p>
                      <p className="text-xs text-slate-500">Slot: {record.slotNumber} • Entry at {format(record.entryTime.toDate(), 'HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-sm font-medium text-slate-900">Active</p>
                       <p className="text-[10px] text-slate-400 uppercase">Status</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Small Reports/Summary Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-slate-900">Occupancy Rate</h2>
          <div className="card p-6 flex flex-col items-center justify-center text-center space-y-4">
             <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={440}
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ 
                      strokeDashoffset: 440 - (440 * (slots.length > 0 ? (slots.filter(s => s.status === 'Occupied').length / slots.length) : 0))
                    }}
                    strokeLinecap="round"
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display font-bold">
                    {slots.length > 0 ? Math.round((slots.filter(s => s.status === 'Occupied').length / slots.length) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Full</span>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-xs text-slate-500">Real-time capacity tracking based on {slots.length} available slots across the facility.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
