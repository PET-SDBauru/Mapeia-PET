// ==============================================================================
// MODAL DE CONFIGURAÇÃO DE IA E SELETOR DE CHAVES GRATUITAS / PROVEDORES
// PET-Saúde Digital - Suporte a Gemini Free Tier, Groq, OpenRouter, Ollama e Fallback
// ==============================================================================

import React, { useState } from "react";
import { 
  Key, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  X, 
  Server, 
  ShieldCheck, 
  Cpu 
} from "lucide-react";
import { 
  type AiConfig, 
  type AiProvider, 
  PROVIDER_MODELS, 
  saveAiConfig, 
  testAiConnection 
} from "../services/aiService";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AiConfig;
  onSave: (newConfig: AiConfig) => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave
}) => {
  const [config, setConfig] = useState<AiConfig>({ ...currentConfig });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiProvider) => {
    const defaultModel = PROVIDER_MODELS[provider][0]?.id || "";
    setConfig((prev) => ({
      ...prev,
      provider,
      model: defaultModel
    }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Erro de conexão." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveAiConfig(config);
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Configurações de IA & Provedores</h3>
              <p className="text-[11px] text-blue-100">Selecione opções gratuitas ou adicione sua própria chave de API</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          
          {/* Seletor de Provedor */}
          <div>
            <label className="block text-slate-700 font-bold mb-2 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" /> Provedor de Inteligência Artificial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "gemini" as AiProvider, name: "Google Gemini", badge: "Free Tier", icon: "✨" },
                { id: "groq" as AiProvider, name: "Groq Cloud", badge: "Ultra-Rápido", icon: "⚡" },
                { id: "openrouter" as AiProvider, name: "OpenRouter", badge: "Modelos Free", icon: "🌐" },
                { id: "ollama" as AiProvider, name: "Ollama Local", badge: "100% Offline", icon: "💻" },
                { id: "fallback" as AiProvider, name: "Motor Local", badge: "Zero Custo", icon: "🛡️" }
              ].map((prov) => {
                const active = config.provider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderChange(prov.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      active 
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-blue-900" 
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{prov.icon}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {prov.badge}
                      </span>
                    </div>
                    <span className="font-bold text-[11px] mt-1">{prov.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Links e Orientações para Chaves Gratuitas */}
          {config.provider === "gemini" && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900 leading-relaxed">
                <strong>Google AI Studio (Gratuito):</strong> Você pode gerar uma chave gratuita diretamente no portal de desenvolvedores do Google com limite generoso de requisições.
                <div className="mt-1">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-700 underline font-bold inline-flex items-center gap-1 hover:text-blue-800"
                  >
                    Obter Chave Gratuita no Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {config.provider === "groq" && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Groq Cloud (Tier Gratuito):</strong> Oferece inferência ultra-rápida (Llama 3.3 70B e Mixtral) sem custos iniciais.
                <div className="mt-1">
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-amber-800 underline font-bold inline-flex items-center gap-1 hover:text-amber-900"
                  >
                    Obter Chave Gratuita no Groq Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {config.provider === "openrouter" && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-purple-900 leading-relaxed">
                <strong>OpenRouter:</strong> Dá acesso a dezenas de modelos de código aberto gratuitos (terminados em <code>:free</code>).
                <div className="mt-1">
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-purple-800 underline font-bold inline-flex items-center gap-1 hover:text-purple-900"
                  >
                    Gerar Chave no OpenRouter <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {config.provider === "fallback" && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-900 leading-relaxed">
                <strong>Motor Heurístico PET-Saúde:</strong> Não necessita de chave de API nem conexão externa com a internet. Executa uma análise algorítmica profunda baseada nas respostas de cada UBS de Agudos-SP.
              </div>
            </div>
          )}

          {/* Campo de API Key (quando aplicável) */}
          {config.provider !== "fallback" && config.provider !== "ollama" && (
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Chave de API ({config.provider.toUpperCase()})
                </span>
                {config.apiKey ? (
                  <span className="text-green-600 text-[10px] font-bold">Chave Inserida</span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Opcional (Fallback Ativo)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => {
                    setConfig({ ...config, apiKey: e.target.value });
                    setTestResult(null);
                  }}
                  placeholder={`Insira sua API Key do ${config.provider.toUpperCase()}...`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* URL do Ollama (caso selecionado) */}
          {config.provider === "ollama" && (
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wide">
                URL do Servidor Ollama Local
              </label>
              <input
                type="text"
                value={config.ollamaUrl || "http://localhost:11434"}
                onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>
          )}

          {/* Seletor de Modelo */}
          {config.provider !== "fallback" && (
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wide">
                Modelo Selecionado
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {PROVIDER_MODELS[config.provider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status do Teste de Conexão */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
              testResult.success 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

        </div>

        {/* Footer com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {config.provider !== "fallback" ? (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {testing ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Server className="w-3.5 h-3.5" />
              )}
              {testing ? "Testando..." : "Testar Conexão"}
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Salvar Configurações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
