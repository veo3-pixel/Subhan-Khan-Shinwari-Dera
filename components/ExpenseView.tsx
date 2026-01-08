import React, { useState, useEffect } from 'react';
import { 
  Expense, 
  ExpenseCategory, 
  Staff, 
  AttendanceRecord, 
  AttendanceStatus, 
  SalaryType, 
  User, 
  UserRole 
} from '../types';
import { 
  Wallet, Plus, Calendar, DollarSign, Lock, TrendingDown, Users, 
  CheckSquare, Save, Trash2, UserPlus, FileBarChart, Search, 
  Filter, MoreVertical, CheckCircle2, XCircle, Clock, Edit2, HandCoins, ArrowDownRight,
  X, Phone, Briefcase, ChevronRight
} from 'lucide-react';
import { PersistenceService } from '../services/persistenceService';

interface ExpenseViewProps {
  currentUser: User;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  [ExpenseCategory.MEAT]: 'bg-red-100 text-red-700',
  [ExpenseCategory.VEGETABLES]: 'bg-green-100 text-green-700',
  [ExpenseCategory.GROCERY]: 'bg-amber-100 text-amber-700',
  [ExpenseCategory.UTILITIES]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.RENT]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.SALARY]: 'bg-indigo-100 text-indigo-700',
  [ExpenseCategory.ADVANCE]: 'bg-orange-100 text-orange-700',
  [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-700',
};

const ExpenseView: React.FC<ExpenseViewProps> = ({ currentUser, expenses, onAddExpense, onDeleteExpense }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'STAFF' | 'ATTENDANCE'>('EXPENSES');
  
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.MEAT);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetStaffId, setTargetStaffId] = useState<string>('');
  
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState<Partial<Staff>>({ 
    name: '', role: '', salaryAmount: 0, salaryType: SalaryType.MONTHLY, phone: '', active: true 
  });

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setStaffList(PersistenceService.getStaff());
    setAttendance(PersistenceService.getAttendance());
  }, []);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getStaffAdvanceBalance = (staffId: string) => {
      return expenses
        .filter(e => e.staffId === staffId && e.category === ExpenseCategory.ADVANCE)
        .reduce((sum, e) => sum + e.amount, 0);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    if (category === ExpenseCategory.ADVANCE && !targetStaffId) {
        alert("Please select a staff member for the advance payment.");
        return;
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      category,
      amount: parseFloat(amount),
      description: description || category,
      date: new Date(expenseDate),
      staffId: category === ExpenseCategory.ADVANCE || category === ExpenseCategory.SALARY ? targetStaffId : undefined
    };

    onAddExpense(newExpense);
    setAmount('');
    setDescription('');
    setTargetStaffId('');
  };

  const handleSaveStaff = () => {
      if (!staffForm.name?.trim() || !staffForm.role?.trim()) {
          alert("Please fill in both Name and Role.");
          return;
      }

      const updatedStaff: Staff = {
          id: staffForm.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
          name: staffForm.name!.trim(),
          role: staffForm.role!.trim(),
          phone: staffForm.phone || '',
          salaryAmount: Number(staffForm.salaryAmount) || 0,
          salaryType: staffForm.salaryType || SalaryType.MONTHLY,
          active: staffForm.active ?? true,
          joinDate: staffForm.joinDate || new Date()
      };

      const newList = staffForm.id 
          ? staffList.map(s => s.id === staffForm.id ? updatedStaff : s)
          : [...staffList, updatedStaff];

      setStaffList(newList);
      PersistenceService.saveStaff(newList);
      setIsEditingStaff(false);
      setStaffForm({ name: '', role: '', salaryAmount: 0, salaryType: SalaryType.MONTHLY, phone: '', active: true });
  };

  const handleDeleteStaff = (id: string) => {
      if (confirm("Permanently remove this staff member? Their past expense records will be kept.")) {
          const newList = staffList.filter(s => s.id !== id);
          setStaffList(newList);
          PersistenceService.saveStaff(newList);
      }
  };

  const handleSalaryPayout = (staff: Staff) => {
      const advance = getStaffAdvanceBalance(staff.id);
      let msg = `Generate salary expense for ${staff.name} (Rs. ${staff.salaryAmount})?`;
      if (advance > 0) {
          msg += `\n\nNote: This staff has an outstanding advance of Rs. ${advance}.`;
      }
      
      if (!confirm(msg)) return;
      
      const salaryExpense: Expense = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          category: ExpenseCategory.SALARY,
          amount: staff.salaryAmount,
          description: `Salary Payout: ${staff.name} (${new Date().toLocaleString('default', { month: 'long' })})`,
          date: new Date(),
          staffId: staff.id
      };
      
      onAddExpense(salaryExpense);
      alert("Salary payout recorded in Expenses.");
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col bg-surface overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Finance & Staff Management
            <Wallet className="text-primary" size={24} />
          </h1>
          <span className="font-urdu text-lg text-gray-500">اخراجات اور عملے کا انتظام</span>
        </div>
        
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('EXPENSES')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'EXPENSES' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <TrendingDown size={18} /> Expenses
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('STAFF')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'STAFF' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Users size={18} /> Staff
              </button>
              <button onClick={() => setActiveTab('ATTENDANCE')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ATTENDANCE' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                <CheckSquare size={18} /> Attendance
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'EXPENSES' && (
          <div className="h-full flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-96 space-y-6 shrink-0">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-primary"/> New Entry</h2>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Category / قسم</label>
                    <select 
                      className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 font-bold text-sm outline-none focus:border-primary transition-all" 
                      value={category} 
                      onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    >
                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  {(category === ExpenseCategory.ADVANCE || category === ExpenseCategory.SALARY) && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Staff Member / عملہ</label>
                        <select 
                          className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 font-bold text-sm outline-none focus:border-primary transition-all" 
                          value={targetStaffId} 
                          onChange={e => setTargetStaffId(e.target.value)}
                          required
                        >
                          <option value="">Select Staff...</option>
                          {staffList.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                        </select>
                      </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Amount (Rs.) / رقم</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 font-bold text-lg outline-none focus:border-primary transition-all" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Description / تفصیل</label>
                    <textarea 
                      className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 text-sm h-20 resize-none outline-none focus:border-primary transition-all" 
                      placeholder="Details..."
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-800 transition-all flex items-center justify-center gap-2">
                    <Save size={18} /> Record {category === ExpenseCategory.ADVANCE ? 'Advance' : 'Expense'}
                  </button>
                </form>
              </div>

              <div className="bg-secondary p-6 rounded-3xl text-white shadow-xl">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Monthly Outflow</p>
                <h3 className="text-3xl font-bold mt-1">Rs. {totalExpenseAmount.toLocaleString()}</h3>
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-slate-400">Transactions</span>
                  <span>{expenses.length} Records</span>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Financial History</h3>
                <div className="relative w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-1.5 bg-gray-50 rounded-full text-xs outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[exp.category] || 'bg-gray-100'}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-800 truncate max-w-[200px]">{exp.description}</td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 text-right">Rs. {exp.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => onDeleteExpense(exp.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'STAFF' && (
          <div className="h-full flex flex-col gap-6 animate-fade-in">
             <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
               <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Staff Payroll & Advances</h3>
                  <button 
                    onClick={() => { 
                      setStaffForm({ name: '', role: '', salaryAmount: 0, salaryType: SalaryType.MONTHLY, phone: '', active: true }); 
                      setIsEditingStaff(true); 
                    }} 
                    className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-red-800 transition-all"
                  >
                      <UserPlus size={14}/> Add Staff Member
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {staffList.map(staff => {
                        const advance = getStaffAdvanceBalance(staff.id);
                        return (
                          <div key={staff.id} className="bg-gray-50 rounded-2xl p-5 border border-transparent hover:border-primary/20 transition-all group relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-bold text-xl">
                                    {staff.name.charAt(0)}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-gray-800">{staff.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{staff.role}</p>
                                 </div>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={() => handleSalaryPayout(staff)} title="Pay Salary" className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><HandCoins size={18}/></button>
                                  <button onClick={() => { setStaffForm(staff); setIsEditingStaff(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={18}/></button>
                                  <button onClick={() => handleDeleteStaff(staff.id)} className="p-2 text-red-400 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                              </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">Monthly Salary</span>
                                  <span className="font-bold">Rs. {staff.salaryAmount.toLocaleString()}</span>
                               </div>
                               <div className={`flex justify-between items-center text-xs p-2 rounded-lg ${advance > 0 ? 'bg-orange-50' : 'bg-gray-100'}`}>
                                  <span className={`${advance > 0 ? 'text-orange-600' : 'text-gray-400'} font-bold flex items-center gap-1`}><ArrowDownRight size={12}/> Advance Due</span>
                                  <span className={`font-black ${advance > 0 ? 'text-orange-700' : 'text-gray-500'}`}>Rs. {advance.toLocaleString()}</span>
                               </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${staff.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{staff.active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        );
                    })}
                    {staffList.length === 0 && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-400">
                            <Users size={48} className="opacity-10 mb-2"/>
                            <p className="font-bold">No staff registered.</p>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* STAFF EDITOR MODAL */}
      {isEditingStaff && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Briefcase size={20} className="text-primary"/> Staff Details</h3>
                    <button onClick={() => setIsEditingStaff(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-5 overflow-y-auto max-h-[70vh] no-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Staff Name</label>
                            <input 
                              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" 
                              value={staffForm.name || ''} 
                              onChange={e => setStaffForm({...staffForm, name: e.target.value})} 
                              placeholder="e.g. Hassan" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Designation / Role</label>
                            <input 
                              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" 
                              value={staffForm.role || ''} 
                              onChange={e => setStaffForm({...staffForm, role: e.target.value})} 
                              placeholder="e.g. Waiter" 
                            />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Phone Number</label>
                            <input 
                              className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" 
                              value={staffForm.phone || ''} 
                              onChange={e => setStaffForm({...staffForm, phone: e.target.value})} 
                              placeholder="03xx-xxxxxxx" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Salary Type</label>
                            <select 
                              className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" 
                              value={staffForm.salaryType || SalaryType.MONTHLY} 
                              onChange={e => setStaffForm({...staffForm, salaryType: e.target.value as SalaryType})}
                            >
                                <option value={SalaryType.MONTHLY}>Monthly</option>
                                <option value={SalaryType.DAILY}>Daily Wage</option>
                            </select>
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Salary Amount (Rs.)</label>
                        <input 
                          type="number" 
                          className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold text-xl" 
                          value={staffForm.salaryAmount ?? ''} 
                          onChange={e => setStaffForm({...staffForm, salaryAmount: Number(e.target.value)})} 
                        />
                     </div>
                     <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                         <button 
                           onClick={() => setStaffForm({...staffForm, active: !staffForm.active})} 
                           className={`w-12 h-6 rounded-full relative transition-all ${staffForm.active ? 'bg-primary' : 'bg-gray-300'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${staffForm.active ? 'right-1' : 'left-1'}`} />
                         </button>
                         <span className="text-sm font-bold text-gray-600">Employee is currently Active</span>
                     </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t flex gap-4">
                     <button onClick={() => setIsEditingStaff(false)} className="flex-1 py-4 bg-white border text-gray-600 rounded-2xl font-bold">Cancel</button>
                     <button onClick={handleSaveStaff} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-red-100 flex items-center justify-center gap-2">
                        <Save size={18}/> Save Staff Member
                     </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExpenseView;