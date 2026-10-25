import React, { useState } from 'react';
import { 
  Key, 
  Cpu, 
  Sliders, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  X, 
  Zap, 
  ExternalLink, 
  RefreshCw,
  Search
} from 'lucide-react';
import { AdminSettings, OpenRouterModelInfo } from '../types';
import { CURATED_MODELS, testOpenRouterKey, fetchLiveOpenRouterModels } from '../services/openrouter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (newSettings: AdminSettings) => void;
  onResetAllData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  onUpdateAdminSettings,
  onResetAllData,
}) => {
  const [apiKey, setApiKey] = useState(adminSettings.openRouterApiKey);
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(adminSettings.customDefaultModel);
  const [customModelInput, setCustomModelInput] = useState('');
  const [temperature, setTemperature] = useState(adminSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(adminSettings.maxTokens);
  const [topP, setTopP] = useState(adminSettings.topP);

  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  const [modelSearch, setModelSearch] = useState('');
  const [availableModels, setAvailableModels] = useState<OpenRouterModelInfo[]>(CURATED_MODELS);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    const res = await testOpenRouterKey(apiKey);
    setTestingKey(false);
    setTestResult(res);
  };

  const handleFetchLiveModels = async () => {
    setFetchingModels(true);
    const models = await fetchLiveOpenRouterModels(apiKey);
    setAvailableModels(models);
    setFetchingModels(false);
  };

  const handleSave = () => {
    const finalModel = customModelInput.trim() ? customModelInput.trim() : selectedModel;
    onUpdateAdminSettings({
      ...adminSettings,
      openRouterApiKey: apiKey.trim(),
      customDefaultModel: finalModel,
      temperature,
      maxTokens,
      topP,
    });
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 800);
  };

  const filteredModels = availableModels.filter(
    (m) =>
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(modelSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">API & Engine Configuration</h2>
              <p className="text-xs text-neutral-400">Configure OpenRouter authentication and custom default model routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* OpenRouter API Key Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>OpenRouter API Key</span>
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Get an OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="sk-or-v1-..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none font-mono pr-24"
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || !apiKey.trim()}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {testingKey ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                  <span>Test</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.valid
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {testResult.valid ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Custom Default Model Selection */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Custom Default Model</span>
              </label>
              <button
                type="button"
                onClick={handleFetchLiveModels}
                disabled={fetchingModels}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} />
                <span>Refresh Live Models</span>
              </button>
            </div>

            {/* Custom Model Input */}
            <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 space-y-1.5">
              <span className="text-[11px] font-medium text-neutral-400">Custom Model Identifier:</span>
              <input
                type="text"
                value={customModelInput || selectedModel}
                onChange={(e) => {
                  setCustomModelInput(e.target.value);
                  setSelectedModel(e.target.value);
                }}
                placeholder="e.g. meta-llama/llama-3.3-70b-instruct or anthropic/claude-3.5-sonnet"
                className="w-full bg-neutral-900 border border-neutral-750 focus:border-sky-400 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 outline-none"
              />
              <p className="text-[10px] text-neutral-500">
                You can specify any valid model hosted on OpenRouter.ai
              </p>
            </div>

            {/* Curated list & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Filter curated models..."
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-neutral-700"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredModels.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setCustomModelInput(m.id);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/40 text-neutral-100'
                          : 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-850/60 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-200">{m.name}</span>
                          {m.pricing && (
                            <span className="text-[10px] font-mono text-neutral-500">
                              {m.pricing.prompt}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono truncate">{m.id}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hyperparameters */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Generation Parameters</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Global Temperature</span>
                  <span className="font-mono text-neutral-200 tabular-nums">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Max Tokens */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Max Tokens</span>
                  <span className="font-mono text-neutral-200 tabular-nums">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Reset / Clear Data */}
          {onResetAllData && (
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Reset Local Conversations</p>
                <p className="text-[11px] text-neutral-600">Clears conversation history while keeping your characters intact</p>
              </div>
              <button
                type="button"
                onClick={onResetAllData}
                className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
              >
                Clear Chats
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            {saveToast && (
              <span className="text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
                <Check className="w-3.5 h-3.5" /> Settings saved successfully
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
