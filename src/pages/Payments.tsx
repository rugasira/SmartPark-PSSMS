import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ParkingRecord, Payment } from '../types';
import { 
  CreditCard, 
  Wallet, 
  Printer, 
  History, 
  CheckCircle2, 
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Payments() {
  const [completedRecords, setCompletedRecords] = useState<ParkingRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Completed but unpaid records
    const qUnpaid = query(collection(db, 'parkingRecords'), where('status', '==', 'Completed'));
    const unsubUnpaid = onSnapshot(qUnpaid, (snapshot) => {
      setCompletedRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingRecord)));
    });

    // Payment history
    const unsubHistory = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setPaymentHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });

    return () => {
      unsubUnpaid();
      unsubHistory();
    };
  }, []);

  const handleProcessPayment = async (record: ParkingRecord) => {
    if (!record.totalFee) return;
    
    setLoading(true);
    try {
      // 1. Create Payment record
      await addDoc(collection(db, 'payments'), {
        recordId: record.id,
        amountPaid: record.totalFee,
        paymentDate: serverTimestamp(),
        plateNumber: record.plateNumber
      });

      // 2. Update ParkingRecord status to 'Paid'
      await updateDoc(doc(db, 'parkingRecords', record.id), {
        status: 'Paid'
      });

      setSelectedRecord(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display text-slate-900">Payments</h1>
        <p className="text-slate-500">Collect fees and generate customer receipts.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Payments Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
             <Wallet className="w-5 h-5 text-amber-500" />
             Pending Payments
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {completedRecords.map((record) => (
              <motion.div
                key={record.id}
                layout
                className="card p-5 group hover:border-emerald-200 transition-all cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900">{record.plateNumber}</p>
                      <p className="text-sm text-slate-500">{record.duration} mins • Slot {record.slotNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-slate-900">{record.totalFee} RWF</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-600">Click to Pay</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {completedRecords.length === 0 && (
              <div className="card p-12 text-center text-slate-400 border-dashed">
                 No pending payments. All check-outs are settled.
              </div>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
             <History className="w-5 h-5 text-indigo-500" />
             Recent Transactions
          </h2>
          <div className="card divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
             {paymentHistory.sort((a, b) => b.paymentDate?.seconds - a.paymentDate?.seconds).map(payment => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600">
                         <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="font-bold text-slate-900">{payment.plateNumber}</p>
                         <p className="text-[10px] text-slate-400">{payment.paymentDate ? format(payment.paymentDate.toDate(), 'MMM d, HH:mm') : ''}</p>
                      </div>
                   </div>
                   <p className="font-display font-bold text-slate-700">{payment.amountPaid} RWF</p>
                </div>
             ))}
             {paymentHistory.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                   No transaction history yet.
                </div>
             )}
          </div>
        </section>
      </div>

      {/* Payment Confirmation Modal / Bill */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedRecord(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card w-full max-w-md p-0 relative z-10 shadow-2xl"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-display font-bold">Parking Invoice</h2>
                 </div>
                 <button onClick={() => setSelectedRecord(null)}>
                    <X className="w-5 h-5 hover:text-red-400" />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="text-center space-y-1 mb-8">
                   <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Plate Number</p>
                   <h3 className="text-4xl font-display font-bold text-slate-900">{selectedRecord.plateNumber}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Entry Time</span>
                    <span className="font-medium">{format(selectedRecord.entryTime.toDate(), 'HH:mm')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Exit Time</span>
                    <span className="font-medium">{format(selectedRecord.exitTime.toDate(), 'HH:mm')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium">{selectedRecord.duration} Minutes</span>
                  </div>
                  <div className="flex justify-between pt-4">
                    <span className="text-slate-900 font-bold">Total Amount</span>
                    <span className="text-2xl font-display font-bold text-emerald-600">{selectedRecord.totalFee} RWF</span>
                  </div>
                </div>

                <div className="pt-8 space-y-3">
                  <button 
                    onClick={() => handleProcessPayment(selectedRecord)}
                    disabled={loading}
                    className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg"
                  >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="btn btn-outline w-full flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t text-center">
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest">SmartPark PSSMS • Rubavu, Rwanda</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
