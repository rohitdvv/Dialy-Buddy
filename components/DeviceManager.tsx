
import React, { useState } from 'react';
import { DeviceConnection } from '../types';

interface DeviceManagerProps {
  connections: DeviceConnection[];
  onConnect: (device: DeviceConnection) => void;
  onDisconnect: (deviceId: string) => void;
  onBluetoothData?: (heartRate: number) => void;
}

const DeviceManager: React.FC<DeviceManagerProps> = ({ connections, onConnect, onDisconnect, onBluetoothData }) => {
  const [loading, setLoading] = useState<string | null>(null);
  
  // Apple Watch Connection State
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [appleScanStatus, setAppleScanStatus] = useState<'SCANNING' | 'FOUND' | 'SYNCING'>('SCANNING');

  const handleCloudConnect = (name: string, id: string) => {
    setLoading(id);
    // Simulate API Auth Delay
    setTimeout(() => {
      onConnect({
        id,
        name,
        type: 'CLOUD',
        status: 'CONNECTED',
        lastSync: new Date().toLocaleTimeString()
      });
      setLoading(null);
    }, 1500);
  };

  // --- Apple Watch Specific Flow ---
  const startAppleFlow = () => {
    setShowAppleModal(true);
    setAppleScanStatus('SCANNING');
    
    // Simulate finding devices after 2.5 seconds
    setTimeout(() => {
      setAppleScanStatus('FOUND');
    }, 2500);
  };

  const selectAppleDevice = (deviceName: string) => {
    setAppleScanStatus('SYNCING');
    
    // Simulate HealthKit Data Extraction
    setTimeout(() => {
      onConnect({
        id: 'apple_health_watch',
        name: deviceName, // e.g. "Apple Watch Series 9"
        type: 'CLOUD',
        status: 'CONNECTED',
        lastSync: 'Just now'
      });
      setShowAppleModal(false);
    }, 2000);
  };

  // --- Bluetooth Flow ---
  const handleBluetoothConnect = async () => {
    setLoading('ble_hr');
    try {
      // @ts-ignore - Web Bluetooth types might be missing in some envs
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        let hr = 0;
        if ((flags & 0x01) === 0) {
          hr = value.getUint8(1);
        } else {
          hr = value.getUint16(1, true);
        }
        
        if (onBluetoothData) onBluetoothData(hr);
      });

      onConnect({
        id: 'ble_hr',
        name: device.name || 'Heart Rate Monitor',
        type: 'BLUETOOTH',
        status: 'CONNECTED',
        lastSync: 'Live Stream'
      });

    } catch (error) {
      console.error(error);
      alert("Could not connect to Bluetooth device. Ensure you have a BLE Heart Rate Monitor and are using Chrome/Edge.");
    } finally {
      setLoading(null);
    }
  };

  const isConnected = (id: string) => connections.some(c => c.id === id && c.status === 'CONNECTED');
  const appleConnected = isConnected('apple_health_watch');

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connected Devices
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Apple Health Card */}
          <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${appleConnected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-xl"></div>
              <div>
                <h3 className="font-bold text-slate-700">{appleConnected ? connections.find(c => c.id === 'apple_health_watch')?.name : 'Apple Health'}</h3>
                <p className="text-xs text-slate-500">{appleConnected ? 'Syncing Activity Rings...' : 'Connect Apple Watch'}</p>
              </div>
            </div>
            <button
              onClick={() => appleConnected ? onDisconnect('apple_health_watch') : startAppleFlow()}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                appleConnected 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-black text-white hover:bg-slate-800'
              }`}
            >
               {appleConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Fitbit Simulation */}
          <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${isConnected('fitbit') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">⌚</div>
              <div>
                <h3 className="font-bold text-slate-700">Fitbit</h3>
                <p className="text-xs text-slate-500">{isConnected('fitbit') ? 'Syncing steps & sleep...' : 'Not connected'}</p>
              </div>
            </div>
            <button
              onClick={() => isConnected('fitbit') ? onDisconnect('fitbit') : handleCloudConnect('Fitbit', 'fitbit')}
              disabled={loading === 'fitbit'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isConnected('fitbit') 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading === 'fitbit' ? '...' : isConnected('fitbit') ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Google Fit Simulation */}
          <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${isConnected('gfit') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">🧡</div>
              <div>
                <h3 className="font-bold text-slate-700">Google Fit</h3>
                <p className="text-xs text-slate-500">{isConnected('gfit') ? 'Syncing activity...' : 'Not connected'}</p>
              </div>
            </div>
            <button
              onClick={() => isConnected('gfit') ? onDisconnect('gfit') : handleCloudConnect('Google Fit', 'gfit')}
              disabled={loading === 'gfit'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isConnected('gfit') 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
               {loading === 'gfit' ? '...' : isConnected('gfit') ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Real Bluetooth Heart Rate */}
          <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${isConnected('ble_hr') ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">💓</div>
              <div>
                <h3 className="font-bold text-slate-700">HR Monitor (BLE)</h3>
                <p className="text-xs text-slate-500">{isConnected('ble_hr') ? 'Live Heart Rate Stream' : 'Bluetooth Low Energy'}</p>
              </div>
            </div>
            <button
              onClick={() => isConnected('ble_hr') ? onDisconnect('ble_hr') : handleBluetoothConnect()}
              disabled={loading === 'ble_hr'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isConnected('ble_hr') 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
               {loading === 'ble_hr' ? '...' : isConnected('ble_hr') ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Apple Watch Pairing Modal */}
      {showAppleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setShowAppleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-black text-white rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg">
                
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {appleScanStatus === 'SCANNING' ? 'Searching for Accessories...' : 
                 appleScanStatus === 'FOUND' ? 'Select Device' : 'Syncing HealthKit...'}
              </h3>
              <p className="text-sm text-slate-500">
                 {appleScanStatus === 'SCANNING' ? 'Bring your device nearby.' : 
                  appleScanStatus === 'FOUND' ? 'Choose your Apple Watch to pair.' : 'Extracting Activity Rings & Sleep Data...'}
              </p>
            </div>

            <div className="space-y-3 min-h-[200px] flex flex-col justify-center">
              {appleScanStatus === 'SCANNING' && (
                <div className="flex justify-center py-8">
                  <span className="relative flex h-16 w-16">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-16 w-16 bg-slate-100 items-center justify-center">
                       <svg className="w-8 h-8 text-slate-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                       </svg>
                    </span>
                  </span>
                </div>
              )}

              {appleScanStatus === 'FOUND' && (
                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-300">
                  <button 
                    onClick={() => selectAppleDevice('Apple Watch Series 9')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white">⌚</div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-sm">Apple Watch Series 9</p>
                      <p className="text-xs text-slate-500">John's Watch</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => selectAppleDevice('Apple Watch Ultra 2')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white">⌚</div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-sm">Apple Watch Ultra 2</p>
                      <p className="text-xs text-slate-500">Nearby</p>
                    </div>
                  </button>
                </div>
              )}

              {appleScanStatus === 'SYNCING' && (
                <div className="flex flex-col items-center py-6">
                   <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <p className="text-xs text-slate-500 font-mono">Importing: HeartRate... SleepAnalysis... Workout...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeviceManager;
