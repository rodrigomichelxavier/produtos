"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Prestador, Produto, Unidade } from "@/lib/types";
import { TIPO_META } from "./rede-meta";

export type Ponto = { u: Unidade; p: Prestador };

const CENTRO_REGIAO: [number, number] = [-22.84, -47.11];

const iconeCache = new Map<string, L.DivIcon>();
function iconePara(p: Prestador): L.DivIcon {
  const chave = `${p.tipo}|${p.destaque ? 1 : 0}`;
  const pronto = iconeCache.get(chave);
  if (pronto) return pronto;
  const { icon: Icon, cor } = TIPO_META[p.tipo];
  const svg = renderToStaticMarkup(<Icon size={15} strokeWidth={2.2} color={cor} />);
  const icone = L.divIcon({
    className: "pino-rede",
    html: `<div class="pino ${p.destaque ? "pino-destaque" : ""}" style="--cor:${cor}">${svg}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [0, -16],
    popupAnchor: [0, -16],
  });
  iconeCache.set(chave, icone);
  return icone;
}

function enquadrar(map: L.Map, pontos: Ponto[], animar: boolean) {
  if (!pontos.length) return;
  if (pontos.length === 1) {
    map.setView([pontos[0].u.lat, pontos[0].u.lng], 14, { animate: animar });
    return;
  }
  const b = L.latLngBounds(pontos.map((x) => [x.u.lat, x.u.lng] as [number, number]));
  // deixa espaço para o painel de filtros no topo
  const opcoes = { paddingTopLeft: [60, 230] as L.PointTuple, paddingBottomRight: [60, 50] as L.PointTuple, maxZoom: 13 };
  if (animar) map.flyToBounds(b, { ...opcoes, duration: 0.7 });
  else map.fitBounds(b, opcoes);
}

/**
 * Enquadra os pontos quando o filtro muda e também quando a área do mapa muda de tamanho
 * (ex.: menu lateral recolhido/expandido) — sem isso o Leaflet calcula o zoom com o tamanho antigo.
 */
function Enquadrar({ pontos, chave }: { pontos: Ponto[]; chave: string }) {
  const map = useMap();
  const ref = useRef(pontos);
  ref.current = pontos;

  useEffect(() => {
    map.invalidateSize();
    enquadrar(map, ref.current, true);
  }, [chave, map]);

  useEffect(() => {
    let t: number | undefined;
    const obs = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        map.invalidateSize();
        enquadrar(map, ref.current, false);
      }, 120);
    });
    obs.observe(map.getContainer());
    return () => { obs.disconnect(); window.clearTimeout(t); };
  }, [map]);
  return null;
}

/**
 * Mapa base sem chave de API: Esri "Light/Dark Gray Canvas" (limpo, em tons de cinza) com a camada de nomes.
 * Se os blocos falharem, cai automaticamente para o OpenStreetMap.
 */
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
const ATRIB_ESRI = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap";
const ATRIB_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function MapaBase({ escuro }: { escuro: boolean }) {
  const [fonte, setFonte] = useState<"esri" | "osm">("esri");
  const erros = useRef(0);
  const tom = escuro ? "Dark" : "Light";
  const aoErrar = () => {
    erros.current += 1;
    if (erros.current > 6 && fonte === "esri") setFonte("osm");
  };
  if (fonte === "osm")
    return (
      <TileLayer
        key={`osm-${escuro}`}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={ATRIB_OSM}
        maxZoom={19}
        className={escuro ? "osm-escuro" : "osm-claro"}
      />
    );
  return (
    <>
      <TileLayer
        key={`base-${tom}`}
        url={`${ESRI}/World_${tom}_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
        attribution={ATRIB_ESRI}
        maxNativeZoom={16}
        maxZoom={19}
        eventHandlers={{ tileerror: aoErrar }}
      />
      <TileLayer
        key={`ref-${tom}`}
        url={`${ESRI}/World_${tom}_Gray_Reference/MapServer/tile/{z}/{y}/{x}`}
        maxNativeZoom={16}
        maxZoom={19}
      />
    </>
  );
}

export default function MapaRede({ pontos, produtos, escuro }: { pontos: Ponto[]; produtos: Produto[]; escuro: boolean }) {
  const chave = useMemo(() => pontos.map((x) => x.u.id).join(","), [pontos]);

  return (
    <MapContainer center={CENTRO_REGIAO} zoom={10} zoomControl={false} className="h-full w-full" attributionControl>
      <MapaBase escuro={escuro} />
      <Enquadrar pontos={pontos} chave={chave} />
      {pontos.map(({ u, p }) => {
        const meta = TIPO_META[p.tipo];
        const noPortfolio = produtos.filter((x) => x.rede.includes(p.id));
        return (
          <Marker key={u.id} position={[u.lat, u.lng]} icon={iconePara(p)}>
            <Tooltip direction="top" className="bandeira" opacity={1}>
              <span className="bandeira-tipo" style={{ color: meta.cor }}>{p.tipo}</span>
              <strong>{p.nome}</strong>
              <span className="bandeira-local">{u.bairro} · {u.cidade}</span>
            </Tooltip>
            <Popup className="popup-rede" closeButton={false} autoPanPaddingTopLeft={[20, 240]} autoPanPaddingBottomRight={[20, 40]}>
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: meta.cor }}>{p.tipo}</div>
              <div className="text-sm font-bold text-gray-900">{p.nome}</div>
              <div className="text-xs text-gray-500">{u.bairro} · {u.cidade}/{u.uf}{u.cnes ? ` · CNES ${u.cnes}` : ""}</div>
              {p.unidades.length > 1 && <div className="mt-1 text-xs text-gray-500">{p.unidades.length} unidades na região</div>}
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Na rede de {noPortfolio.length} produto(s)</div>
              <div className="mt-1 flex max-w-[240px] flex-wrap gap-1">
                {noPortfolio.slice(0, 8).map((x) => (
                  <Link key={x.id} href={`/produto/?id=${x.id}`} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-200">
                    {x.nome.replace(/^Aurora\s+/, "")}
                  </Link>
                ))}
                {noPortfolio.length > 8 && <span className="text-[11px] text-gray-400">+{noPortfolio.length - 8}</span>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
