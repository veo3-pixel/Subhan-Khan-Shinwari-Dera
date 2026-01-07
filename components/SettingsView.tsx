
import React, { useState, useEffect, useRef } from 'react';
import { PersistenceService } from '../services/persistenceService';
import { 
  Database, Download, Upload, AlertTriangle, RefreshCw, CheckCircle, Printer, 
  User as UserIcon, Plus, Trash2, Key, Shield, Edit2, Store, Percent, Eye, 
  EyeOff, Info, Cloud, Loader2, Play, FileText, Smartphone, HardDrive, X, Save,
  UtensilsCrossed
} from 'lucide-react';
import { User, PrinterConfig, UserRole, Permission, SystemSettings, Category } from '../types';

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
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SYSTEM' | 'CLOUD' | 'PRINTER' | 'USERS' | 'ABOUT'>('GENERAL');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Local state for forms, initialized from props
  const [localSettings, setLocalSettings] = useState<SystemSettings>(globalSettings);
  const [localPrinterConfig, setLocalPrinterConfig] = useState<PrinterConfig>(globalPrinterConfig);
  const [users, setUsers] = useState<User[]>(PersistenceService.getUsers());
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  useEffect(() => {
    setLocalPrinterConfig(globalPrinterConfig);
  }, [globalPrinterConfig]);
  
  // User Management State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '', pin: '', role: UserRole.CASHIER, permissions: ['ACCESS_POS']
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveGeneral = () => {
      onUpdateSettings(localSettings);
      showMsg('General settings saved.');
  };

  const handleSavePrinter = () => {
      onUpdatePrinterConfig(localPrinterConfig);
      showMsg('Printer configuration updated.');
  };

  const handleSaveUser = () => {
      if(!userForm.name || !userForm.pin) {
          showMsg('Name and PIN are required', 'error');
          return;
      }
      
      const newUser: User = {
          id: userForm.id || Math.random().toString(36).substr(2, 9),
          name: userForm.name!,
          pin: userForm.pin!,
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
      showMsg('User saved successfully.');
  };

  const handleDeleteUser = (id: string) => {
      if(id === 'admin') {
          showMsg('Cannot delete master admin', 'error');
          return;
      }
      if(confirm('Delete this user?')) {
          const updated = users.filter(u => u.id !== id);
          setUsers(updated);
          PersistenceService.saveUsers(updated);
          showMsg('User deleted.');
      }
  };

  const handleBackup = () => {
      const data = PersistenceService.createBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Shinwari_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showMsg('Backup downloaded.');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const success = PersistenceService.restoreBackup(event.target?.result as string);
          if(success) {
              showMsg('Database restored. Please restart app.');
              setTimeout(() => window.location.reload(), 1500);
          } else {
              showMsg('Invalid backup file', 'error');
          }
      };
      reader.readAsText(file);
  };

  const handleClearDB = () => {
      const pin = prompt("DANGER: This will delete everything! Enter Admin PIN to confirm:");
      if(pin === '1234' || pin === '9221') {
          PersistenceService.clearDatabase();
          showMsg('Database wiped.');
          setTimeout(() => window.location.reload(), 1000);
      } else if(pin !== null) {
          showMsg('Incorrect PIN', 'error');
      }
  };

  const togglePermission = (perm: Permission) => {
      const current = userForm.permissions || [];
      const updated = current.includes(perm) 
          ? current.filter(p => p !== perm) 
          : [...current, perm];
      setUserForm({...userForm, permissions: updated});
  };

  const handleTestDropbox = async () => {
    const token = localSettings.sync?.dropbox.accessToken?.trim();
    if (!token) {
        showMsg('Please enter an access token first', 'error');
        return;
    }
    setIsConnecting(true);
    try {
        const response = await fetch('https://api.dropboxapi.com/2/check/user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: "test" })
        });
        if (response.ok) {
            showMsg('Connection successful!');
        } else {
            showMsg('Invalid token or connection error', 'error');
        }
    } catch (err) {
        showMsg('Network error occurred', 'error');
    } finally {
        setIsConnecting(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-surface flex flex-col relative">
        <div className="mb-6 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Control Center
                    <Shield size={24} className="text-primary" />
                </h1>
                <span className="font-urdu text-lg text-gray-500">سسٹم کا انتظام</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <Smartphone size={16} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Version 1.5.0</span>
            </div>
        </div>

        {statusMsg && (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-xl flex items-center gap-3 shadow-2xl animate-fade-in ${statusMsg.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <span className="font-bold">{statusMsg.text}</span>
            </div>
        )}

        <div className="flex gap-2 mb-8 border-b overflow-x-auto no-scrollbar">
           {[
               {id: 'GENERAL', label: 'General', icon: Store},
               {id: 'USERS', label: 'Users & Staff', icon: UserIcon},
               {id: 'PRINTER', label: 'Printer KOT', icon: Printer},
               {id: 'CLOUD', label: 'Cloud Sync', icon: Cloud},
               {id: 'SYSTEM', label: 'System Tools', icon: Database},
               {id: 'ABOUT', label: 'About', icon: Info}
           ].map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary bg-red-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <tab.icon size={18} />
                 {tab.label}
               </button>
           ))}
        </div>

        <div className="flex-1 animate-fade-in">
          {activeTab === 'GENERAL' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold mb-8 flex items-center gap-3"><Store size={22} className="text-primary"/> Restaurant Identity</h2>
                      <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Restaurant Name</label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all font-bold" value={localSettings.restaurantName} onChange={e => setLocalSettings({...localSettings, restaurantName: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block font-urdu">ریسٹورنٹ کا نام</label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all font-urdu text-right text-lg" value={localSettings.restaurantUrduName} onChange={e => setLocalSettings({...localSettings, restaurantUrduName: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Phone Number</label>
                                <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all" value={localSettings.phone} onChange={e => setLocalSettings({...localSettings, phone: e.target.value})} />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Currency</label>
                                <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all text-center font-bold" value={localSettings.currencySymbol} onChange={e => setLocalSettings({...localSettings, currencySymbol: e.target.value})} />
                              </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Address</label>
                            <textarea className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all resize-none" rows={3} value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
                          </div>
                      </div>
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-8 flex items-center gap-3"><Percent size={22} className="text-primary"/> Tax & Charges</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">GST (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none font-bold text-lg" value={localSettings.taxRate} onChange={e => setLocalSettings({...localSettings, taxRate: Number(e.target.value)})} /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Service (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none font-bold text-lg" value={localSettings.serviceChargeRate} onChange={e => setLocalSettings({...localSettings, serviceChargeRate: Number(e.target.value)})} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Receipt Footer Note</label>
                            <input className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none transition-all" placeholder="Thank you for visiting!" value={localSettings.receiptFooter} onChange={e => setLocalSettings({...localSettings, receiptFooter: e.target.value})} />
                        </div>
                    </div>
                    <button onClick={handleSaveGeneral} className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg hover:bg-red-800 shadow-xl shadow-red-200 flex items-center justify-center gap-3 transition-all active:scale-95">
                        <Save size={24} /> Save Changes
                    </button>
                  </div>
              </div>
          )}

          {activeTab === 'PRINTER' && (
              <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-8 flex items-center gap-3"><Printer size={22} className="text-primary"/> Printer Configuration</h2>
                  <div className="space-y-8">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Paper Width</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, paperWidth: '80mm'})} className={`py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${localPrinterConfig.paperWidth === '80mm' ? 'border-primary bg-red-50 text-primary' : 'border-gray-100 text-gray-400'}`}>
                                <span className="text-lg">80mm</span>
                                <span className="text-[10px] uppercase">Standard Desktop</span>
                            </button>
                            <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, paperWidth: '58mm'})} className={`py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${localPrinterConfig.paperWidth === '58mm' ? 'border-primary bg-red-50 text-primary' : 'border-gray-100 text-gray-400'}`}>
                                <span className="text-lg">58mm</span>
                                <span className="text-[10px] uppercase">Small Thermal</span>
                            </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                              <p className="font-bold text-gray-700">Auto-Print Receipts</p>
                              <p className="text-xs text-gray-500">Automatically print after placing order</p>
                          </div>
                          <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, autoPrint: !localPrinterConfig.autoPrint})} className={`w-14 h-8 rounded-full transition-all relative ${localPrinterConfig.autoPrint ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localPrinterConfig.autoPrint ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                      <button onClick={handleSavePrinter} className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-slate-700 shadow-lg">
                          Update Printer Config
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'USERS' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-700">Staff Accounts</h2>
                      <button onClick={() => { setUserForm({name: '', pin: '', role: UserRole.CASHIER, permissions: ['ACCESS_POS']}); setIsEditingUser(true); }} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-800 shadow-lg shadow-red-100">
                          <Plus size={18}/> Add New User
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.map(u => (
                          <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.role === UserRole.ADMIN ? 'bg-red-100 text-primary' : 'bg-blue-100 text-blue-600'}`}>
                                      <UserIcon size={24} />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-800">{u.name}</h3>
                                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{u.role}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setUserForm(u); setIsEditingUser(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'SYSTEM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><HardDrive size={22} className="text-primary"/> Data Management</h2>
                      <div className="space-y-4">
                          <button onClick={handleBackup} className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-all">
                              <Download size={20} className="text-blue-600" /> Export Database (Backup)
                          </button>
                          <div className="relative">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-all">
                                <Upload size={20} className="text-green-600" /> Import Database (Restore)
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
                          </div>
                      </div>
                  </div>
                  <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                      <h2 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-3"><AlertTriangle size={22} /> Danger Zone</h2>
                      <p className="text-sm text-red-600 mb-6 font-medium">Warning: Clearing the database will remove all orders, menu items, and inventory data permanently. This cannot be undone.</p>
                      <button onClick={handleClearDB} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                          <Trash2 size={20} /> Wipe All Data
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'CLOUD' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl">
                  <div className="flex items-center gap-6 mb-10">
                      <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner"><Cloud size={32} /></div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Dropbox Integration</h2>
                        <p className="text-sm text-gray-500">Secure your database in the cloud automatically.</p>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Dropbox Access Token</label>
                        <input type="password" placeholder="Paste your generated token here..." className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-4 font-mono text-xs outline-none" value={localSettings.sync?.dropbox.accessToken || ''} onChange={e => setLocalSettings({...localSettings, sync: { ...localSettings.sync, dropbox: { accessToken: e.target.value } } as any})} />
                      </div>
                      <div className="flex gap-4">
                          <button onClick={handleTestDropbox} disabled={isConnecting} className="flex-1 bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-50 flex items-center justify-center gap-3 shadow-sm transition-all">
                              {isConnecting ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} className="text-blue-600"/>} Connection Test
                          </button>
                          <button onClick={handleSaveGeneral} className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-red-800 shadow-xl shadow-red-100">Enable Cloud Sync</button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'ABOUT' && (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="text-center max-w-lg bg-white p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                       <div className="absolute top-0 inset-x-0 h-2 bg-primary"></div>
                       <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                          <UtensilsCrossed size={48} />
                       </div>
                       <h2 className="text-3xl font-bold text-gray-800">Subhan Khan Shinwari</h2>
                       <p className="text-gray-500 text-sm mt-2 uppercase tracking-[0.2em] font-bold">Shinwari Dera ERP v1.5.0</p>
                       
                       <div className="mt-10 py-6 border-y border-gray-100">
                          <p className="text-gray-600 font-medium">This application is optimized for thermal printers and high-speed POS operations.</p>
                       </div>

                       <div className="mt-10">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Developed By</p>
                          <h3 className="text-xl font-bold text-primary">Rana Rashid Rashid</h3>
                          <p className="text-sm font-bold text-gray-600 mt-1">Contact: 0300-4097479</p>
                       </div>
                  </div>
              </div>
          )}
        </div>

        {/* User Editor Modal */}
        {isEditingUser && (
            <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
                    <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-xl flex items-center gap-2"><UserIcon size={20}/> {userForm.id ? 'Edit User' : 'Add New Staff'}</h3>
                        <button onClick={() => setIsEditingUser(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Display Name</label>
                                <input className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Login PIN (4-6 Digits)</label>
                                <input type="password" maxLength={6} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-mono" value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">System Role</label>
                                <select className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-dashed italic">
                                    Roles define default permission levels for staff members.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-4 block">Individual Permissions</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {id: 'ACCESS_POS', label: 'POS Access'},
                                    {id: 'ACCESS_KITCHEN', label: 'Kitchen Screen'},
                                    {id: 'VIEW_DASHBOARD', label: 'View Dashboard'},
                                    {id: 'VIEW_REPORTS', label: 'View Reports'},
                                    {id: 'MANAGE_MENU', label: 'Manage Menu'},
                                    {id: 'MANAGE_INVENTORY', label: 'Manage Stock'},
                                    {id: 'MANAGE_EXPENSES', label: 'Manage Finance'},
                                    {id: 'ADJUST_STOCK', label: 'Manual Stock Adjust'},
                                    {id: 'PROCESS_REFUND', label: 'Process Refunds'},
                                    {id: 'MANAGE_SETTINGS', label: 'Change Settings'},
                                ].map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => togglePermission(p.id as Permission)} 
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${userForm.permissions?.includes(p.id as Permission) ? 'border-primary bg-red-50 text-primary shadow-sm' : 'border-gray-50 text-gray-400 hover:border-gray-100'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userForm.permissions?.includes(p.id as Permission) ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                                            {userForm.permissions?.includes(p.id as Permission) && <CheckCircle size={14} className="text-white"/>}
                                        </div>
                                        <span className="text-xs font-bold">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex gap-4">
                        <button onClick={() => setIsEditingUser(false)} className="flex-1 py-4 bg-white border text-gray-600 rounded-2xl font-bold hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSaveUser} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-red-800 shadow-xl shadow-red-100 flex items-center justify-center gap-2">
                           <Save size={18}/> Save Staff Member
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SettingsView;
