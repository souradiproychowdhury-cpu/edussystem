export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
  student?: string | any;
  teacher?: string | any;
  avatar?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  students?: Student[];
  createdAt?: string;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  department?: Department | string;
  teacher?: Teacher | string;
  credits?: number;
  semester?: number;
  description?: string;
}

export interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  profilePhoto?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  department?: Department | string;
  course?: Course | string;
  semester?: number;
  enrollmentDate?: string;
  guardianName?: string;
  guardianContact?: string;
  academicStatus?: string;
  createdAt?: string;
}

export interface Teacher {
  _id: string;
  teacherId: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: Department | string;
  subjects?: string[];
  qualification?: string;
  joiningDate?: string;
  profilePhoto?: string;
}

export interface AttendanceRecord {
  _id: string;
  student?: Student | string;
  department?: Department | string;
  course?: Course | string;
  semester?: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
  markedBy?: User | string;
}

export interface Examination {
  _id: string;
  name: string;
  subject: string;
  course?: Course | string;
  department?: Department | string;
  semester?: number;
  date: string;
  totalMarks: number;
}

export interface ResultRecord {
  _id: string;
  examination?: Examination | string;
  student?: Student | string;
  subject?: string;
  semester?: number;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export interface FeeRecord {
  _id: string;
  student?: Student | string;
  totalCourseFees: number;
  paidFees: number;
  pendingFees: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partially Paid';
  paymentHistory?: { amount: number; date: string; method: string; note?: string; receiptNo?: string }[];
  dueDate?: string;
}

export interface TimetableEntry {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  department?: Department | string;
  semester?: number;
  course?: Course | string;
  teacher?: Teacher | string;
  subject?: string;
  classroom?: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  audience?: string;
  type?: string;
  createdAt?: string;
  createdBy?: User;
  isRead?: boolean;
}
