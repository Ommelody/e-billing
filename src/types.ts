export type DocumentType = 'QUOTATION' | 'INVOICE' | 'BILLING' | 'RECEIPT';

export interface OwnerProfile {
  name: string;
  taxId: string; // 13-digit identification or tax ID
  address: string;
  phone: string;
  email: string;
  website?: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  signatureName?: string;
  logoUrl?: string; // Base64 or image URL
  useVat: boolean;
  vatRate: number; // usually 7%
  useWithholdingTax: boolean;
  withholdingTaxRate: number; // e.g. 1%, 3%, 5%
}

export interface Client {
  id: string;
  name: string;
  taxId?: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  unit: string; // e.g. ชิ้น, ชั่วโมง, ครั้ง, วัน
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  unit: string;
  total: number;
}

export interface FinanceDocument {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  referenceNumber?: string; // e.g., Quotation Number in Invoice, or PO number
  clientId: string;
  clientDetails: Client; // Snapshot of client details at the time of creation
  ownerDetails: OwnerProfile; // Snapshot of owner details at the time of creation
  items: LineItem[];
  discount: number; // Flat discount amount
  isVatEnabled: boolean;
  vatRate: number; // Percentage, e.g. 7
  isWithholdingTaxEnabled: boolean;
  withholdingTaxRate: number; // Percentage, e.g. 3
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  notes?: string;
  paymentBankName?: string;
  paymentBankAccountName?: string;
  paymentBankAccountNumber?: string;
  createdAt: string;
}
