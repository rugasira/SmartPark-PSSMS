import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ParkingSlot } from '../types';
import { Square, Plus, Search, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Slots() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'parkingSlots'), (snapshot) => {
      setSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingSlot)));
    });
    return unsub;
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotNumber) return;
    
    // Check if slot exists
    if (slots.some(s => s.slotNumber === newSlotNumber)) {
      alert('Slot number already exists!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'parkingSlots'), {
        slotNumber: newSlotNumber,
        status: 'Available',
        createdAt: serverTimestamp()
      });
      setNewSlotNumber('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = slots
    .filter(s => s.slotNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true }));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Parking Slots</h1>
          <p className="text-slate-500">Manage parking infrastructure and availability.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Registration Form */}
        <div className="xl:col-span-1">
          <div className="card p-6 bg-emerald-50 border-emerald-100 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-emerald-600 p-2 rounded-lg text-white">
                  <Plus className="w-5 h-5" />
               </div>
               <h2 className="text-xl font-display font-bold text-slate-900 font-bold">New Slot</h2>
            </div>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Slot Number / ID</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newSlotNumber}
                    onChange={(e) => setNewSlotNumber(e.target.value)}
                    className="input-field pl-10 border-emerald-200 focus:ring-emerald-500 bg-white"
                    placeholder="e.g. A-101"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div> : 'Register Slot'}
              </button>
            </form>
          </div>
        </div>

        {/* Slots Grid */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search slots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 bg-white border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
               <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-white">
                  {slots.filter(s => s.status === 'Available').length} Available
               </div>
               <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-white">
                  {slots.filter(s => s.status === 'Occupied').length} Occupied
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredSlots.map((slot) => (
              <motion.div
                layout
                key={slot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "card p-4 flex flex-col items-center justify-center text-center gap-2 border-2",
                  slot.status === 'Available' 
                    ? "border-emerald-100 bg-emerald-50/30 text-emerald-700" 
                    : "border-amber-100 bg-amber-50/30 text-amber-700"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-1 shadow-sm",
                  slot.status === 'Available' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  <Square className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold font-display">{slot.slotNumber}</p>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {slot.status}
                </span>
              </motion.div>
            ))}
            
            {filteredSlots.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                 No slots found. Start by adding one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
