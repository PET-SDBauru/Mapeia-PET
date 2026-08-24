// ==============================================================================
// FIREBASE SERVICES (AUTHENTICATION, FIRESTORE & STORAGE)
// PET-Saúde Digital - Integração Completa com Suporte a Nuvem e Fallback Offline
// ==============================================================================

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  type Firestore 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  type FirebaseStorage 
} from "firebase/storage";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from "firebase/auth";

export interface DocumentMetadata {
  id: string;
  ubsId: string;
  ubsName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  fileType: string;
  category: "FOTO_EQUIPAMENTO" | "PRONTUARIO_EVIDENCIA" | "RELATORIO_TECNICO" | "PRINT_ESUS" | "OUTRO";
  description: string;
  uploadedBy: string;
  uploadedAt: string; // ISO string
  isMock?: boolean;
}

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  isMock: boolean;
}

// Configuração obtida das variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Verifica se as credenciais mínimas do Firebase foram configuradas
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "your_firebase_api_key_here" &&
  firebaseConfig.projectId !== "your_project_id"
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("[Firebase] SDK Inicializado no projeto:", firebaseConfig.projectId);
  } catch (error) {
    console.warn("[Firebase] Erro ao inicializar SDK. Ativando modo local resiliente:", error);
    app = null;
    db = null;
    storage = null;
    auth = null;
  }
} else {
  console.info("[Firebase] Credenciais em nuvem ausentes no .env. Executando em modo local seguro.");
}

// ==============================================================================
// 1. SERVIÇOS DE AUTENTICAÇÃO (FIREBASE AUTH)
// ==============================================================================

const MOCK_AUTH_STORAGE_KEY = "pet_saude_auth_session_v1";

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserSession> {
  if (auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split("@")[0],
        isAnonymous: false,
        isMock: false
      };
    } catch (err: any) {
      console.warn("[Firebase Auth] Falha no login oficial:", err.message);
    }
  }

  // Fallback / Login local para demonstração
  if ((email === "admin@pet-saude.sp" || email === "admin") && (pass === "pet123" || pass === "admin")) {
    const mockUser: UserSession = {
      uid: "mock-pet-admin-01",
      email: "admin@pet-saude.sp",
      displayName: "Coordenador PET-Saúde",
      isAnonymous: false,
      isMock: true
    };
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  }

  throw new Error("Credenciais inválidas. Para modo local use: admin / pet123");
}

export async function loginAnonymouslyUser(): Promise<UserSession> {
  if (auth) {
    try {
      const cred = await signInAnonymously(auth);
      return {
        uid: cred.user.uid,
        email: null,
        displayName: "Pesquisador Convidado",
        isAnonymous: true,
        isMock: false
      };
    } catch (err: any) {
      console.warn("[Firebase Auth] Falha em login anônimo:", err.message);
    }
  }

  const mockUser: UserSession = {
    uid: `guest-${Date.now()}`,
    email: null,
    displayName: "Pesquisador Convidado (Local)",
    isAnonymous: true,
    isMock: true
  };
  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  return mockUser;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
  localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}

export function getCurrentSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function onAuthListener(callback: (session: UserSession | null) => void): () => void {
  if (auth) {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "Pesquisador",
          isAnonymous: user.isAnonymous,
          isMock: false
        });
      } else {
        const local = getCurrentSession();
        callback(local);
      }
    });
  }

  // Se não houver Firebase Auth, checa sessão local
  callback(getCurrentSession());
  return () => {};
}

// ==============================================================================
// 2. SERVIÇOS DE STORAGE & FIRESTORE (UPLOAD & PERSISTÊNCIA DE METADADOS)
// ==============================================================================

const LOCAL_STORAGE_DOCS_KEY = "pet_saude_documents_metadata_v1";

const getLocalDocuments = (): DocumentMetadata[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
    if (!raw) {
      const initialDocs: DocumentMetadata[] = [
        {
          id: "doc-init-1",
          ubsId: "ubs-central-dom-boscolo",
          ubsName: "UBS Central - Centro de Saúde Dr. Domingos Bôscolo",
          fileName: "Relatorio_Fluxo_Triagem_eSUS.pdf",
          fileUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800",
          fileSize: 1024 * 340,
          fileType: "application/pdf",
          category: "RELATORIO_TECNICO",
          description: "Mapeamento de gargalo na recepção e demora de login individual nos computadores.",
          uploadedBy: "Equipe PET-Saúde UNESP",
          uploadedAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
          isMock: true
        },
        {
          id: "doc-init-2",
          ubsId: "esf-severino-calazans",
          ubsName: "ESF Prof. Severino Calazans",
          fileName: "Foto_Fichas_CDS_Papel_Acumuladas.jpg",
          fileUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
          fileSize: 1024 * 850,
          fileType: "image/jpeg",
          category: "PRONTUARIO_EVIDENCIA",
          description: "Registro fotográfico das fichas de visita domiciliar em papel aguardando digitação.",
          uploadedBy: "Carla Mendes (Enfermeira)",
          uploadedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
          isMock: true
        },
        {
          id: "doc-init-3",
          ubsId: "esf-distrito-domelia",
          ubsName: "ESF Distrito de Domélia",
          fileName: "Registro_Oscilacao_Link_Internet.png",
          fileUrl: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
          fileSize: 1024 * 512,
          fileType: "image/png",
          category: "PRINT_ESUS",
          description: "Print de erro de conexão ao sincronizar prontuário distrital com a base central de Agudos.",
          uploadedBy: "Luciana Benitez",
          uploadedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
          isMock: true
        }
      ];
      localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(initialDocs));
      return initialDocs;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalDocuments = (docs: DocumentMetadata[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error("Erro ao salvar documento no localStorage:", err);
  }
};

/**
 * Upload de arquivo para Firebase Storage + Gravação de Metadados no Firestore
 */
export async function uploadDocumentToFirebase(params: {
  file: File;
  ubsId: string;
  ubsName: string;
  category: DocumentMetadata["category"];
  description: string;
  uploadedBy?: string;
  onProgress?: (progress: number) => void;
}): Promise<DocumentMetadata> {
  const { file, ubsId, ubsName, category, description, uploadedBy = "Pesquisador PET-Saúde", onProgress } = params;

  const MAX_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.size > MAX_SIZE) {
    throw new Error("O arquivo excede o limite de 15MB permitido.");
  }

  // 1. Firebase Storage + Firestore
  if (storage && db) {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `evidencias_ubs/${ubsId}/${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: { ubsId, ubsName, category, uploadedBy }
      });

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      const docData = {
        ubsId,
        ubsName,
        fileName: file.name,
        fileUrl: downloadUrl,
        fileSize: file.size,
        fileType: file.type,
        category,
        description,
        uploadedBy,
        storagePath,
        uploadedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "evidencias_ubs"), docData);

      return {
        id: docRef.id,
        ubsId,
        ubsName,
        fileName: file.name,
        fileUrl: downloadUrl,
        fileSize: file.size,
        fileType: file.type,
        category,
        description,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        isMock: false
      };
    } catch (firebaseErr) {
      console.warn("[Firebase] Erro no upload em nuvem, salvando localmente:", firebaseErr);
    }
  }

  // 2. Modo Local (Fallback)
  if (onProgress) {
    onProgress(50);
    await new Promise((r) => setTimeout(r, 200));
    onProgress(100);
  }

  const fileUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    if (file.size < 2 * 1024 * 1024) {
      reader.readAsDataURL(file);
    } else {
      resolve(URL.createObjectURL(file));
    }
  });

  const newDoc: DocumentMetadata = {
    id: `local-doc-${Date.now()}`,
    ubsId,
    ubsName,
    fileName: file.name,
    fileUrl,
    fileSize: file.size,
    fileType: file.type,
    category,
    description,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    isMock: true
  };

  const docs = getLocalDocuments();
  docs.unshift(newDoc);
  saveLocalDocuments(docs);

  return newDoc;
}

/**
 * Consulta documentos da base (Firestore com fallback no localStorage)
 */
export async function getDocuments(ubsId?: string): Promise<DocumentMetadata[]> {
  if (db) {
    try {
      const collectionRef = collection(db, "evidencias_ubs");
      const q = ubsId && ubsId !== "todas"
        ? query(collectionRef, where("ubsId", "==", ubsId))
        : collectionRef;

      const snapshot = await getDocs(q);
      const firestoreDocs: DocumentMetadata[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ubsId: data.ubsId || "",
          ubsName: data.ubsName || "",
          fileName: data.fileName || "documento",
          fileUrl: data.fileUrl || "",
          fileSize: data.fileSize || 0,
          fileType: data.fileType || "",
          category: data.category || "OUTRO",
          description: data.description || "",
          uploadedBy: data.uploadedBy || "Anônimo",
          uploadedAt: data.uploadedAt || new Date().toISOString(),
          isMock: false
        };
      });

      if (firestoreDocs.length > 0) {
        return firestoreDocs;
      }
    } catch (err) {
      console.warn("[Firestore] Erro de consulta:", err);
    }
  }

  const localDocs = getLocalDocuments();
  if (ubsId && ubsId !== "todas") {
    return localDocs.filter((d) => d.ubsId === ubsId);
  }
  return localDocs;
}

/**
 * Deleta um documento do Firestore/Storage ou Local
 */
export async function deleteDocument(docItem: DocumentMetadata): Promise<void> {
  if (db && !docItem.isMock) {
    try {
      await deleteDoc(doc(db, "evidencias_ubs", docItem.id));
      if (storage) {
        try {
          const fileRef = ref(storage, `evidencias_ubs/${docItem.ubsId}/${docItem.fileName}`);
          await deleteObject(fileRef);
        } catch {}
      }
      return;
    } catch (err) {
      console.warn("[Firebase] Erro ao deletar:", err);
    }
  }

  const docs = getLocalDocuments().filter((d) => d.id !== docItem.id);
  saveLocalDocuments(docs);
}
