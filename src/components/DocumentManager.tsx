// ==============================================================================
// GESTOR DE DOCUMENTOS & EVIDÊNCIAS DE SAÚDE DIGITAL (FIREBASE STORAGE + FIRESTORE)
// PET-Saúde Digital - Upload de Fotos, Fichas de Papel, Prints e Metadados
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FolderOpen, 
  Plus, 
  Cloud, 
  HardDrive, 
  Filter 
} from "lucide-react";
import { 
  type DocumentMetadata, 
  getDocuments, 
  uploadDocumentToFirebase, 
  deleteDocument, 
  isFirebaseConfigured 
} from "../services/firebase";
import { type HealthUnit } from "../data/ubsAgudos";

interface DocumentManagerProps {
  currentUnit: HealthUnit;
  allUnits: HealthUnit[];
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  currentUnit,
  allUnits
}) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterUbsId, setFilterUbsId] = useState<string>(currentUnit.id);
  
  // Estados do formulário de upload
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentMetadata["category"]>("PRONTUARIO_EVIDENCIA");
  const [description, setDescription] = useState<string>("");
  const [uploadedBy, setUploadedBy] = useState<string>("Pesquisador PET-Saúde");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar lista de documentos quando o filtro mudar
  useEffect(() => {
    loadDocs();
  }, [filterUbsId]);

  // Sincronizar filtro quando mudar a unidade selecionada na tela principal
  useEffect(() => {
    setFilterUbsId(currentUnit.id);
  }, [currentUnit.id]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments(filterUbsId);
      setDocuments(docs);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError("");
      setUploadSuccess("");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Selecione um arquivo para enviar.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setUploadSuccess("");

    try {
      const targetUnit = allUnits.find((u) => u.id === filterUbsId) || currentUnit;
      
      const newDoc = await uploadDocumentToFirebase({
        file: selectedFile,
        ubsId: targetUnit.id,
        ubsName: targetUnit.name,
        category,
        description: description || `Evidência coletada na ${targetUnit.shortName}`,
        uploadedBy: uploadedBy || "Equipe PET-Saúde",
        onProgress: (p) => setUploadProgress(p)
      });

      setUploadSuccess(`Documento "${newDoc.fileName}" salvo com sucesso!`);
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Recarrega a lista
      await loadDocs();

      // Fechar modal após 1.5s
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess("");
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || "Erro ao realizar upload do arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docItem: DocumentMetadata) => {
    if (window.confirm(`Tem certeza que deseja excluir "${docItem.fileName}"?`)) {
      try {
        await deleteDocument(docItem);
        setDocuments((prev) => prev.filter((d) => d.id !== docItem.id));
      } catch (err) {
        console.error("Erro ao deletar documento:", err);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadge = (cat: DocumentMetadata["category"]) => {
    switch (cat) {
      case "FOTO_EQUIPAMENTO":
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Foto Equipamento</span>;
      case "PRONTUARIO_EVIDENCIA":
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Ficha / Prontuário</span>;
      case "RELATORIO_TECNICO":
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Relatório PET</span>;
      case "PRINT_ESUS":
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Print e-SUS</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Documento</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner de Integração Firebase */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              Repositório de Evidências & Documentos
            </h3>
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Cloud className="w-3 h-3 text-emerald-500" /> Firebase Storage & Firestore Ativos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <HardDrive className="w-3 h-3 text-blue-500" /> Armazenamento Local Seguro (Ativo)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Anexe fotos de fichas manuais, relatórios do PET-Saúde e capturas de tela das UBSs de Agudos-SP.
          </p>
        </div>

        {/* Botão para abrir formulário de envio */}
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Anexar Nova Evidência
        </button>
      </div>

      {/* Formulário Retrátil de Upload */}
      {showUploadForm && (
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-md animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-black uppercase text-blue-900 mb-4 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-600" /> Enviar Arquivo para a UBS Selecionada
          </h4>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Unidade Alvo */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Unidade Básica de Saúde
                </label>
                <select
                  value={filterUbsId}
                  onChange={(e) => setFilterUbsId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {allUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Categoria do Documento
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PRONTUARIO_EVIDENCIA">Ficha Física / Prontuário em Papel</option>
                  <option value="FOTO_EQUIPAMENTO">Foto de Infraestrutura / Computador</option>
                  <option value="PRINT_ESUS">Captura de Tela (Lentidão / Erro e-SUS)</option>
                  <option value="RELATORIO_TECNICO">Relatório Técnico PET-Saúde</option>
                  <option value="OUTRO">Outro Documento</option>
                </select>
              </div>

              {/* Upload do Arquivo */}
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Arquivo (PDF, Imagem, Excel, Word - até 15MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  className="w-full text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Descrição / Observações da Coleta
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Foto do lote de fichas manuais acumuladas no período da tarde..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Pesquisador / Responsável pelo Envio
                </label>
                <input
                  type="text"
                  value={uploadedBy}
                  onChange={(e) => setUploadedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

            </div>

            {/* Barra de Progresso */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                  <span>Enviando para o Firebase...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Feedback */}
            {uploadSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                {uploadSuccess}
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            {/* Botões */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" /> {isUploading ? "Enviando..." : "Confirmar Envio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtro por UBS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Filtrar Documentos por UBS:</span>
        </div>
        <select
          value={filterUbsId}
          onChange={(e) => setFilterUbsId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
        >
          <option value="todas">Todas as Unidades de Agudos ({allUnits.length})</option>
          {allUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.shortName} ({u.neighborhood})
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Documentos */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-medium">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Carregando documentos da base...
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">Nenhum documento anexado para esta seleção.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Clique no botão acima para adicionar a primeira evidência ou foto para a unidade selecionada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((docItem) => {
            const isImage = docItem.fileType.startsWith("image/") || docItem.fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i);
            
            return (
              <div 
                key={docItem.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Preview de imagem se for foto */}
                {isImage && (
                  <div className="h-36 bg-slate-100 overflow-hidden relative group">
                    <img 
                      src={docItem.fileUrl} 
                      alt={docItem.fileName} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={docItem.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white transition-colors"
                        title="Abrir em tamanho real"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Dados do Documento */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {getCategoryBadge(docItem.category)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(docItem.fileSize)}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs line-clamp-1" title={docItem.fileName}>
                      {docItem.fileName}
                    </h5>

                    <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                      📍 {docItem.ubsName}
                    </p>

                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {docItem.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Por: {docItem.uploadedBy.split(" ")[0]}</span>
                    <span>{new Date(docItem.uploadedAt).toLocaleDateString("pt-BR")}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={docItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver Arquivo
                    </a>
                    <button
                      onClick={() => handleDelete(docItem)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
