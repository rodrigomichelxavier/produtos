"use client";

import { Download, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation, Trash2, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ProdutoCapa } from "@/components/produto";
import { Badge, Modal, PageHeader, Tabs, Vazio } from "@/components/ui";
import { dataBR } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import type { CategoriaMaterial, Material } from "@/lib/types";

const CATEGORIAS = ["Uso interno", "Uso externo", "Lâminas", "Tabelas de preço"] as const satisfies readonly CategoriaMaterial[];
const ICONES: Record<Material["formato"], typeof FileText> = {
  PDF: FileText, PNG: FileImage, JPG: FileImage, PPTX: Presentation, XLSX: FileSpreadsheet, MP4: FileVideo, DOCX: FileText,
};

export default function Page() {
  return <Suspense><Materiais /></Suspense>;
}

function baixar(m: Material) {
  const a = document.createElement("a");
  if (m.dataUrl) {
    a.href = m.dataUrl;
    a.download = m.arquivo;
  } else {
    const conteudo = `MATERIAL FICTÍCIO — PROTÓTIPO\n\n${m.titulo}\nCategoria: ${m.categoria}\nVersão: ${m.versao}\nFormato original: ${m.formato}\n`;
    a.href = URL.createObjectURL(new Blob([conteudo], { type: "text/plain;charset=utf-8" }));
    a.download = m.arquivo.replace(/\.\w+$/, ".txt");
  }
  a.click();
}

function Materiais() {
  const produtos = useStore((s) => s.produtos);
  const materiais = useStore((s) => s.materiais);
  const remover = useStore((s) => s.removerMaterial);
  const perm = usePermissoes();
  const [produtoId, setProdutoId] = useState(useSearchParams().get("produto") ?? produtos[0]?.id ?? "");
  const [cat, setCat] = useState<CategoriaMaterial>("Uso interno");
  const [upload, setUpload] = useState(false);
  const produto = produtos.find((p) => p.id === produtoId);
  const doProduto = materiais.filter((m) => m.produtoId === produtoId);
  const lista = doProduto.filter((m) => m.categoria === cat);
  const contagem = Object.fromEntries(CATEGORIAS.map((c) => [c, doProduto.filter((m) => m.categoria === c).length]));

  return (
    <>
      <PageHeader
        titulo="Materiais"
        subtitulo="Kit de comunicação de cada produto"
        acoes={perm.enviarMateriais && produto && (
          <button className="btn-primary" onClick={() => setUpload(true)}><Upload size={16} /> Enviar material</button>
        )}
      />

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-4">
        {produto && <div className="w-24"><ProdutoCapa produto={produto} altura={60} /></div>}
        <div className="min-w-64 flex-1">
          <label className="label">Produto</label>
          <select className="input" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0">
        <div className="px-4 pt-2"><Tabs abas={CATEGORIAS} ativa={cat} onChange={setCat} contagem={contagem} /></div>
        <div className="p-6">
          {cat === "Uso interno" && (
            <p className="mb-4 text-xs text-gray-500">Material de uso interno: não deve ser compartilhado com clientes ou corretores externos.</p>
          )}
          {lista.length === 0 ? (
            <Vazio texto="Nenhum material nesta categoria." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {lista.map((m) => {
                const Icon = ICONES[m.formato];
                return (
                  <div key={m.id} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:border-brand-300">
                    <div className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon size={24} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-gray-900">{m.titulo}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <Badge>{m.formato}</Badge>
                        <span>v{m.versao}</span>
                        <span>{m.tamanhoKB >= 1024 ? `${(m.tamanhoKB / 1024).toFixed(1)} MB` : `${m.tamanhoKB} KB`}</span>
                        <span>atualizado em {dataBR(m.atualizadoEm)}</span>
                      </div>
                    </div>
                    <button className="btn-outline px-3" onClick={() => baixar(m)} title="Baixar"><Download size={16} /></button>
                    {perm.moderar && (
                      <button className="px-1 text-red-500" onClick={() => confirm("Remover material?") && remover(m.id)} title="Remover">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {produto && <ModalUpload aberto={upload} onClose={() => setUpload(false)} produtoId={produto.id} categoria={cat} />}
    </>
  );
}

function ModalUpload({ aberto, onClose, produtoId, categoria }: {
  aberto: boolean; onClose: () => void; produtoId: string; categoria: CategoriaMaterial;
}) {
  const adicionar = useStore((s) => s.adicionarMaterial);
  const [cat, setCat] = useState<CategoriaMaterial>(categoria);
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const enviar = () => {
    if (!arquivo || !titulo) return;
    const ext = (arquivo.name.split(".").pop() ?? "pdf").toUpperCase();
    const formato = (["PDF", "PNG", "JPG", "PPTX", "XLSX", "MP4", "DOCX"].includes(ext) ? ext : "PDF") as Material["formato"];
    const finalizar = (dataUrl?: string) => {
      adicionar({ produtoId, categoria: cat, titulo, arquivo: arquivo.name, formato, tamanhoKB: Math.max(1, Math.round(arquivo.size / 1024)), dataUrl });
      setTitulo(""); setArquivo(null); onClose();
    };
    // Na demo, arquivos pequenos ficam guardados no navegador para permitir o download.
    if (arquivo.size < 1.5 * 1024 * 1024) {
      const r = new FileReader();
      r.onload = () => finalizar(String(r.result));
      r.readAsDataURL(arquivo);
    } else finalizar();
  };

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Enviar material">
      <div className="space-y-4">
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategoriaMaterial)}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Título</label>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Lâmina de vendas 2027" />
          <p className="mt-1 text-xs text-gray-400">Use o mesmo título de um material existente para publicar uma nova versão.</p>
        </div>
        <div>
          <label className="label">Arquivo</label>
          <button className="btn-outline w-full" onClick={() => ref.current?.click()}>
            <Upload size={16} /> {arquivo ? arquivo.name : "Selecionar arquivo"}
          </button>
          <input ref={ref} type="file" className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!arquivo || !titulo} onClick={enviar}>Enviar</button>
        </div>
      </div>
    </Modal>
  );
}
