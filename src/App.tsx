import React, { useEffect, useState, useCallback } from 'react';
import { 
  Fan, 
  Blinds, 
  Thermometer, 
  Droplets, 
  Wifi, 
  WifiOff, 
  Lightbulb,
  Zap,
  Activity,
  ShieldCheck,
  Power,
  RefreshCw
} from 'lucide-react';

// ================= CONFIGURACIÓN SEGURA =================
// Vite requiere el prefijo VITE_ para exponer variables de entorno en el frontend
const SINRIC_API_KEY = import.meta.env.VITE_SINRIC_API_KEY;
const BASE_URL = '/api/sinric'; // Vercel redirigirá esto a https://api.sinric.pro/v1

const DEVICE_IDS = {
  FAN: '6aa41651b597c4e1234320e9',
  BLIND: '6aa4168396dc1ddeb054da17',
  TEMP_SENSOR: '6aa416cfb597c4e123432162',
  LED: '6aa4168396dc1ddeb054da17'
};

interface SensorData {
  temp: number;
  hum: number;
}

export default function App(): React.JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [sensorData, setSensorData] = useState<SensorData>({ temp: 0, hum: 0 });
  const [fanState, setFanState] = useState<boolean>(false);
  const [ledState, setLedState] = useState<boolean>(false);
  const [blindPos, setBlindPos] = useState<number>(0);

  const sinricFetch = async (endpoint: string, options: RequestInit = {}) => {
    if (!SINRIC_API_KEY) {
      console.error('Error: La API Key de Sinric Pro no está configurada.');
      throw new Error('Falta API Key');
    }

    const headers = {
      'x-api-key': SINRIC_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
  };

  // Para consultar el estado del sensor de temperatura/humedad:
// Para consultar los dispositivos y extraer la temperatura/humedad:
const fetchSensorData = useCallback(async () => {
  try {
    setIsLoading(true);
    
    // Solicitamos la lista completa de dispositivos a Sinric Pro
    const data = await sinricFetch('/devices');
    
    // Sinric Pro devuelve { success: true, devices: [ ... ] }
    if (data.success && Array.isArray(data.devices)) {
      // Buscamos el sensor por su ID
      const tempDevice = data.devices.find(
        (dev: any) => dev.id === DEVICE_IDS.TEMP_SENSOR
      );

      if (tempDevice) {
        setSensorData({
          temp: tempDevice.state?.temperature || 0,
          hum: tempDevice.state?.humidity || 0,
        });
      }

      // Opcional: Actualizar el estado del ventilador y LED según Sinric Pro
      const fanDevice = data.devices.find((dev: any) => dev.id === DEVICE_IDS.FAN);
      if (fanDevice) setFanState(fanDevice.state?.power === 'On');

      const ledDevice = data.devices.find((dev: any) => dev.id === DEVICE_IDS.LED);
      if (ledDevice) setLedState(ledDevice.state?.power === 'On');

      setIsConnected(true);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    setIsConnected(false);
  } finally {
    setIsLoading(false);
  }
}, []);

  const toggleFan = async (): Promise<void> => {
    const nextState = !fanState;
    try {
      await sinricFetch(`/devices/${DEVICE_IDS.FAN}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'setPowerState',
          value: { state: nextState ? 'On' : 'Off' },
        }),
      });
      setFanState(nextState);
    } catch (error) {
      console.error('Error ventilador:', error);
    }
  };

  const toggleLed = async (): Promise<void> => {
    const nextState = !ledState;
    try {
      await sinricFetch(`/devices/${DEVICE_IDS.LED}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'setPowerState',
          value: { state: nextState ? 'On' : 'Off' },
        }),
      });
      setLedState(nextState);
    } catch (error) {
      console.error('Error LED:', error);
    }
  };

  const handleBlindChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setBlindPos(parseInt(e.target.value, 10) || 0);
  };

  const sendBlindPosition = async (): Promise<void> => {
    try {
      await sinricFetch(`/devices/${DEVICE_IDS.BLIND}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'setRangeValue',
          value: { rangeValue: blindPos },
        }),
      });
    } catch (error) {
      console.error('Error persiana:', error);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 20000);
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <header className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-500 to-blue-600 p-[2px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-amber-400" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                  FUSALMO • DON BOSCO
                </span>
                <span className="text-[10px] text-slate-500 font-mono">v4.5 Vercel Secure</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-0.5">
                Centro de Control Domótico
              </h1>
              <p className="text-xs text-slate-400">Automatización y Monitoreo Cloud vía Vercel Proxy</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
            <button 
              onClick={fetchSensorData} 
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`p-2 rounded-xl transition-colors ${isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isConnected ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sinric Pro Cloud</p>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                <p className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isConnected ? 'SISTEMA OPERATIVO' : 'DESCONECTADO'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Termostato */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between group">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Termostato</span>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>
            <div className="my-6">
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-black text-white tracking-tight">{sensorData.temp}</span>
                <span className="text-2xl font-bold text-amber-400">°C</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Temperatura Interior</p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Humedad</span>
              </div>
              <span className="font-bold text-slate-200 font-mono">{sensorData.hum}%</span>
            </div>
          </div>

          {/* Ventilador */}
          <div className={`backdrop-blur-md p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
            fanState ? 'bg-blue-950/20 border-blue-500/50 shadow-2xl' : 'bg-slate-900/40 border-slate-800/80'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Climatización</span>
              <div className={`p-2.5 rounded-2xl ${fanState ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                <Fan className={`w-5 h-5 ${fanState ? 'animate-spin' : ''}`} />
              </div>
            </div>
            <div className="my-6">
              <span className={`text-xl font-extrabold ${fanState ? 'text-blue-400' : 'text-slate-500'}`}>
                {fanState ? 'ACTIVO' : 'INACTIVO'}
              </span>
              <p className="text-xs text-slate-500 mt-1">Ventilador Extractor</p>
            </div>
            <button
              onClick={toggleFan}
              disabled={!isConnected}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                fanState ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{fanState ? 'Detener' : 'Encender'}</span>
            </button>
          </div>

          {/* Iluminación */}
          <div className={`backdrop-blur-md p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
            ledState ? 'bg-amber-950/20 border-amber-500/50 shadow-2xl' : 'bg-slate-900/40 border-slate-800/80'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Iluminación</span>
              <div className={`p-2.5 rounded-2xl ${ledState ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                <Lightbulb className="w-5 h-5" />
              </div>
            </div>
            <div className="my-6">
              <span className={`text-xl font-extrabold ${ledState ? 'text-amber-400' : 'text-slate-500'}`}>
                {ledState ? 'ENCENDIDA' : 'APAGADA'}
              </span>
              <p className="text-xs text-slate-500 mt-1">Tira LED Principal</p>
            </div>
            <button
              onClick={toggleLed}
              disabled={!isConnected}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                ledState ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' : 'bg-amber-500 text-slate-950 font-extrabold'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{ledState ? 'Apagar Luz' : 'Encender Luz'}</span>
            </button>
          </div>

          {/* Persiana */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Persiana</span>
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl">
                <Blinds className="w-5 h-5" />
              </div>
            </div>
            <div className="my-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Apertura</span>
                <span className="text-2xl font-black text-teal-400 font-mono">{blindPos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blindPos}
                onChange={handleBlindChange}
                onMouseUp={sendBlindPosition}
                onTouchEnd={sendBlindPosition}
                disabled={!isConnected}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-3 border-t border-slate-800/80">
              <span>CERRADO (0%)</span>
              <span>ABIERTO (100%)</span>
            </div>
          </div>
        </div>

        <footer className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Sistema Domótico FUSALMO - Don Bosco</span>
          </div>
          <span className="font-mono text-[10px]">Vercel Serverless Proxy + Sinric Pro</span>
        </footer>
      </div>
    </div>
  );
}