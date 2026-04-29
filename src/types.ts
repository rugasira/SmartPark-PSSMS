export type SlotStatus = 'Available' | 'Occupied';
export type RecordStatus = 'Active' | 'Completed' | 'Paid';

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  status: SlotStatus;
}

export interface Car {
  plateNumber: string;
  driverName: string;
  phoneNumber: string;
}

export interface ParkingRecord {
  id: string;
  plateNumber: string;
  slotNumber: string;
  entryTime: any; // Firestore Timestamp
  exitTime?: any; // Firestore Timestamp
  duration?: number; // in minutes
  totalFee?: number;
  status: RecordStatus;
}

export interface Payment {
  id: string;
  recordId: string;
  amountPaid: number;
  paymentDate: any; // Firestore Timestamp
  plateNumber: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'manager';
}
