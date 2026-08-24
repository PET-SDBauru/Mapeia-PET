// ==============================================================================
// COMPONENTE DE MAPA INTERATIVO (LEAFLET CORRIGIDO E OTIMIZADO)
// PET-Saúde Digital - Renderização Robusta sem Telas Cinzas ou Erros de Marcador
// ==============================================================================

import React, { useEffect, useRef } from "react";
import { type HealthUnit } from "../data/ubsAgudos";

interface MapComponentProps {
  units: HealthUnit[];
  selectedUnitId: string;
  onSelectUnit: (unit: HealthUnit) => void;
  className?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
  className = "w-full h-full min-h-[380px]"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const selectedUnitIdRef = useRef(selectedUnitId);

  // Manter ref sincronizada para callbacks sem recriar ouvintes
  useEffect(() => {
    selectedUnitIdRef.current = selectedUnitId;
  }, [selectedUnitId]);

  // Efeito principal: Inicialização e Gerenciamento do Ciclo de Vida do Leaflet
  useEffect(() => {
    let isSubscribed = true;

    // 1. Garantir que o CSS do Leaflet esteja no <head>
    if (!document.getElementById("leaflet-core-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-core-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadAndInitLeaflet = () => {
      const L = (window as any).L;
      if (!L || !containerRef.current || !isSubscribed) return;

      // Se o container já possuir um mapa Leaflet anexado internamente, limpar
      if (containerRef.current.classList.contains("leaflet-container")) {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        } catch {}
      }

      // Definir ponto central (Agudos-SP)
      const defaultCenter: [number, number] = [-22.4694, -48.9863];

      // Inicializar mapa
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true
      });

      mapInstanceRef.current = map;

      // Adicionar camada de mapa (CartoDB Positron / OSM para visual moderno e limpo)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        subdomains: "abcd"
      }).addTo(map);

      // Função auxiliar para gerar ícone SVG customizado
      const createCustomIcon = (unit: HealthUnit, isSelected: boolean) => {
        const stressColor = 
          unit.stressLevel === "CRÍTICO" ? "#dc2626" :
          unit.stressLevel === "ALTO" ? "#ea580c" :
          unit.stressLevel === "MODERADO" ? "#eab308" : "#16a34a";

        const bgClass = isSelected
          ? "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-500/40 shadow-xl scale-125"
          : "bg-gradient-to-tr from-blue-700 to-cyan-600 ring-2 ring-white/90 shadow-md hover:scale-110";

        const typeBadge = unit.type === "UPA" ? "UPA" : unit.type === "CENTRO_SAUDE" ? "CS" : "ESF";

        return L.divIcon({
          className: "custom-health-pin",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${bgClass} w-8 h-8 rounded-full text-white font-bold">
              <span class="text-[9px] tracking-tight font-black">${typeBadge}</span>
              ${isSelected ? `<span class="absolute -top-1 -right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>` : ""}
              <div class="absolute -bottom-1 w-1.5 h-1.5 bg-inherit rotate-45"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
      };

      // Limpar marcadores anteriores
      markersRef.current.clear();

      // Plotar todas as unidades de saúde
      units.forEach((unit) => {
        const isSelected = unit.id === selectedUnitIdRef.current;
        const icon = createCustomIcon(unit, isSelected);

        const marker = L.marker([unit.coordinates.lat, unit.coordinates.lon], { icon })
          .addTo(map)
          .bindTooltip(`
            <div class="px-1 py-0.5 text-xs font-semibold text-slate-800">
              <div class="font-bold text-blue-700">${unit.shortName}</div>
              <div class="text-[10px] text-slate-500">${unit.neighborhood}</div>
            </div>
          `, { direction: "top", offset: [0, -28] });

        // Popup completo com detalhes ao clicar
        const popupContent = document.createElement("div");
        popupContent.className = "p-2 max-w-[240px] text-slate-800";
        popupContent.innerHTML = `
          <div class="font-bold text-xs text-blue-900 border-b pb-1 mb-1">${unit.name}</div>
          <p class="text-[10px] text-slate-600 mb-1">📍 ${unit.address} - ${unit.neighborhood}</p>
          <p class="text-[10px] text-slate-600 mb-1">📞 ${unit.phone}</p>
          <div class="flex items-center gap-1 mt-1 mb-2">
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${
              unit.stressLevel === "CRÍTICO" ? "bg-red-100 text-red-700" :
              unit.stressLevel === "ALTO" ? "bg-orange-100 text-orange-700" :
              unit.stressLevel === "MODERADO" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-700"
            }">
              Estresse: ${unit.stressLevel} (${unit.stressScore}/100)
            </span>
          </div>
          <button id="btn-select-${unit.id}" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 px-2 rounded shadow-sm transition-colors">
            Selecionar Unidade
          </button>
        `;

        marker.bindPopup(popupContent);

        // Ouvinte no botão interno do popup
        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-select-${unit.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectUnit(unit);
              map.closePopup();
            };
          }
        });

        // Clique no próprio marcador
        marker.on("click", () => {
          onSelectUnit(unit);
        });

        markersRef.current.set(unit.id, marker);
      });

      // Se houver uma unidade selecionada de início, centrar nela
      const currentSelected = units.find((u) => u.id === selectedUnitIdRef.current);
      if (currentSelected) {
        map.setView([currentSelected.coordinates.lat, currentSelected.coordinates.lon], 14);
      }

      // Redimensionamento responsivo para evitar telas cinzas
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      // Pequeno timeout de segurança para forçar recalculação do layout
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);

      return () => {
        resizeObserver.disconnect();
      };
    };

    // 2. Carregar o script JS do Leaflet dinamicamente caso não exista
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (isSubscribed) loadAndInitLeaflet();
      };
      document.head.appendChild(script);
    } else {
      loadAndInitLeaflet();
    }

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch {}
      }
    };
  }, [units]);

  // Efeito para atualizar marcadores e centrar quando selectedUnitId mudar
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Atualizar visual dos marcadores
    units.forEach((unit) => {
      const marker = markersRef.current.get(unit.id);
      if (!marker) return;

      const isSelected = unit.id === selectedUnitId;
      const typeBadge = unit.type === "UPA" ? "UPA" : unit.type === "CENTRO_SAUDE" ? "CS" : "ESF";

      const bgClass = isSelected
        ? "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-500/40 shadow-xl scale-125 z-50"
        : "bg-gradient-to-tr from-blue-700 to-cyan-600 ring-2 ring-white/90 shadow-md hover:scale-110";

      const newIcon = L.divIcon({
        className: "custom-health-pin",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${bgClass} w-8 h-8 rounded-full text-white font-bold">
            <span class="text-[9px] tracking-tight font-black">${typeBadge}</span>
            ${isSelected ? `<span class="absolute -top-1 -right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>` : ""}
            <div class="absolute -bottom-1 w-1.5 h-1.5 bg-inherit rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      marker.setIcon(newIcon);
      if (isSelected) {
        marker.setZIndexOffset(1000);
      } else {
        marker.setZIndexOffset(0);
      }
    });

    // Focar suavemente na unidade selecionada
    const target = units.find((u) => u.id === selectedUnitId);
    if (target) {
      map.setView([target.coordinates.lat, target.coordinates.lon], 14, {
        animate: true,
        duration: 0.7
      });
    }
  }, [selectedUnitId, units]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-inner border border-slate-200 ${className}`}>
      {/* Container Leaflet */}
      <div ref={containerRef} className="w-full h-full min-h-[380px] z-0" />

      {/* Legenda Flutuante */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 z-[400] pointer-events-auto text-xs">
        <p className="font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          Rede de Saúde de Agudos-SP ({units.length} Unidades)
        </p>
        <div className="space-y-1 text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-300"></span>
            <span>Unidade Selecionada (Destaque)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>UBS / ESF / UPA Municipal</span>
          </div>
        </div>
      </div>

      {/* Botão de Centralizar Geral */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([-22.4694, -48.9863], 13, { animate: true });
          }
        }}
        className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-md border border-slate-200 z-[400] transition-colors flex items-center gap-1.5"
        title="Ver todo o município de Agudos"
      >
        <span>🗺️</span> Visão Geral de Agudos
      </button>
    </div>
  );
};
