import { Transaction } from '@/types';

// QuickBooks API types
export interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  CustomerRef: {
    value: string;
    name: string;
  };
  Line: QuickBooksInvoiceLine[];
  PrivateNote?: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksInvoiceLine {
  Id: string;
  LineNum: number;
  Description: string;
  Amount: number;
  DetailType: string;
  SalesItemLineDetail?: {
    ItemRef: {
      value: string;
      name: string;
    };
    Qty: number;
    UnitPrice: number;
  };
}

export interface QuickBooksBill {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  VendorRef: {
    value: string;
    name: string;
  };
  Line: QuickBooksBillLine[];
  PrivateNote?: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksBillLine {
  Id: string;
  LineNum: number;
  Description: string;
  Amount: number;
  DetailType: string;
  ItemBasedExpenseLineDetail?: {
    ItemRef: {
      value: string;
      name: string;
    };
    Qty: number;
    UnitPrice: number;
  };
}

export interface QuickBooksAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
  CurrentBalance: number;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1: string;
    City: string;
    CountrySubDivisionCode: string;
    PostalCode: string;
    Country: string;
  };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksVendor {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1: string;
    City: string;
    CountrySubDivisionCode: string;
    PostalCode: string;
    Country: string;
  };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksIntegration {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  isActive: boolean;
  lastSync: Date;
  syncSettings: {
    syncInvoices: boolean;
    syncBills: boolean;
    syncCustomers: boolean;
    syncVendors: boolean;
    syncAccounts: boolean;
  };
}

// QuickBooks API client
export class QuickBooksClient {
  private realmId: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(realmId: string, accessToken: string) {
    this.realmId = realmId;
    this.accessToken = accessToken;
    this.baseUrl = `https://sandbox-accounts.platform.intuit.com/v1/companies/${realmId}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`QuickBooks API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get invoices from QuickBooks
  async getInvoices(limit: number = 50, startPosition?: number): Promise<{ QueryResponse: { Invoice: QuickBooksInvoice[] } }> {
    let endpoint = `query?query=SELECT * FROM Invoice ORDER BY MetaData.CreateTime DESC MAXRESULTS ${limit}`;
    if (startPosition) {
      endpoint += ` STARTPOSITION ${startPosition}`;
    }

    return this.makeRequest(endpoint);
  }

  // Get bills from QuickBooks
  async getBills(limit: number = 50, startPosition?: number): Promise<{ QueryResponse: { Bill: QuickBooksBill[] } }> {
    let endpoint = `query?query=SELECT * FROM Bill ORDER BY MetaData.CreateTime DESC MAXRESULTS ${limit}`;
    if (startPosition) {
      endpoint += ` STARTPOSITION ${startPosition}`;
    }

    return this.makeRequest(endpoint);
  }

  // Get customers from QuickBooks
  async getCustomers(limit: number = 50): Promise<{ QueryResponse: { Customer: QuickBooksCustomer[] } }> {
    const endpoint = `query?query=SELECT * FROM Customer ORDER BY DisplayName MAXRESULTS ${limit}`;
    return this.makeRequest(endpoint);
  }

  // Get vendors from QuickBooks
  async getVendors(limit: number = 50): Promise<{ QueryResponse: { Vendor: QuickBooksVendor[] } }> {
    const endpoint = `query?query=SELECT * FROM Vendor ORDER BY DisplayName MAXRESULTS ${limit}`;
    return this.makeRequest(endpoint);
  }

  // Get accounts from QuickBooks
  async getAccounts(): Promise<{ QueryResponse: { Account: QuickBooksAccount[] } }> {
    const endpoint = 'query?query=SELECT * FROM Account WHERE AccountType IN (\'Income\', \'Expense\', \'Bank\', \'Credit Card\') ORDER BY Name';
    return this.makeRequest(endpoint);
  }

  // Get company info
  async getCompanyInfo(): Promise<{ CompanyInfo: { Id: string; CompanyName: string; LegalName: string } }> {
    return this.makeRequest('companyinfo/1');
  }

  // Get specific invoice
  async getInvoice(invoiceId: string): Promise<{ Invoice: QuickBooksInvoice }> {
    return this.makeRequest(`invoice/${invoiceId}`);
  }

  // Get specific bill
  async getBill(billId: string): Promise<{ Bill: QuickBooksBill }> {
    return this.makeRequest(`bill/${billId}`);
  }
}

// Convert QuickBooks invoices to CashPilot transactions
export function convertQuickBooksInvoiceToTransaction(
  invoice: QuickBooksInvoice,
  companyName: string
): Transaction {
  const invoiceDate = new Date(invoice.TxnDate);
  const amount = invoice.TotalAmt;
  
  // Determine transaction type based on balance
  let type: 'income' | 'expense' | 'transfer' = 'income';
  let status: 'completed' | 'pending' | 'cancelled' = 'completed';
  
  if (invoice.Balance > 0) {
    status = 'pending'; // Unpaid invoice
  }

  // Create description from invoice details
  const customerName = invoice.CustomerRef?.name || 'Unknown Customer';
  const description = `QuickBooks Invoice #${invoice.DocNumber} - ${customerName}`;

  // Auto-categorize based on invoice content
  const category = categorizeQuickBooksInvoice(invoice);

  return {
    id: `quickbooks_invoice_${invoice.Id}`,
    userId: '', // Will be set by the caller
    date: invoiceDate,
    amount: Math.abs(amount),
    currency: 'USD', // QuickBooks typically uses USD
    description,
    category,
    type,
    source: 'quickbooks',
    sourceId: invoice.Id,
    status,
    tags: ['quickbooks', 'invoice', 'income'],
    attachments: [],
    createdAt: new Date(invoice.MetaData.CreateTime),
    updatedAt: new Date(invoice.MetaData.LastUpdatedTime)
  };
}

// Convert QuickBooks bills to CashPilot transactions
export function convertQuickBooksBillToTransaction(
  bill: QuickBooksBill,
  companyName: string
): Transaction {
  const billDate = new Date(bill.TxnDate);
  const amount = bill.TotalAmt;
  
  // Bills are always expenses
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  let status: 'completed' | 'pending' | 'cancelled' = 'completed';
  
  if (bill.Balance > 0) {
    status = 'pending'; // Unpaid bill
  }

  // Create description from bill details
  const vendorName = bill.VendorRef?.name || 'Unknown Vendor';
  const description = `QuickBooks Bill #${bill.DocNumber} - ${vendorName}`;

  // Auto-categorize based on bill content
  const category = categorizeQuickBooksBill(bill);

  return {
    id: `quickbooks_bill_${bill.Id}`,
    userId: '', // Will be set by the caller
    date: billDate,
    amount: -Math.abs(amount), // Negative for expenses
    currency: 'USD',
    description,
    category,
    type,
    source: 'quickbooks',
    sourceId: bill.Id,
    status,
    tags: ['quickbooks', 'bill', 'expense'],
    attachments: [],
    createdAt: new Date(bill.MetaData.CreateTime),
    updatedAt: new Date(bill.MetaData.LastUpdatedTime)
  };
}

// Auto-categorize QuickBooks invoices
function categorizeQuickBooksInvoice(invoice: QuickBooksInvoice): string {
  // Analyze line items to determine category
  const categories = invoice.Line.map(line => {
    const description = line.Description?.toLowerCase() || '';
    const itemName = line.SalesItemLineDetail?.ItemRef?.name?.toLowerCase() || '';
    
    if (description.includes('consulting') || description.includes('service') || itemName.includes('service')) {
      return 'Client Services';
    }
    if (description.includes('product') || description.includes('goods') || itemName.includes('product')) {
      return 'Product Sales';
    }
    if (description.includes('subscription') || description.includes('recurring')) {
      return 'Subscription';
    }
    if (description.includes('digital') || description.includes('download')) {
      return 'Digital Products';
    }
    
    return 'Client Services'; // Default category
  });

  // Return the most common category, or default
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommon = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return mostCommon ? mostCommon[0] : 'Client Services';
}

// Auto-categorize QuickBooks bills
function categorizeQuickBooksBill(bill: QuickBooksBill): string {
  // Analyze line items to determine category
  const categories = bill.Line.map(line => {
    const description = line.Description?.toLowerCase() || '';
    const itemName = line.ItemBasedExpenseLineDetail?.ItemRef?.name?.toLowerCase() || '';
    
    if (description.includes('office') || description.includes('supplies') || itemName.includes('supplies')) {
      return 'Office Supplies';
    }
    if (description.includes('rent') || description.includes('lease')) {
      return 'Rent & Utilities';
    }
    if (description.includes('salary') || description.includes('payroll') || description.includes('wages')) {
      return 'Payroll';
    }
    if (description.includes('marketing') || description.includes('advertising')) {
      return 'Marketing & Advertising';
    }
    if (description.includes('software') || description.includes('subscription')) {
      return 'Software & Subscriptions';
    }
    if (description.includes('travel') || description.includes('meals')) {
      return 'Travel & Meals';
    }
    if (description.includes('insurance')) {
      return 'Insurance';
    }
    if (description.includes('legal') || description.includes('accounting')) {
      return 'Professional Services';
    }
    
    return 'Other Expenses'; // Default category
  });

  // Return the most common category, or default
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommon = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return mostCommon ? mostCommon[0] : 'Other Expenses';
}

// Sync QuickBooks data
export async function syncQuickBooksData(
  quickbooksClient: QuickBooksClient,
  userId: string,
  lastSyncDate?: Date
): Promise<Transaction[]> {
  try {
    const transactions: Transaction[] = [];
    
    // Sync invoices
    const invoicesResponse = await quickbooksClient.getInvoices(100);
    const invoices = invoicesResponse.QueryResponse?.Invoice || [];
    
    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice.TxnDate);
      
      // Skip if invoice is older than last sync
      if (lastSyncDate && invoiceDate <= lastSyncDate) {
        continue;
      }

      const transaction = convertQuickBooksInvoiceToTransaction(invoice, 'QuickBooks Company');
      transaction.userId = userId;
      transactions.push(transaction);
    }

    // Sync bills
    const billsResponse = await quickbooksClient.getBills(100);
    const bills = billsResponse.QueryResponse?.Bill || [];
    
    for (const bill of bills) {
      const billDate = new Date(bill.TxnDate);
      
      // Skip if bill is older than last sync
      if (lastSyncDate && billDate <= lastSyncDate) {
        continue;
      }

      const transaction = convertQuickBooksBillToTransaction(bill, 'QuickBooks Company');
      transaction.userId = userId;
      transactions.push(transaction);
    }

    return transactions;
  } catch (error) {
    console.error('Error syncing QuickBooks data:', error);
    throw new Error(`Failed to sync QuickBooks data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validate QuickBooks credentials
export async function validateQuickBooksCredentials(
  realmId: string,
  accessToken: string
): Promise<{ isValid: boolean; companyInfo?: any; error?: string }> {
  try {
    const client = new QuickBooksClient(realmId, accessToken);
    const companyInfo = await client.getCompanyInfo();
    
    return {
      isValid: true,
      companyInfo: companyInfo.CompanyInfo
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid credentials'
    };
  }
}
