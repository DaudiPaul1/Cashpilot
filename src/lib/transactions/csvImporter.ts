import { Transaction } from '@/types';

export interface CSVRow {
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  currency?: string;
  tags?: string;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  transactions: Transaction[];
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    imported: number;
    failed: number;
    skipped: number;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

/**
 * Parse CSV content and convert to structured data
 */
export function parseCSVContent(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['date', 'amount', 'description', 'category', 'type'];
  
  // Validate headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const data: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    if (values.length < 5) continue;
    
    const row: CSVRow = {
      date: values[headers.indexOf('date')] || '',
      amount: parseFloat(values[headers.indexOf('amount')]) || 0,
      description: values[headers.indexOf('description')] || '',
      category: values[headers.indexOf('category')] || '',
      type: (values[headers.indexOf('type')] as 'income' | 'expense' | 'transfer') || 'expense',
      currency: values[headers.indexOf('currency')] || 'USD',
      tags: values[headers.indexOf('tags')] || '',
      notes: values[headers.indexOf('notes')] || ''
    };
    
    data.push(row);
  }
  
  return data;
}

/**
 * Validate CSV data and return validation results
 */
export function validateCSVData(data: CSVRow[]): {
  validRows: CSVRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const validRows: CSVRow[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because of 0-based index and header row
    let rowValid = true;
    
    // Validate date
    if (!row.date) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Date is required',
        value: row.date
      });
      rowValid = false;
    } else if (isNaN(Date.parse(row.date))) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Invalid date format (use YYYY-MM-DD)',
        value: row.date
      });
      rowValid = false;
    }
    
    // Validate amount
    if (isNaN(row.amount)) {
      errors.push({
        row: rowNumber,
        field: 'amount',
        message: 'Amount must be a valid number',
        value: row.amount
      });
      rowValid = false;
    } else if (row.amount === 0) {
      warnings.push({
        row: rowNumber,
        field: 'amount',
        message: 'Amount is zero',
        value: row.amount
      });
    }
    
    // Validate description
    if (!row.description || row.description.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'description',
        message: 'Description is required',
        value: row.description
      });
      rowValid = false;
    } else if (row.description.trim().length < 3) {
      warnings.push({
        row: rowNumber,
        field: 'description',
        message: 'Description is very short',
        value: row.description
      });
    }
    
    // Validate category
    if (!row.category || row.category.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: 'Category is required',
        value: row.category
      });
      rowValid = false;
    }
    
    // Validate type
    if (!['income', 'expense', 'transfer'].includes(row.type)) {
      errors.push({
        row: rowNumber,
        field: 'type',
        message: 'Type must be income, expense, or transfer',
        value: row.type
      });
      rowValid = false;
    }
    
    // Validate currency
    if (row.currency && !['USD', 'EUR', 'GBP', 'CAD'].includes(row.currency.toUpperCase())) {
      warnings.push({
        row: rowNumber,
        field: 'currency',
        message: 'Unsupported currency (will use USD)',
        value: row.currency
      });
    }
    
    if (rowValid) {
      validRows.push(row);
    }
  });
  
  return { validRows, errors, warnings };
}

/**
 * Convert validated CSV rows to Transaction objects
 */
export function convertCSVRowsToTransactions(
  rows: CSVRow[],
  userId: string,
  sourceId: string = 'csv_import'
): Transaction[] {
  return rows.map((row, index) => ({
    id: `${sourceId}_${Date.now()}_${index}`,
    userId,
    date: new Date(row.date),
    amount: row.type === 'expense' ? -Math.abs(row.amount) : Math.abs(row.amount),
    currency: (row.currency || 'USD').toUpperCase(),
    description: row.description.trim(),
    category: row.category.trim(),
    type: row.type,
    source: 'manual',
    sourceId,
    status: 'completed' as const,
    tags: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : ['csv-import'],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }));
}

/**
 * Generate CSV template with sample data
 */
export function generateCSVTemplate(): string {
  return `date,amount,description,category,type,currency,tags,notes
2024-01-15,1500.00,Client Payment - Project A,Client Services,income,USD,client-payment,Monthly retainer
2024-01-16,-250.00,Office Supplies,Office Supplies,expense,USD,office,Monthly office supplies
2024-01-17,500.00,Consulting Fee,Client Services,income,USD,consulting,One-time consulting
2024-01-18,-75.50,Software Subscription,Software & Subscriptions,expense,USD,software,Monthly SaaS subscription
2024-01-19,2000.00,Product Sale,Product Sales,income,USD,product-sale,Online store sale
2024-01-20,-1200.00,Payroll,Payroll,expense,USD,payroll,Employee salary
2024-01-21,800.00,Service Contract,Client Services,income,USD,service-contract,Quarterly service contract
2024-01-22,-45.00,Travel Expense,Travel & Meals,expense,USD,travel,Client meeting travel`;
}

/**
 * Complete CSV import process
 */
export function processCSVImport(
  csvContent: string,
  userId: string
): ImportResult {
  try {
    // Parse CSV
    const rawData = parseCSVContent(csvContent);
    
    // Validate data
    const { validRows, errors, warnings } = validateCSVData(rawData);
    
    // Convert to transactions
    const transactions = convertCSVRowsToTransactions(validRows, userId);
    
    return {
      success: errors.length === 0,
      transactions,
      errors: errors.map(e => `Row ${e.row}: ${e.message}`),
      warnings: warnings.map(w => `Row ${w.row}: ${w.message}`),
      summary: {
        total: rawData.length,
        imported: validRows.length,
        failed: errors.length,
        skipped: rawData.length - validRows.length
      }
    };
  } catch (error) {
    return {
      success: false,
      transactions: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: [],
      summary: {
        total: 0,
        imported: 0,
        failed: 1,
        skipped: 0
      }
    };
  }
}

/**
 * Validate file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
