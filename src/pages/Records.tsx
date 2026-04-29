import React, { useEffect, useState } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ParkingRecord, ParkingSlot, Car } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '../lib/utils';

export default function Records() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Records
    const unsubRecords = onSnapshot(collection(db, 'parkingRecords'), (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingRecord)));
    });

    // Slots
    const unsubSlots = onSnapshot(collection(db, 'parkingSlots'), (snapshot) => {
      setSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingSlot)));
    });

    // Cars
    const unsubCars = onSnapshot(collection(db, 'cars'), (snapshot) => {
      setCars(snapshot.docs.map(doc => ({ ...doc.data() } as Car)));
    });

    return () => {
      unsubRecords();
      unsubSlots();
      unsubCars();
    };
  }, []);

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlate || !selectedSlot) return;

    setLoading(true);
    try {
      // 1. Create record
      await addDoc(collection(db, 'parkingRecords'), {
        plateNumber: selectedPlate,
        slotNumber: selectedSlot,
        entryTime: serverTimestamp(),
        status: 'Active'
      });

      // 2. Update slot status
      const slotRef = slots.find(s => s.slotNumber === selectedSlot);
      if (slotRef) {
        await updateDoc(doc(db, 'parkingSlots', slotRef.id), {
          status: 'Occupied'
        });
      }

      setIsEntryModalOpen(false);
      setSelectedPlate('');
      setSelectedSlot('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (record: ParkingRecord) => {
    if (!record.entryTime) return;

    const exitTime = new Date();
    const entryTime = record.entryTime.toDate();
    const durationMinutes = Math.max(1, differenceInMinutes(exitTime, entryTime));
    const durationHours = Math.ceil(durationMinutes / 60);
    const totalFee = durationHours * 500;

    try {
      // 1. Update record
      await updateDoc(doc(db, 'parkingRecords', record.id), {
        exitTime: Timestamp.fromDate(exitTime),
        duration: durationMinutes,
        totalFee: totalFee,
        status: 'Completed'
      });

      // 2. Free up slot
      const slotRef = slots.find(s => s.slotNumber === record.slotNumber);
      if (slotRef) {
        await updateDoc(doc(db, 'parkingSlots', slotRef.id), {
          status: 'Available'
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteDoc(doc(db, 'parkingRecords', id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Parking Operations</h1>
          <p className="text-slate-500">Record vehicle entries and handle check-outs.</p>
        </div>
        <button 
          onClick={() => setIsEntryModalOpen(true)}
          className="btn btn-primary flex items-center gap-2 py-3 px-6"
        >
          <Plus className="w-5 h-5" />
          Vehicle Entry
        </button>
      </header>

      {/* Records Table */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
           <h2 className="font-display font-medium text-slate-700 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Recent Records
           </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Plate Number</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Slot</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Entry Time</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.sort((a, b) => b.entryTime?.seconds - a.entryTime?.seconds).map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 group">
                  <td className="px-6 py-4 font-bold text-slate-900">{record.plateNumber}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{record.slotNumber}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {record.entryTime ? format(record.entryTime.toDate(), 'MMM d, HH:mm') : 'Pending'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      record.status === 'Active' ? "bg-amber-100 text-amber-700" : 
                      record.status === 'Completed' ? "bg-blue-100 text-blue-700" : 
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {record.status === 'Active' && (
                        <button 
                          onClick={() => handleExit(record)}
                          className="btn btn-secondary py-1 px-3 text-xs bg-indigo-600 hover:bg-indigo-700"
                        >
                          Check Out
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                     No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {isEntryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEntryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card w-full max-w-md p-8 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold">Record Entry</h2>
                <button onClick={() => setIsEntryModalOpen(false)}>
                   <XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleEntry} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Select Vehicle</label>
                  <select 
                    required
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                    className="input-field appearance-none bg-white"
                  >
                    <option value="">Choose a registered car...</option>
                    {cars.map(car => (
                      <option key={car.plateNumber} value={car.plateNumber}>{car.plateNumber} - {car.driverName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Select Slot</label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.filter(s => s.status === 'Available').map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.slotNumber)}
                        className={cn(
                          "py-2 rounded-lg border-2 text-sm font-bold font-display transition-all",
                          selectedSlot === slot.slotNumber 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-emerald-200"
                        )}
                      >
                        {slot.slotNumber}
                      </button>
                    ))}
                  </div>
                  {slots.filter(s => s.status === 'Available').length === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      No available slots.
                    </p>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !selectedSlot || !selectedPlate}
                  className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg shadow-lg"
                >
                  {loading ? 'Processing...' : 'Confirm Entry'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
