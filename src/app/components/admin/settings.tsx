import { useState } from 'react';
import { Save, Store, Mail, Phone, MapPin, Globe, Bell, Shield, Palette } from 'lucide-react';
import { toast } from 'sonner';

export function AdminSettings() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-4 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] whitespace-nowrap transition-colors ${activeSection === s.id ? 'bg-primary text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            style={{ fontWeight: activeSection === s.id ? 600 : 400 }}
          >
            <s.icon className="w-4 h-4" /> {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'general' && <GeneralSettings />}
      {activeSection === 'notifications' && <NotificationSettings />}
      {activeSection === 'security' && <SecuritySettings />}
      {activeSection === 'appearance' && <AppearanceSettings />}
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="bg-white border rounded-xl p-6 space-y-6 max-w-2xl">
      <div>
        <h3 className="text-[16px] mb-4" style={{ fontWeight: 600 }}>Store Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">Store Name</label>
            <div className="flex items-center border rounded-lg bg-gray-50 focus-within:border-primary/40">
              <Store className="w-4 h-4 text-muted-foreground ml-3" />
              <input defaultValue="Kumar Store" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">Contact Email</label>
            <div className="flex items-center border rounded-lg bg-gray-50 focus-within:border-primary/40">
              <Mail className="w-4 h-4 text-muted-foreground ml-3" />
              <input defaultValue="admin@kumarstore.com" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">Phone</label>
            <div className="flex items-center border rounded-lg bg-gray-50 focus-within:border-primary/40">
              <Phone className="w-4 h-4 text-muted-foreground ml-3" />
              <input defaultValue="1800-123-4567" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">Address</label>
            <div className="flex items-center border rounded-lg bg-gray-50 focus-within:border-primary/40">
              <MapPin className="w-4 h-4 text-muted-foreground ml-3" />
              <input defaultValue="Mumbai, Maharashtra, India" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">Website</label>
            <div className="flex items-center border rounded-lg bg-gray-50 focus-within:border-primary/40">
              <Globe className="w-4 h-4 text-muted-foreground ml-3" />
              <input defaultValue="www.kumarstore.com" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" />
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => toast.success('Settings saved!')} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-[14px]" style={{ fontWeight: 600 }}>
        <Save className="w-4 h-4" /> Save Changes
      </button>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    newOrder: true, shopRequest: true, lowStock: true, customerSignup: false, dailyReport: true, weeklyReport: true,
  });

  const toggle = (key: keyof typeof settings) => setSettings((p) => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: 'newOrder' as const, label: 'New Order Notifications', desc: 'Get notified when a new order is placed' },
    { key: 'shopRequest' as const, label: 'Shop Registration Requests', desc: 'Get notified when a shop owner registers' },
    { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'Get alerts when products are running low' },
    { key: 'customerSignup' as const, label: 'New Customer Signups', desc: 'Get notified on new customer registrations' },
    { key: 'dailyReport' as const, label: 'Daily Summary Report', desc: 'Receive daily sales summary via email' },
    { key: 'weeklyReport' as const, label: 'Weekly Analytics Report', desc: 'Receive weekly analytics report' },
  ];

  return (
    <div className="bg-white border rounded-xl p-6 space-y-4 max-w-2xl">
      <h3 className="text-[16px] mb-2" style={{ fontWeight: 600 }}>Notification Preferences</h3>
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
          <div>
            <p className="text-[14px]" style={{ fontWeight: 500 }}>{item.label}</p>
            <p className="text-[13px] text-muted-foreground">{item.desc}</p>
          </div>
          <button
            onClick={() => toggle(item.key)}
            className={`w-11 h-6 rounded-full transition-colors relative ${settings[item.key] ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${settings[item.key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
      <button onClick={() => toast.success('Notification settings saved!')} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-[14px] mt-2" style={{ fontWeight: 600 }}>
        <Save className="w-4 h-4" /> Save Preferences
      </button>
    </div>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = () => {
    // Get stored admin password
    const storedPassword = localStorage.getItem('admin_password') || 'kumarstore@admin2026';

    if (currentPassword !== storedPassword) {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Store new password
    localStorage.setItem('admin_password', newPassword);

    // Clear admin session so user must re-login with new password
    sessionStorage.removeItem('kumarstore_admin_auth');

    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    toast.success('Password updated! Please log out and log back in with your new password.', { duration: 5000 });
  };

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6 max-w-2xl">
      <h3 className="text-[16px] mb-2" style={{ fontWeight: 600 }}>Security Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="text-[13px] text-muted-foreground mb-1 block">Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] text-muted-foreground mb-1 block">New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] text-muted-foreground mb-1 block">Confirm New Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 text-[14px]"
          />
        </div>
      </div>
      <button
        onClick={handleUpdatePassword}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-[14px]"
        style={{ fontWeight: 600 }}
      >
        <Save className="w-4 h-4" /> Update Password
      </button>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="bg-white border rounded-xl p-6 space-y-6 max-w-2xl">
      <h3 className="text-[16px] mb-2" style={{ fontWeight: 600 }}>Appearance</h3>
      <div className="space-y-4">
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">Primary Color</label>
          <div className="flex gap-3">
            {['#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
              <button
                key={c}
                className={`w-10 h-10 rounded-xl border-2 ${c === '#16a34a' ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                onClick={() => toast.success('Theme color updated!')}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">Sidebar Style</label>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-[13px]" style={{ fontWeight: 500 }}>Light</button>
            <button className="px-4 py-2 bg-gray-100 rounded-lg text-[13px]">Dark</button>
          </div>
        </div>
      </div>
    </div>
  );
}