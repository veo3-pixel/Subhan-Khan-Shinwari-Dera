
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
                      <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-700">Identity Details</h2>
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
                              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">GST (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none" value={localSettings.taxRate} onChange={e => setLocalSettings({...localSettings, taxRate: Number(e.target.value)})} /></div>
                              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Service (%)</label><input type="number" className="w-full border-2 border-gray-100 focus:border-primary rounded-xl p-3 outline-none" value={localSettings.serviceChargeRate} onChange={e => setLocalSettings({...localSettings, serviceChargeRate: Number(e.target.value)})} /></div>
                          </div>
                      </div>
                  </div>
                  <button onClick={handleSaveGeneral} className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg hover:bg-red-800 shadow-xl shadow-red-200 flex items-center justify-center gap-3 transition-all active:scale-95 h-fit mt-auto lg:mt-0">
                      <Save size={24} /> Save General Settings
                  </button>
              </div>
          )}

          {activeTab === 'PRINTER' && (
              <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-700">Printer Config</h2>
                  <div className="space-y-8">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Paper Width</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, paperWidth: '80mm'})} className={`py-4 rounded-2xl border-2 font-bold transition-all ${localPrinterConfig.paperWidth === '80mm' ? 'border-primary bg-red-50 text-primary' : 'border-gray-100 text-gray-400'}`}>80mm</button>
                            <button onClick={() => setLocalPrinterConfig({...localPrinterConfig, paperWidth: '58mm'})} className={`py-4 rounded-2xl border-2 font-bold transition-all ${localPrinterConfig.paperWidth === '58mm' ? 'border-primary bg-red-50 text-primary' : 'border-gray-100 text-gray-400'}`}>58mm</button>
                        </div>
                      </div>
                      <button onClick={handleSavePrinter} className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-slate-700 shadow-lg">Update Printer Config</button>
                  </div>
              </div>
          )}

          {activeTab === 'SYSTEM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-700"><HardDrive size={22} className="text-primary"/> Backup & Restore</h2>
                      <div className="space-y-4">
                          <button onClick={handleBackup} className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-all">
                              <Download size={20} className="text-blue-600" /> Download Backup (JSON)
                          </button>
                          <div className="relative">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-all">
                                <Upload size={20} className="text-green-600" /> Restore from File
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
                          </div>
                      </div>
                  </div>
                  <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                      <h2 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-3"><AlertTriangle size={22} /> Danger Zone</h2>
                      <button onClick={handleClearDB} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200">Wipe All Local Data</button>
                  </div>
              </div>
          )}

          {activeTab === 'ABOUT' && (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="text-center max-w-lg bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
                       <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                          <UtensilsCrossed size={48} />
                       </div>
                       <h2 className="text-3xl font-bold text-gray-800">Shinwari Dera ERP</h2>
                       <p className="text-gray-500 text-sm mt-2 uppercase tracking-[0.2em] font-bold">Version 1.5.0</p>
                       <div className="mt-10 py-6 border-y border-gray-100">
                          <p className="text-gray-600 font-medium">Developed by Rana Rashid Rashid</p>
                          <p className="text-sm font-bold text-gray-600 mt-1">Contact: 0300-4097479</p>
                       </div>
                  </div>
              </div>
          )}
        </div>
    </div>
  );
};

export default SettingsView;
