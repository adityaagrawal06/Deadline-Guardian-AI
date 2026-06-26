import { useState, useRef } from 'react';
import { User, Bell, Shield, Camera, Loader2 } from 'lucide-react';

export default function SettingsTab({ user, setUser }) {
  const [notifications, setNotifications] = useState(true);
  const [strictRescue, setStrictRescue] = useState(true);
  
  const [name, setName] = useState(user?.name || '');
  const [pictureBase64, setPictureBase64] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picture || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictureBase64(reader.result);
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, pictureBase64 })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userUpdated'));
        setPictureBase64(null); // Reset after saving
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto animate-fade-in p-2 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8">Settings</h1>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="text-primary" /> Profile Information
            </h2>
            <div className="flex items-start gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-4 border-primary/20 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name?.[0] || 'U'
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden" 
                />
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-text-muted mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:ring-2 focus:ring-primary outline-none transition-all" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-text-muted mb-1">Email Address</label>
                  <input type="email" disabled value={user?.email || ''} className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text opacity-70 cursor-not-allowed" />
                </div>
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || (!pictureBase64 && name === user?.name)}
                  className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="text-blue-500" /> Preferences
            </h2>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-bold">Email Notifications</p>
                <p className="text-xs text-text-muted">Receive daily digests and urgent deadline alerts.</p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)} 
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'left-6.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold flex items-center gap-2">Strict Rescue Mode <Shield size={14} className="text-red-500" /></p>
                <p className="text-xs text-text-muted">Automatically suggest Rescue Mode when a deadline is within 3 days.</p>
              </div>
              <button 
                onClick={() => setStrictRescue(!strictRescue)} 
                className={`w-12 h-6 rounded-full transition-colors relative ${strictRescue ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${strictRescue ? 'left-6.5' : 'left-0.5'}`}></div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
