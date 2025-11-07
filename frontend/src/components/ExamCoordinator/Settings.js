import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Settings = () => {
  const [value, setValue] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/settings/staff-per-hall');
        setValue(res.data?.value || 1);
      } catch (e) {
        console.error('Error loading settings:', e);
        alert('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings/staff-per-hall', { value: Number(value) });
      alert('Saved');
    } catch (e) {
      console.error('Error saving:', e);
      alert(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Exam Settings</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="form-label">Staff per hall</label>
          <input
            type="number"
            min={1}
            max={10}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="form-input max-w-[200px]"
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
