import { FlaskConical, Hospital, ScanLine, Siren, Stethoscope, type LucideIcon } from "lucide-react";
import type { TipoPrestador } from "@/lib/types";

/** Ícone, cor e rótulos de cada tipo de prestador (usados no mapa e nos filtros). */
export const TIPO_META: Record<TipoPrestador, { icon: LucideIcon; cor: string; plural: string }> = {
  Hospital: { icon: Hospital, cor: "#dc2626", plural: "Hospitais" },
  "Pronto atendimento": { icon: Siren, cor: "#ea580c", plural: "Pronto atendimento" },
  Laboratório: { icon: FlaskConical, cor: "#7c3aed", plural: "Laboratórios" },
  Imagem: { icon: ScanLine, cor: "#0284c7", plural: "Imagem" },
  Clínica: { icon: Stethoscope, cor: "#059669", plural: "Clínicas" },
};
