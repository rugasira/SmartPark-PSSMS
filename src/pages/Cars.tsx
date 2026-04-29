import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Car as CarType } from '../types';
import { Car as CarIcon, Plus, Search, User, Phone, Hash } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cars() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cars'), (snapshot) => {
      setCars(snapshot.docs.map(doc => ({ ...doc.data() } as CarType)));
    });
    return unsub;
  }, []);

  const handleRegisterCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !driverName || !phoneNumber) return;

    if (cars.some(c => c.plateNumber === plateNumber)) {
      alert('Car with this plate number is already registered!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'cars'), {
        plateNumber,
        driverName,
        phoneNumber,
        createdAt: serverTimestamp()
      });
      setPlateNumber('');
      setDriverName('');
      setPhoneNumber('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter(c => 
    c.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display text-slate-900">Vehicle Registry</h1>
        <p className="text-slate-500">Register and manage customer vehicle information.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1">
          <div className="card p-6 border-blue-100 bg-blue-50/30 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <CarIcon className="w-5 h-5" />
               </div>
               <h2 className="text-xl font-display font-bold text-slate-900 font-bold">Register Car</h2>
            </div>
            <form onSubmit={handleRegisterCar} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Plate Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="input-field pl-10 bg-white"
                    placeholder="ABC 123 D"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Driver Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="input-field pl-10 bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field pl-10 bg-white"
                    placeholder="+250 7..."
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div> : 'Add to Registry'}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by plate or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 bg-white"
            />
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Info</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Driver</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCars.map((car, idx) => (
                  <motion.tr 
                    key={car.plateNumber}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <CarIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="font-bold text-slate-900">{car.plateNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{car.driverName}</td>
                    <td className="px-6 py-4 text-slate-500">{car.phoneNumber}</td>
                  </motion.tr>
                ))}
                {filteredCars.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                      No matching vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
