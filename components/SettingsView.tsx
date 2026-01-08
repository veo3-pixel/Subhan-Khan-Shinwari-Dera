import React, { useState, useEffect, useRef } from 'react';
import { PersistenceService } from '../services/persistenceService';
import { 
  Database, Download, Upload, AlertTriangle, RefreshCw, CheckCircle, Printer, 
  User as UserIcon, Plus, Trash2, Key, Shield, Edit2, Store, Percent, Eye, 
  EyeOff, Info, Cloud, Loader2, Play, FileText, Smartphone, HardDrive, X, Save,
  UtensilsCrossed, Wallet, Briefcase, Phone, Users, ShieldCheck, Github, ExternalLink,
  ChevronRight, Camera
} from 'lucide-react';
import { User, PrinterConfig, UserRole, Permission, SystemSettings, Category, Staff, SalaryType } from '../types';

interface SettingsViewProps {
  currentUser: User;
  settings: SystemSettings;
  printerConfig: PrinterConfig;
  onUpdateSettings: (s: SystemSettings) => void;
  onUpdatePrinterConfig: (c: PrinterConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    currentUser, settings: globalSettings, printerConfig: globalPrinterConfig, onUpdateSettings, onUpdatePrinterConfig 
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SYSTEM' | 'CLOUD' | 'PRINTER' | 'USERS' | 'HR_FINANCE' | 'ABOUT'>('GENERAL');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [localSettings, setLocalSettings] = useState<SystemSettings>(globalSettings);
  const [localPrinterConfig, setLocalPrinterConfig] = useState<PrinterConfig>(globalPrinterConfig);
  const [users, setUsers] = useState<User[]>(PersistenceService.getUsers());
  const [staff, setStaff] = useState<Staff[]>(PersistenceService.getStaff());

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  useEffect(() => {
    setLocalPrinterConfig(globalPrinterConfig);
  }, [globalPrinterConfig]);
  
  // User Editing State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '', pin: '', role: UserRole.CASHIER, permissions: ['ACCESS_POS', 'ACCESS_KITCHEN']
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveGeneral = () => {
      onUpdateSettings(localSettings);
      showMsg('General settings saved successfully.');
  };

  const handleSavePrinter = () => {
      onUpdatePrinterConfig(localPrinterConfig);
      showMsg('Printer configuration updated.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = () => {
      if(!userForm.name?.trim() || !userForm.pin?.trim()) {
          showMsg('Name and PIN are required', 'error');
          return;
      }
      
      const newUser: User = {
          id: userForm.id || Math.random().toString(36).substr(2, 9),
          name: userForm.name!.trim(),
          pin: userForm.pin!.trim(),
          role: userForm.role as UserRole,
          permissions: userForm.permissions as Permission[]
      };

      const updatedUsers = userForm.id 
          ? users.map(u => u.id === userForm.id ? newUser : u)
          : [...users, newUser];

      setUsers(updatedUsers);
      PersistenceService.saveUsers(updatedUsers);
      setIsEditingUser(false);
      setUserForm({ name: '', pin: '', role: UserRole.CASHIER, permissions: ['ACCESS_POS'] });
      showMsg('User account updated.');
  };

  const handleDeleteUser = (id: string) => {
      if (id === currentUser.id) {
          showMsg('You cannot delete your own account!', 'error');
          return;
      }
      if (confirm('Permanently delete this user access?')) {
          const updated = users.filter(u => u.id !== id);
          setUsers(updated);
          PersistenceService.saveUsers(updated);
          showMsg('User removed.');
      }
  };

  const handleBackup = () => {
      const data = PersistenceService.createBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shinwari_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showMsg('Backup downloaded.');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (PersistenceService.restoreBackup(content)) {
              showMsg('Database restored. Please refresh.');
              setTimeout(() => window.location.reload(), 2000);
          } else {
              showMsg('Invalid backup file.', 'error');
          }
      };
      reader.readAsText(file);
  };

  const handleReset = () => {
      if (confirm('CRITICAL: This will delete ALL orders, inventory, and settings. Continue?')) {
          if (confirm('Are you absolutely sure? This cannot be undone.')) {
              PersistenceService.clearDatabase();
              window.location.reload();
          }
      }
  };

  const togglePermission = (perm: Permission) => {
      const current = userForm.permissions || [];
      const updated = current.includes(perm) 
        ? current.filter(p => p !== perm) 
        : [...current, perm];
      setUserForm({ ...userForm, permissions: updated });
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-surface flex flex-col relative no-scrollbar">
        <div className="mb-6 flex justify-between items-center shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Control Center
                    <Shield size={24} className="text-primary" />
                </h1>
                <span className="font-urdu text-lg text-gray-500">سسٹم کا انتظام</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <Smartphone size={16} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Version 1.6.0</span>
            </div>
        </div>

        {statusMsg && (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-xl flex items-center gap-3 shadow-2xl animate-fade-in ${statusMsg.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <span className="font-bold">{statusMsg.text}</span>
            </div>
        )}

        <div className="flex gap-2 mb-8 border-b overflow-x-auto no-scrollbar shrink-0">
           {[
               {id: 'GENERAL', label: 'General', icon: Store},
               {id: 'USERS', label: 'Users & Access', icon: ShieldCheck},
               {id: 'HR_FINANCE', label: 'HR & Finance', icon: Briefcase},
               {id: 'PRINTER', label: 'Printer KOT', icon: Printer},
               {id: 'CLOUD', label: 'Cloud Sync', icon: Cloud},
               {id: 'SYSTEM', label: 'System Tools', icon: Database},
               {id: 'ABOUT', label: 'About', icon: Info}
           ].map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary bg-red-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <tab.icon size={18} />
                 {tab.label}
               </button>
           ))}
        </div>

        <div className="flex-1 animate-fade-in pb-10">
          {activeTab === 'GENERAL' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-700">Identity Details</h2>
                      <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Restaurant Logo / مونوگرام</label>
                            <div className="flex items-center gap-6">
                                <div 
                                  className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-colors group relative"
                                  onClick={() => logoInputRef.current?.click()}
                                >
                                    {localSettings.logo ? (
                                        <img src={localSettings.logo} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <Camera size={32} className="text-gray-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload size={20} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-2">Upload a high-quality logo for receipts and branding.</p>
                                    <button 
                                      onClick={() => logoInputRef.current?.click()}
                                      className="text-xs font-bold text-primary hover:underline flex items-center gap-2"
                                    >
                                      <Upload size={14} /> Update Logo
                                    </button>
                                </div>
                            </div>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block font-sans">Restaurant Name</label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all font-bold" value={localSettings.restaurantName} onChange={e => setLocalSettings({...localSettings, restaurantName: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block font-urdu">ریسٹورنٹ کا نام</label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all font-urdu text-right text-xl" value={localSettings.restaurantUrduName} onChange={e => setLocalSettings({...localSettings, restaurantUrduName: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex items-center gap-2">
                                <Phone size={14}/> Contact Phone / فون نمبر
                            </label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all font-bold" value={localSettings.phone} onChange={e => setLocalSettings({...localSettings, phone: e.target.value})} placeholder="0300-4097479" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block font-sans">GST (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none" value={localSettings.taxRate} onChange={e => setLocalSettings({...localSettings, taxRate: Number(e.target.value)})} /></div>
                              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block font-sans">Service Charge (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none" value={localSettings.serviceChargeRate} onChange={e => setLocalSettings({...localSettings, serviceChargeRate: Number(e.target.value)})} /></div>
                          </div>
                      </div>
                  </div>
                  <button onClick={handleSaveGeneral} className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg hover:bg-red-800 shadow-xl shadow-red-200 flex items-center justify-center gap-3 transition-all active:scale-95 h-fit">
                      <Save size={24} /> Save General Settings
                  </button>
              </div>
          )}

          {activeTab === 'USERS' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-700">System User Accounts</h2>
                    <button onClick={() => { setUserForm({ name: '', pin: '', role: UserRole.CASHIER, permissions: ['ACCESS_POS'] }); setIsEditingUser(true); }} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-800 shadow-lg shadow-red-100">
                        <Plus size={20} /> Add New User
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {users.map(u => (
                        <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 text-primary rounded-2xl flex items-center justify-center">
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{u.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                                    <p className="text-[10px] text-gray-300 mt-1">PIN: ****</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setUserForm(u); setIsEditingUser(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18}/></button>
                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
          )}

          {activeTab === 'HR_FINANCE' && (
              <div className="max-w-4xl space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-700">
                        <Wallet size={24} className="text-primary"/> Financial Policies
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <h4 className="font-bold text-sm text-gray-600 mb-2 uppercase">Staff Advance Policy</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Advances given to staff are tracked as personal liabilities. These can be manually adjusted or auto-flagged during monthly salary processing.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <h4 className="font-bold text-sm text-gray-600 mb-2 uppercase">Payroll Management</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Salaries are based on the staff registry. All payments are logged under "Expenses > Salary" for transparent bookkeeping.</p>
                        </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-700">
                        <Users size={24} className="text-primary"/> Current Staff Registry
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs font-bold text-gray-400 uppercase">
                                <tr>
                                    <th className="pb-4">Name</th>
                                    <th className="pb-4">Role</th>
                                    <th className="pb-4">Salary</th>
                                    <th className="pb-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staff.map(s => (
                                    <tr key={s.id} className="text-sm">
                                        <td className="py-4 font-bold">{s.name}</td>
                                        <td className="py-4 text-gray-500">{s.role}</td>
                                        <td className="py-4 font-bold">Rs. {s.salaryAmount.toLocaleString()}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {s.active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {staff.length === 0 && (
                                    <tr><td colSpan={4} className="py-12 text-center text-gray-400 italic">Go to "Finance & HR" module to add staff members.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
          )}

          {activeTab === 'PRINTER' && (
              <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-700">
                      <Printer size={24} className="text-primary" /> KOT & Receipt Configuration
                  </h2>
                  <div className="space-y-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Paper Width</label>
                          <div className="flex gap-4">
                              {['58mm', '80mm'].map(w => (
                                  <button key={w} onClick={() => setLocalPrinterConfig({...localPrinterConfig, paperWidth: w as any})} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${localPrinterConfig.paperWidth === w ? 'border-primary bg-red-50 text-primary' : 'border-gray-100 text-gray-400'}`}>
                                      {w}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                              <p className="font-bold text-gray-700">Auto-Print Receipts</p>
                              <p className="text-xs text-gray-500">Automatically open print dialog after checkout</p>
                          </div>
                          <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, autoPrint: !localPrinterConfig.autoPrint})} className={`w-14 h-8 rounded-full relative transition-colors ${localPrinterConfig.autoPrint ? 'bg-primary' : 'bg-gray-200'}`}>
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localPrinterConfig.autoPrint ? 'right-1' : 'left-1'}`} />
                          </button>
                      </div>
                      <button onClick={handleSavePrinter} className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">Save Printer Config</button>
                  </div>
              </div>
          )}

          {activeTab === 'SYSTEM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2"><HardDrive size={20}/> Database Management</h2>
                      <p className="text-sm text-gray-500 mb-8">Export your restaurant data to a local file or restore from a previous backup. This ensures you never lose your records.</p>
                      <div className="space-y-4">
                          <button onClick={handleBackup} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 text-blue-700 rounded-2xl font-bold border border-blue-100 transition-all group">
                              <span className="flex items-center gap-2"><Download size={20}/> Create Local Backup</span>
                              <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <label className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 text-green-700 rounded-2xl font-bold border border-green-100 transition-all group cursor-pointer">
                              <span className="flex items-center gap-2"><Upload size={20}/> Restore from File</span>
                              <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                              <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </label>
                      </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 flex flex-col">
                      <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h2>
                      <p className="text-sm text-gray-500 mb-8 leading-relaxed">Factory resetting the system will wipe all orders, menu changes, inventory records, and staff details. This action cannot be undone.</p>
                      <button onClick={handleReset} className="w-full mt-auto flex items-center justify-center gap-2 p-5 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 size={20}/> Clear All Data & Reset
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'CLOUD' && (
              <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Cloud size={32} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">Dropbox Sync</h2>
                          <p className="text-sm text-gray-500 uppercase font-bold">Secure Cloud Persistence</p>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                              <p className="font-bold text-gray-700">Enable Synchronization</p>
                              <p className="text-xs text-gray-500">Automatically sync with Dropbox on every change</p>
                          </div>
                          <button onClick={() => setLocalSettings({...localSettings, sync: { ...localSettings.sync!, enabled: !localSettings.sync?.enabled }})} className={`w-14 h-8 rounded-full relative transition-colors ${localSettings.sync?.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.sync?.enabled ? 'right-1' : 'left-1'}`} />
                          </button>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Dropbox Access Token</label>
                        <input type="password" placeholder="Paste your token here..." className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-4 outline-none font-mono text-sm" value={localSettings.sync?.dropbox.accessToken} onChange={e => setLocalSettings({...localSettings, sync: { ...localSettings.sync!, dropbox: { accessToken: e.target.value } }})} />
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl flex gap-3">
                          <Info className="text-amber-600 shrink-0" size={20}/>
                          <p className="text-xs text-amber-700 leading-relaxed">Ensure you have generated an App Access Token from the Dropbox Developer Console for the file <span className="font-bold">shinwari_pos_db.json</span>.</p>
                      </div>
                      <button onClick={handleSaveGeneral} className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg">Save Sync Settings</button>
                  </div>
              </div>
          )}

          {activeTab === 'ABOUT' && (
              <div className="max-w-3xl mx-auto flex flex-col items-center py-12 text-center">
                  <div className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-red-200 mb-6 rotate-3">
                      <UtensilsCrossed size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800 mb-1">Subhan Khan Shinwari Dera POS</h2>
                  <p className="text-lg font-urdu text-primary font-bold mb-8">سبحان خان شنواری ڈیرہ - ڈیجیٹل کچن اور سیلز</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left mb-12">
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                          <h4 className="font-bold text-gray-400 text-[10px] uppercase mb-4 tracking-widest">Developer Credits</h4>
                          <p className="font-bold text-gray-800 mb-1">Rana Rashid Rashid</p>
                          <p className="text-sm text-gray-500 mb-4">Lead Software Architect</p>
                          <div className="flex gap-4">
                              <a href="#" className="p-2 bg-gray-50 rounded-lg hover:text-primary"><Github size={18}/></a>
                              <a href="#" className="p-2 bg-gray-50 rounded-lg hover:text-primary"><ExternalLink size={18}/></a>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                          <h4 className="font-bold text-gray-400 text-[10px] uppercase mb-4 tracking-widest">System Info</h4>
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm"><span className="text-gray-500">Build Version</span><span className="font-bold">1.6.0-stable</span></div>
                              <div className="flex justify-between text-sm"><span className="text-gray-500">Engine</span><span className="font-bold">React 19.2 + Lucide</span></div>
                              <div className="flex justify-between text-sm"><span className="text-gray-500">Last Update</span><span className="font-bold">May 2025</span></div>
                          </div>
                      </div>
                  </div>
                  
                  <p className="text-gray-400 text-xs">© 2025 Subhan Khan Shinwari. All Rights Reserved.</p>
              </div>
          )}
        </div>

        {/* User Editor Modal */}
        {isEditingUser && (
            <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Key size={20} className="text-primary"/> Account Details</h3>
                    <button onClick={() => setIsEditingUser(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-5 overflow-y-auto max-h-[70vh] no-scrollbar">
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Username</label>
                        <input className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="e.g. Arsalan" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Access PIN</label>
                           <div className="relative">
                              <input type={showPin ? 'text' : 'password'} maxLength={4} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value})} placeholder="4 digits" />
                              <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                 {showPin ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Account Role</label>
                           <select className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                        </div>
                     </div>
                     
                     <div className="pt-2 border-t">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block">System Permissions</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {[
                               { id: 'VIEW_DASHBOARD', label: 'View Dashboard' },
                               { id: 'ACCESS_POS', label: 'Access POS' },
                               { id: 'ACCESS_KITCHEN', label: 'Access Kitchen' },
                               { id: 'MANAGE_INVENTORY', label: 'Inventory Access' },
                               { id: 'MANAGE_EXPENSES', label: 'Finance Access' },
                               { id: 'MANAGE_MENU', label: 'Menu Editor' },
                               { id: 'MANAGE_SETTINGS', label: 'System Settings' },
                               { id: 'VIEW_REPORTS', label: 'Reports Viewer' }
                           ].map((perm) => (
                               <button 
                                key={perm.id} 
                                onClick={() => togglePermission(perm.id as Permission)} 
                                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${userForm.permissions?.includes(perm.id as Permission) ? 'border-primary/20 bg-red-50 text-primary' : 'border-gray-50 text-gray-400'}`}
                               >
                                  {perm.label}
                                  {userForm.permissions?.includes(perm.id as Permission) ? <CheckCircle size={14}/> : <Plus size={14}/>}
                               </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t flex gap-4">
                     <button onClick={() => setIsEditingUser(false)} className="flex-1 py-4 bg-white border text-gray-600 rounded-2xl font-bold">Cancel</button>
                     <button onClick={handleSaveUser} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-red-100">Save Account</button>
                  </div>
               </div>
            </div>
        )}
    </div>
  );
};

export default SettingsView;