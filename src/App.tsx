import React, { useState, useEffect } from 'react';
import { 
  loadOwnerProfile, 
  loadClients, 
  loadProducts, 
  loadDocuments, 
  saveDocuments,
  saveClients,
  saveProducts,
  saveOwnerProfile
} from './utils';
import { FinanceDocument, Client, ProductItem, OwnerProfile, DocumentType } from './types';

// Services
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { 
  findSpreadsheet, 
  createSpreadsheet, 
  pushDataToSpreadsheet, 
  pullDataFromSpreadsheet 
} from './services/googleSheets';
import { User as FirebaseUser } from 'firebase/auth';

// Components
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentPrint from './components/DocumentPrint';
import ClientList from './components/ClientList';
import ItemList from './components/ItemList';
import OwnerProfileForm from './components/OwnerProfileForm';

// Icons
import { 
  TrendingUp, FileText, Users, Briefcase, User as UserIcon, 
  FileSpreadsheet, Sparkles, Building2, AlertTriangle, CheckCircle, X, Info
} from 'lucide-react';

export default function App() {
  // Load data from LocalStorage
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(loadOwnerProfile);
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [products, setProducts] = useState<ProductItem[]>(loadProducts);
  const [documents, setDocuments] = useState<FinanceDocument[]>(loadDocuments);

  // Custom dialog and confirmation states to work seamlessly in sandboxed iframes
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showCustomAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'ตกลง',
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Navigation and Views State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentView, setCurrentView] = useState<'main' | 'form' | 'print'>('main');
  const [editingDoc, setEditingDoc] = useState<FinanceDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<FinanceDocument | null>(null);

  // Google Sheets integration state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{ id: string; name: string; url: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Auth state listener to auto-resume sessions
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, tokenStr) => {
        setUser(firebaseUser);
        setToken(tokenStr);
        
        try {
          const spreadsheet = await findSpreadsheet(tokenStr);
          if (spreadsheet) {
            setSpreadsheetInfo(spreadsheet);
          } else {
            // Create automatically on first connection
            const newSheet = await createSpreadsheet(tokenStr);
            setSpreadsheetInfo({
              id: newSheet.id,
              name: 'ระบบเอกสารการเงิน บุคคลธรรมดา',
              url: newSheet.url
            });
          }
        } catch (err) {
          console.error('Error finding/creating spreadsheet on auth load:', err);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setSpreadsheetInfo(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync helpers
  const triggerAutoSync = async (currentData: {
    documents: FinanceDocument[];
    clients: Client[];
    products: ProductItem[];
    profile: OwnerProfile;
  }) => {
    if (!token || !spreadsheetInfo) return;
    setIsSyncing(true);
    try {
      await pushDataToSpreadsheet(token, spreadsheetInfo.id, currentData);
      setSyncStatus('success');
      setLastSynced(new Date().toLocaleTimeString('th-TH'));
    } catch (error) {
      console.error('Auto sync error:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        
        const spreadsheet = await findSpreadsheet(result.accessToken);
        if (spreadsheet) {
          setSpreadsheetInfo(spreadsheet);
          showCustomAlert('เชื่อมต่อสำเร็จ', `พบไฟล์สเปรดชีตเดิมใน Google Drive:\n"${spreadsheet.name}"`, 'success');
        } else {
          const newSheet = await createSpreadsheet(result.accessToken);
          setSpreadsheetInfo({
            id: newSheet.id,
            name: 'ระบบเอกสารการเงิน บุคคลธรรมดา',
            url: newSheet.url
          });
          showCustomAlert('เชื่อมต่อสำเร็จ', 'ระบบได้ทำการสร้างไฟล์ Google Sheet สำรองข้อมูลเรียบร้อยใน Google Drive:\n"ระบบเอกสารการเงิน บุคคลธรรมดา"', 'success');
        }
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      showCustomAlert('เชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อ Google Sheets ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    showCustomConfirm(
      'ยืนยันการตัดการเชื่อมต่อ',
      'คุณแน่ใจหรือไม่ว่าต้องการตัดการเชื่อมต่อจาก Google Sheets?',
      async () => {
        await logout();
        setUser(null);
        setToken(null);
        setSpreadsheetInfo(null);
        setSyncStatus('idle');
        setLastSynced(null);
      },
      'ตัดการเชื่อมต่อ',
      'ยกเลิก'
    );
  };

  const handlePushSync = async () => {
    if (!token || !spreadsheetInfo) return;
    setIsSyncing(true);
    try {
      await pushDataToSpreadsheet(token, spreadsheetInfo.id, {
        documents,
        clients,
        products,
        profile: ownerProfile
      });
      showCustomAlert('อัปโหลดข้อมูลสำเร็จ', 'อัปโหลดและสำรองข้อมูลไปยัง Google Sheets เรียบร้อยแล้ว!', 'success');
      setSyncStatus('success');
      setLastSynced(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error('Push sync failed:', err);
      showCustomAlert('อัปโหลดข้อมูลล้มเหลว', 'กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ผลกรุณาตรวจสอบสิทธิ์การเข้าถึงไฟล์', 'error');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullSync = async () => {
    if (!token || !spreadsheetInfo) return;
    showCustomConfirm(
      '⚠️ ยืนยันการดึงข้อมูลคืน',
      'การดึงข้อมูลจาก Google Sheets จะเขียนทับและแทนที่ข้อมูลปัจจุบันในเครื่องนี้ทั้งหมด! คุณต้องการดำเนินการต่อหรือไม่?',
      async () => {
        setIsSyncing(true);
        try {
          const pulled = await pullDataFromSpreadsheet(token, spreadsheetInfo.id);
          if (pulled) {
            setDocuments(pulled.documents);
            setClients(pulled.clients);
            setProducts(pulled.products);
            setOwnerProfile(pulled.profile);
            
            saveDocuments(pulled.documents);
            saveClients(pulled.clients);
            saveProducts(pulled.products);
            saveOwnerProfile(pulled.profile);
            
            showCustomAlert('ดึงข้อมูลสำเร็จ', 'ดึงและนำเข้าข้อมูลจาก Google Sheets ทดแทนข้อมูลในเครื่องสำเร็จเรียบร้อยแล้ว!', 'success');
            setSyncStatus('success');
            setLastSynced(new Date().toLocaleTimeString('th-TH'));
          }
        } catch (err) {
          console.error('Pull sync failed:', err);
          showCustomAlert('ดึงข้อมูลล้มเหลว', 'กรุณาตรวจสอบโครงสร้างคอลัมน์และแถวในไฟล์สเปรดชีตว่าไม่มีการดัดแปลงรูปแบบตารางหลัก', 'error');
          setSyncStatus('error');
        } finally {
          setIsSyncing(false);
        }
      },
      'ดึงข้อมูลและเขียนทับ',
      'ยกเลิก'
    );
  };

  // State handlers to ensure auto-sync
  const handleClientsUpdate = (updatedClients: Client[]) => {
    setClients(updatedClients);
    saveClients(updatedClients);
    triggerAutoSync({ documents, clients: updatedClients, products, profile: ownerProfile });
  };

  const handleProductsUpdate = (updatedProducts: ProductItem[]) => {
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    triggerAutoSync({ documents, clients, products: updatedProducts, profile: ownerProfile });
  };

  const handleOwnerProfileUpdate = (updatedProfile: OwnerProfile) => {
    setOwnerProfile(updatedProfile);
    saveOwnerProfile(updatedProfile);
    triggerAutoSync({ documents, clients, products, profile: updatedProfile });
  };

  const handleClearAllData = () => {
    showCustomConfirm(
      '⚠️ ยืนยันการล้างข้อมูลจำลอง',
      'คุณต้องการล้างข้อมูลตัวอย่างทั้งหมดในระบบ (ได้แก่ เอกสาร/บิลทั้งหมด, รายชื่อลูกค้าทั้งหมด, รายการสินค้าและบริการ) และเริ่มรีเซ็ตตั้งค่าผู้ประกอบการเป็นค่าว่างเพื่อเริ่มต้นกรอกข้อมูลจริงของคุณเองใช่หรือไม่?',
      () => {
        const emptyProfile: OwnerProfile = {
          name: '',
          taxId: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          bankName: '',
          bankAccountName: '',
          bankAccountNumber: '',
          signatureName: '',
          useVat: false,
          vatRate: 7,
          useWithholdingTax: false,
          withholdingTaxRate: 3
        };

        setDocuments([]);
        setClients([]);
        setProducts([]);
        setOwnerProfile(emptyProfile);

        saveDocuments([]);
        saveClients([]);
        saveProducts([]);
        saveOwnerProfile(emptyProfile);

        // Trigger automatic backup sync to Google Sheets if authenticated
        if (token && spreadsheetInfo) {
          triggerAutoSync({ documents: [], clients: [], products: [], profile: emptyProfile });
        }

        showCustomAlert('รีเซ็ตระบบสำเร็จ', 'ล้างข้อมูลตัวอย่างและรีเซ็ตระบบเรียบร้อยแล้ว!\nฐานข้อมูลพร้อมสำหรับเริ่มป้อนข้อมูลจริงของคุณแล้วครับ', 'success');
      },
      'ล้างข้อมูลทั้งหมด',
      'ยกเลิก'
    );
  };

  // Document Counts for sequential serial numbers
  const lastDocCounts: Record<DocumentType, number> = {
    QUOTATION: documents.filter(d => d.documentType === 'QUOTATION').length,
    INVOICE: documents.filter(d => d.documentType === 'INVOICE').length,
    BILLING: documents.filter(d => d.documentType === 'BILLING').length,
    RECEIPT: documents.filter(d => d.documentType === 'RECEIPT').length,
  };

  // Document Actions
  const handleViewDoc = (doc: FinanceDocument) => {
    setViewingDoc(doc);
    setCurrentView('print');
  };

  const handleEditDoc = (doc: FinanceDocument) => {
    setEditingDoc(doc);
    setCurrentView('form');
  };

  const handleDeleteDoc = (id: string) => {
    showCustomConfirm(
      'ยืนยันการลบเอกสาร',
      'คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้ออกจากระบบ? (การกระทำนี้ไม่สามารถกู้คืนข้อมูลกลับมาได้)',
      () => {
        const updated = documents.filter(d => d.id !== id);
        setDocuments(updated);
        saveDocuments(updated);
        triggerAutoSync({ documents: updated, clients, products, profile: ownerProfile });
      },
      'ลบเอกสาร',
      'ยกเลิก'
    );
  };

  const handleConvertDoc = (sourceDoc: FinanceDocument, targetType: DocumentType) => {
    const count = lastDocCounts[targetType] || 0;
    // Autogenerate sequential document number
    const num = `${targetType === 'QUOTATION' ? 'QT' : targetType === 'INVOICE' ? 'IV' : targetType === 'BILLING' ? 'BL' : 'RE'}-${new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2, 6)}-${(count + 1).toString().padStart(4, '0')}`;

    // Map source attributes to target converted doc
    const convertedDoc: FinanceDocument = {
      ...sourceDoc,
      id: `doc-${Date.now()}`,
      documentType: targetType,
      documentNumber: num,
      date: new Date().toISOString().split('T')[0],
      referenceNumber: sourceDoc.documentNumber, // set parent document as reference!
      status: targetType === 'RECEIPT' ? 'paid' : 'draft', // receipts auto default to paid
      createdAt: new Date().toISOString()
    };

    setEditingDoc(convertedDoc);
    setCurrentView('form');
  };

  const handleSaveDoc = (savedDoc: FinanceDocument) => {
    let updatedDocs: FinanceDocument[];
    const exists = documents.some(d => d.id === savedDoc.id);

    if (exists) {
      // Edit save
      updatedDocs = documents.map(d => d.id === savedDoc.id ? savedDoc : d);
    } else {
      // Create new save
      updatedDocs = [...documents, savedDoc];
    }

    setDocuments(updatedDocs);
    saveDocuments(updatedDocs);
    setEditingDoc(null);
    setCurrentView('main');
    setCurrentTab('documents'); // automatically redirect to documents tab to view list
    triggerAutoSync({ documents: updatedDocs, clients, products, profile: ownerProfile });
  };


  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-700 font-sans print:bg-white" id="main-application-container">
      
      {/* 1. Header (ซ่อนเมื่อเข้าโหมด PRINT) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo และชื่อระบบ */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                <FileSpreadsheet className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight flex items-center gap-1">
                  ระบบจัดทำเอกสารการเงิน
                  <span className="text-[10px] text-slate-400 font-normal bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                    บุคคลธรรมดา
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                  ออกใบเสนอราคา • ใบแจ้งหนี้ • ใบวางบิล • ใบเสร็จรับเงิน
                </span>
              </div>
            </div>

            {/* พรีวิวผู้ลงนามปัจจุบันรวดเร็ว */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">
                ผู้ประกอบการ: <strong>{ownerProfile.name}</strong>
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* 2. แท็บนำทางหลัก (ซ่อนเมื่อคุมพิมพ์ หรือเปิดฟอร์มแก้บิล) */}
      {currentView === 'main' && (
        <nav className="bg-white border-b border-slate-100 shrink-0 print:hidden shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'dashboard', label: 'แดชบอร์ดสรุป', icon: TrendingUp },
                { id: 'documents', label: 'จัดการเอกสารทั้งหมด', icon: FileText },
                { id: 'clients', label: 'ฐานข้อมูลลูกค้า', icon: Users },
                { id: 'products', label: 'สินค้าและบริการ', icon: Briefcase },
                { id: 'profile', label: 'ข้อมูลผู้ประกอบการ (แก้ไขชื่อเจ้าของ)', icon: UserIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Google Sheets Sync Banner */}
      {currentView === 'main' && (
        <div className="bg-slate-100/90 border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${user ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <div className="text-xs">
                {user ? (
                  <div className="text-slate-700">
                    <span className="font-medium">เชื่อมต่อกับบัญชี Google แล้ว:</span>{' '}
                    <strong className="text-slate-950 font-bold">{user.email}</strong>
                    {spreadsheetInfo && (
                      <span className="ml-2 block sm:inline">
                        | แหล่งเก็บข้อมูล:{' '}
                        <a
                          href={spreadsheetInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold underline inline-flex items-center gap-0.5"
                        >
                          {spreadsheetInfo.name}
                        </a>
                      </span>
                    )}
                    {lastSynced && (
                      <span className="ml-2 text-slate-500 font-medium block sm:inline">
                        (ซิงค์ข้อมูลล่าสุดเมื่อ: {lastSynced})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500">
                    <span className="font-medium text-slate-700">ฐานข้อมูลคลาวด์ Google Sheets:</span>{' '}
                    เชื่อมต่อสเปรดชีตเพื่อจัดเก็บและสำรองข้อมูลลูกค้า บิล และโปรเจกต์ของคุณอย่างถาวร
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={handlePullSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    title="ดึงข้อมูลล่าสุดจาก Google Sheets มาทับข้อมูลในเครื่องนี้"
                  >
                    ดึงข้อมูล (Pull)
                  </button>
                  <button
                    onClick={handlePushSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 animate-fadeIn"
                    title="ส่งข้อมูลในเครื่องนี้ทั้งหมดขึ้นไปบันทึกบน Google Sheets"
                  >
                    {isSyncing ? 'กำลังส่งข้อมูล...' : 'อัปโหลด (Push)'}
                  </button>
                  <button
                    onClick={handleGoogleSignOut}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    ตัดการเชื่อมต่อ
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-75 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.2.685 4.28 1.764l3.12-3.12C19.26 2.505 15.93 1.114 12.24 1.114 6.225 1.114 1.34 6 1.34 12.028s4.885 10.914 10.9 10.914c6.305 0 10.914-4.43 10.914-11.064 0-.756-.08-1.306-.183-1.594H12.24z"/>
                  </svg>
                  {isLoggingIn ? 'กำลังเปิดหน้าเชื่อมต่อ...' : 'เชื่อมต่อ Google Sheets เพื่อเซฟข้อมูล'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. เนื้อหาแอพหลัก */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto print:p-0">
        
        {/* หน้าหลักแสดงแท็บต่างๆ */}
        {currentView === 'main' && (
          <div className="animate-fadeIn">
            {currentTab === 'dashboard' && (
              <Dashboard 
                documents={documents}
                clients={clients}
                products={products}
                onViewDoc={handleViewDoc}
                onNavigateToTab={(tab) => {
                  setCurrentTab(tab);
                }}
                onClearAllData={handleClearAllData}
              />
            )}

            {currentTab === 'documents' && (
              <DocumentList 
                documents={documents}
                onView={handleViewDoc}
                onEdit={handleEditDoc}
                onDelete={handleDeleteDoc}
                onConvert={handleConvertDoc}
                onAddNew={() => {
                  setEditingDoc(null);
                  setCurrentView('form');
                }}
              />
            )}

            {currentTab === 'clients' && (
              <ClientList 
                clients={clients}
                onUpdate={handleClientsUpdate}
                showConfirm={showCustomConfirm}
              />
            )}

            {currentTab === 'products' && (
              <ItemList 
                products={products}
                onUpdate={handleProductsUpdate}
                showConfirm={showCustomConfirm}
              />
            )}

            {currentTab === 'profile' && (
              <OwnerProfileForm 
                profile={ownerProfile}
                onUpdate={handleOwnerProfileUpdate}
                onClearAllData={handleClearAllData}
              />
            )}
          </div>
        )}

        {/* หน้าสร้าง/แก้ไขเอกสาร */}
        {currentView === 'form' && (
          <div className="animate-fadeIn">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingDoc ? `แก้ไขเอกสารหมายเลข ${editingDoc.documentNumber}` : 'สร้างเอกสารทางการเงินชุดใหม่'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">กรอกข้อมูลผู้จ้าง บริการ และสรุปเงื่อนไขเพื่อจัดทำแบบฟอร์ม</p>
              </div>
            </div>
            
            <DocumentForm 
              documentToEdit={editingDoc}
              clients={clients}
              products={products}
              ownerProfile={ownerProfile}
              lastDocCounts={lastDocCounts}
              onSave={handleSaveDoc}
              onCancel={() => {
                setEditingDoc(null);
                setCurrentView('main');
              }}
            />
          </div>
        )}

        {/* หน้าพรีวิวเตรียมจัดพิมพ์บิล */}
        {currentView === 'print' && viewingDoc && (
          <div className="animate-fadeIn">
            <DocumentPrint 
              document={viewingDoc}
              onBack={() => {
                setViewingDoc(null);
                setCurrentView('main');
              }}
            />
          </div>
        )}

      </main>

      {/* 4. Footer (ซ่อนเมื่อพิมพ์บิล) */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 print:hidden shrink-0">
        <p>© 2026 ระบบจัดการและออกเอกสารการเงินฉบับบุคคลธรรมดา - จัดทำอย่างถูกต้องตามกฎหมายภาษีสรรพากรสำหรับผู้รับจ้างอิสระ</p>
      </footer>

      {/* Custom Alert/Confirm Dialog Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden" id="custom-system-dialog">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 overflow-hidden animate-scaleIn">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                dialog.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                dialog.type === 'error' ? 'bg-red-50 text-red-600' :
                dialog.type === 'confirm' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {dialog.type === 'success' && <CheckCircle className="w-5.5 h-5.5" />}
                {dialog.type === 'error' && <X className="w-5.5 h-5.5" />}
                {dialog.type === 'confirm' && <AlertTriangle className="w-5.5 h-5.5" />}
                {dialog.type === 'info' && <Info className="w-5.5 h-5.5" />}
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{dialog.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line font-medium">{dialog.message}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end gap-2">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {dialog.cancelText || 'ยกเลิก'}
                  </button>
                  <button
                    onClick={() => {
                      if (dialog.onConfirm) dialog.onConfirm();
                    }}
                    className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dialog.title.includes('ลบ') || dialog.title.includes('ล้าง') 
                        ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-100' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-100'
                    }`}
                  >
                    {dialog.confirmText || 'ยืนยัน'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {dialog.confirmText || 'ตกลง'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
