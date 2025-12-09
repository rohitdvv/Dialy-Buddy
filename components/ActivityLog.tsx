
import React, { useState } from 'react';
import { ActivityData, DeviceConnection } from '../types';
import DeviceManager from './DeviceManager';

interface ActivityLogProps {
  onUpdate: (data: ActivityData) => void;
  initialData: ActivityData;
  connections: DeviceConnection[];
  onConnectDevice: (device: DeviceConnection) => void;
  onDisconnectDevice: (id: string) => void;
  onBluetoothData: (hr: number) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ 
  onUpdate, 
  initialData, 
  connections, 
  onConnectDevice, 
  onDisconnectDevice,
  onBluetoothData
}) => {
  const [data, setData] = useState<ActivityData>(initialData);

  // Sync with prop updates from App.tsx (important for simulated live updates)
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleChange = (field: keyof ActivityData, value: number) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(newData);
  };

  const isCloudSynced = connections.some(c => c.type === 'CLOUD' && c.status === 'CONNECTED');
  const isBLESynced = connections.some(c => c.type === 'BLUETOOTH' && c.status === 'CONNECTED');

  return (
    <div className="space-y-6">
      
      {/* Device Management Section */}
      <DeviceManager 
        connections={connections} 
        onConnect={onConnectDevice} 
        onDisconnect={onDisconnectDevice}
        onBluetoothData={onBluetoothData}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
        {isCloudSynced && (
          <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Auto-Sync Active
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity & Sleep Tracker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Steps */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 flex justify-between">
              <span>Daily Steps</span>
              {isCloudSynced && <span className="text-xs text-indigo-500">Synced from Device</span>}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={data.steps}
                onChange={(e) => handleChange('steps', parseInt(e.target.value))}
                disabled={isCloudSynced}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isCloudSynced ? 'bg-slate-100' : 'bg-slate-200 accent-indigo-600'}`}
              />
              <span className="w-20 text-right font-bold text-slate-800">{data.steps}</span>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 flex justify-between">
              <span>Avg Heart Rate (BPM)</span>
              {isBLESynced && <span className="text-xs text-rose-500 animate-pulse">Live Bluetooth</span>}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="40"
                max="140"
                value={data.heartRateAvg}
                onChange={(e) => handleChange('heartRateAvg', parseInt(e.target.value))}
                disabled={isBLESynced}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isBLESynced ? 'bg-rose-100' : 'bg-slate-200 accent-rose-500'}`}
              />
              <span className={`w-20 text-right font-bold ${isBLESynced ? 'text-rose-600' : 'text-slate-800'}`}>
                {data.heartRateAvg}
              </span>
            </div>
          </div>

          {/* Sleep Hours */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 flex justify-between">
               <span>Sleep Duration (Hours)</span>
               {isCloudSynced && <span className="text-xs text-indigo-500">Synced from Device</span>}
            </label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleChange('sleepHours', Math.max(0, data.sleepHours - 0.5))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                disabled={isCloudSynced}
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-2xl text-slate-800">{data.sleepHours}</span>
              <button 
                 onClick={() => handleChange('sleepHours', Math.min(14, data.sleepHours + 0.5))}
                 className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                 disabled={isCloudSynced}
              >
                +
              </button>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Sleep Quality (1-10)</label>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg opacity-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleChange('sleepQuality', num)}
                  disabled={isCloudSynced}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    data.sleepQuality === num
                      ? 'bg-indigo-600 text-white scale-110 shadow-md'
                      : 'bg-white text-slate-500 hover:bg-indigo-50'
                  } ${isCloudSynced ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
