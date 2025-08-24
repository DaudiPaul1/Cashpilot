import { Transaction } from '@/types';
import { ShopifyOrder } from '@/lib/integrations/shopify';

// Data source types
export type DataSource = 'manual' | 'shopify' | 'quickbooks' | 'combined';

// Data adapter interface
export interface DataAdapter {
  source: DataSource;
  getTransactions(): Transaction[];
  getRevenueData(): RevenueData;
  getExpenseData(): ExpenseData;
  getCustomerData(): CustomerData;
  getProductData(): ProductData;
  isDataAvailable(): boolean;
}

// Data structures for different business types
export interface RevenueData {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  averageOrderValue: number;
  revenueByPeriod: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface ExpenseData {
  totalExpenses: number;
  operatingExpenses: number;
  costOfGoods: number;
  expensesByCategory: Record<string, number>;
  expensesByPeriod: Record<string, number>;
}

export interface CustomerData {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerLifetimeValue: number;
  churnRate: number;
  customersByPeriod: Record<string, number>;
}

export interface ProductData {
  totalProducts: number;
  topSellingProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
  productPerformance: Record<string, {
    revenue: number;
    quantity: number;
    margin: number;
  }>;
}

// Manual data adapter (for users who enter data manually)
export class ManualDataAdapter implements DataAdapter {
  source: DataSource = 'manual';
  private transactions: Transaction[];

  constructor(transactions: Transaction[]) {
    this.transactions = transactions;
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  getRevenueData(): RevenueData {
    const incomeTransactions = this.transactions.filter(t => t.type === 'income');
    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Estimate recurring vs one-time based on transaction patterns
    const recurringRevenue = this.estimateRecurringRevenue(incomeTransactions);
    const oneTimeRevenue = totalRevenue - recurringRevenue;
    
    const averageOrderValue = incomeTransactions.length > 0 
      ? totalRevenue / incomeTransactions.length 
      : 0;

    return {
      totalRevenue,
      recurringRevenue,
      oneTimeRevenue,
      averageOrderValue,
      revenueByPeriod: this.groupByPeriod(incomeTransactions),
      revenueByCategory: this.groupByCategory(incomeTransactions)
    };
  }

  getExpenseData(): ExpenseData {
    const expenseTransactions = this.transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Estimate COGS vs operating expenses based on categories
    const costOfGoods = this.estimateCostOfGoods(expenseTransactions);
    const operatingExpenses = totalExpenses - costOfGoods;

    return {
      totalExpenses,
      operatingExpenses,
      costOfGoods,
      expensesByCategory: this.groupByCategory(expenseTransactions),
      expensesByPeriod: this.groupByPeriod(expenseTransactions)
    };
  }

  getCustomerData(): CustomerData {
    // For manual data, estimate customer metrics based on transaction patterns
    const uniqueCustomers = this.estimateUniqueCustomers();
    const activeCustomers = this.estimateActiveCustomers();
    const newCustomers = this.estimateNewCustomers();
    
    const totalRevenue = this.getRevenueData().totalRevenue;
    const customerLifetimeValue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    const churnRate = this.estimateChurnRate();

    return {
      totalCustomers: uniqueCustomers,
      activeCustomers,
      newCustomers,
      customerLifetimeValue,
      churnRate,
      customersByPeriod: this.estimateCustomersByPeriod()
    };
  }

  getProductData(): ProductData {
    // For manual data, extract product information from transaction descriptions
    const productData = this.extractProductDataFromDescriptions();
    
    return {
      totalProducts: productData.length,
      topSellingProducts: productData
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      productPerformance: productData.reduce((acc, product) => {
        acc[product.name] = {
          revenue: product.revenue,
          quantity: product.quantity,
          margin: product.margin || 0
        };
        return acc;
      }, {} as Record<string, any>)
    };
  }

  isDataAvailable(): boolean {
    return this.transactions.length > 0;
  }

  // Helper methods for manual data estimation
  private estimateRecurringRevenue(transactions: Transaction[]): number {
    // Simple heuristic: transactions with similar amounts and regular intervals
    const amounts = transactions.map(t => t.amount);
    const uniqueAmounts = [...new Set(amounts)];
    
    // If there are many transactions with the same amount, likely recurring
    const recurringAmounts = uniqueAmounts.filter(amount => 
      amounts.filter(a => Math.abs(a - amount) < 0.01).length > 2
    );
    
    return recurringAmounts.reduce((sum, amount) => 
      sum + amounts.filter(a => Math.abs(a - amount) < 0.01).reduce((s, a) => s + a, 0), 0
    );
  }

  private estimateCostOfGoods(transactions: Transaction[]): number {
    const cogsCategories = ['Product Sales', 'Inventory', 'Materials', 'Cost of Goods'];
    return transactions
      .filter(t => cogsCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private estimateUniqueCustomers(): number {
    // Extract customer names from transaction descriptions
    const customerNames = this.transactions
      .filter(t => t.type === 'income')
      .map(t => this.extractCustomerName(t.description))
      .filter(name => name)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    
    return customerNames.length;
  }

  private estimateActiveCustomers(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = this.transactions.filter(t => 
      t.type === 'income' && t.date >= thirtyDaysAgo
    );
    
    const customerNames = recentTransactions
      .map(t => this.extractCustomerName(t.description))
      .filter(name => name)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    
    return customerNames.length;
  }

  private estimateNewCustomers(): number {
    // Estimate new customers based on first-time transactions
    const customerFirstTransactions = new Map<string, Date>();
    
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const customerName = this.extractCustomerName(t.description);
        if (customerName) {
          const existing = customerFirstTransactions.get(customerName);
          if (!existing || t.date < existing) {
            customerFirstTransactions.set(customerName, t.date);
          }
        }
      });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return Array.from(customerFirstTransactions.values())
      .filter(date => date >= thirtyDaysAgo).length;
  }

  private estimateChurnRate(): number {
    // Simple churn estimation based on transaction frequency
    const customerTransactions = new Map<string, Date[]>();
    
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const customerName = this.extractCustomerName(t.description);
        if (customerName) {
          const existing = customerTransactions.get(customerName) || [];
          existing.push(t.date);
          customerTransactions.set(customerName, existing);
        }
      });
    
    const customersWithMultipleTransactions = Array.from(customerTransactions.values())
      .filter(dates => dates.length > 1);
    
    if (customersWithMultipleTransactions.length === 0) return 0;
    
    const churnedCustomers = customersWithMultipleTransactions.filter(dates => {
      const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());
      const lastTransaction = sortedDates[0];
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      return lastTransaction < ninetyDaysAgo;
    }).length;
    
    return customersWithMultipleTransactions.length > 0 
      ? churnedCustomers / customersWithMultipleTransactions.length 
      : 0;
  }

  private extractCustomerName(description: string): string | null {
    // Simple customer name extraction from transaction descriptions
    const patterns = [
      /client\s+([^-]+)/i,
      /customer\s+([^-]+)/i,
      /from\s+([^-]+)/i,
      /payment\s+from\s+([^-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractProductDataFromDescriptions(): Array<{
    name: string;
    revenue: number;
    quantity: number;
    margin?: number;
  }> {
    const productMap = new Map<string, { revenue: number; quantity: number }>();
    
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const productName = this.extractProductName(t.description);
        if (productName) {
          const existing = productMap.get(productName) || { revenue: 0, quantity: 0 };
          existing.revenue += t.amount;
          existing.quantity += 1;
          productMap.set(productName, existing);
        }
      });
    
    return Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      quantity: data.quantity
    }));
  }

  private extractProductName(description: string): string | null {
    // Simple product name extraction
    const patterns = [
      /order.*?-\s*([^-]+)/i,
      /payment.*?-\s*([^-]+)/i,
      /for\s+([^-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private groupByPeriod(transactions: Transaction[]): Record<string, number> {
    const periods: Record<string, number> = {};
    
    transactions.forEach(t => {
      const month = t.date.toISOString().slice(0, 7); // YYYY-MM
      periods[month] = (periods[month] || 0) + t.amount;
    });
    
    return periods;
  }

  private groupByCategory(transactions: Transaction[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    return categories;
  }

  private estimateCustomersByPeriod(): Record<string, number> {
    const periods: Record<string, number> = {};
    
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const month = t.date.toISOString().slice(0, 7);
        const customerName = this.extractCustomerName(t.description);
        if (customerName) {
          if (!periods[month]) periods[month] = 0;
          // Only count unique customers per period
          if (!periods[`${month}_${customerName}`]) {
            periods[month]++;
            periods[`${month}_${customerName}`] = 1;
          }
        }
      });
    
    // Clean up temporary keys
    Object.keys(periods).forEach(key => {
      if (key.includes('_')) {
        delete periods[key];
      }
    });
    
    return periods;
  }
}

// Shopify data adapter
export class ShopifyDataAdapter implements DataAdapter {
  source: DataSource = 'shopify';
  private transactions: Transaction[];
  private shopifyOrders: ShopifyOrder[];

  constructor(transactions: Transaction[], shopifyOrders: ShopifyOrder[] = []) {
    this.transactions = transactions;
    this.shopifyOrders = shopifyOrders;
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  getRevenueData(): RevenueData {
    const shopifyTransactions = this.transactions.filter(t => t.source === 'shopify');
    const totalRevenue = shopifyTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Shopify provides better data for recurring revenue detection
    const recurringRevenue = this.calculateShopifyRecurringRevenue();
    const oneTimeRevenue = totalRevenue - recurringRevenue;
    
    const averageOrderValue = shopifyTransactions.length > 0 
      ? totalRevenue / shopifyTransactions.length 
      : 0;

    return {
      totalRevenue,
      recurringRevenue,
      oneTimeRevenue,
      averageOrderValue,
      revenueByPeriod: this.groupByPeriod(shopifyTransactions),
      revenueByCategory: this.groupByCategory(shopifyTransactions)
    };
  }

  getExpenseData(): ExpenseData {
    // Shopify transactions are mostly revenue, but we can identify refunds as expenses
    const refundTransactions = this.transactions.filter(t => 
      t.source === 'shopify' && t.type === 'expense'
    );
    
    const totalExpenses = refundTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalExpenses,
      operatingExpenses: 0, // Shopify doesn't provide expense data
      costOfGoods: 0, // Would need to be entered manually
      expensesByCategory: this.groupByCategory(refundTransactions),
      expensesByPeriod: this.groupByPeriod(refundTransactions)
    };
  }

  getCustomerData(): CustomerData {
    const uniqueCustomers = this.shopifyOrders
      .map(order => order.customer.id)
      .filter((id, index, arr) => arr.indexOf(id) === index).length;
    
    const activeCustomers = this.getActiveShopifyCustomers();
    const newCustomers = this.getNewShopifyCustomers();
    const customerLifetimeValue = this.calculateShopifyCustomerLifetimeValue();
    const churnRate = this.calculateShopifyChurnRate();

    return {
      totalCustomers: uniqueCustomers,
      activeCustomers,
      newCustomers,
      customerLifetimeValue,
      churnRate,
      customersByPeriod: this.getShopifyCustomersByPeriod()
    };
  }

  getProductData(): ProductData {
    const productMap = new Map<string, { revenue: number; quantity: number }>();
    
    this.shopifyOrders.forEach(order => {
      order.line_items.forEach(item => {
        const existing = productMap.get(item.title) || { revenue: 0, quantity: 0 };
        existing.revenue += parseFloat(item.price) * item.quantity;
        existing.quantity += item.quantity;
        productMap.set(item.title, existing);
      });
    });
    
    const products = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      quantity: data.quantity
    }));

    return {
      totalProducts: products.length,
      topSellingProducts: products
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      productPerformance: products.reduce((acc, product) => {
        acc[product.name] = {
          revenue: product.revenue,
          quantity: product.quantity,
          margin: 0 // Would need cost data to calculate margin
        };
        return acc;
      }, {} as Record<string, any>)
    };
  }

  isDataAvailable(): boolean {
    return this.transactions.some(t => t.source === 'shopify') || this.shopifyOrders.length > 0;
  }

  // Shopify-specific helper methods
  private calculateShopifyRecurringRevenue(): number {
    // Look for subscription-related transactions
    const subscriptionTransactions = this.transactions.filter(t => 
      t.source === 'shopify' && 
      t.description.toLowerCase().includes('subscription')
    );
    
    return subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private getActiveShopifyCustomers(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = this.shopifyOrders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );
    
    const customerIds = recentOrders
      .map(order => order.customer.id)
      .filter((id, index, arr) => arr.indexOf(id) === index);
    
    return customerIds.length;
  }

  private getNewShopifyCustomers(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const customerFirstOrders = new Map<number, Date>();
    
    this.shopifyOrders.forEach(order => {
      const existing = customerFirstOrders.get(order.customer.id);
      const orderDate = new Date(order.created_at);
      
      if (!existing || orderDate < existing) {
        customerFirstOrders.set(order.customer.id, orderDate);
      }
    });
    
    return Array.from(customerFirstOrders.values())
      .filter(date => date >= thirtyDaysAgo).length;
  }

  private calculateShopifyCustomerLifetimeValue(): number {
    const customerRevenue = new Map<number, number>();
    
    this.shopifyOrders.forEach(order => {
      const existing = customerRevenue.get(order.customer.id) || 0;
      customerRevenue.set(order.customer.id, existing + parseFloat(order.total_price));
    });
    
    const totalRevenue = Array.from(customerRevenue.values()).reduce((sum, revenue) => sum + revenue, 0);
    const uniqueCustomers = customerRevenue.size;
    
    return uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
  }

  private calculateShopifyChurnRate(): number {
    const customerLastOrders = new Map<number, Date>();
    
    this.shopifyOrders.forEach(order => {
      const existing = customerLastOrders.get(order.customer.id);
      const orderDate = new Date(order.created_at);
      
      if (!existing || orderDate > existing) {
        customerLastOrders.set(order.customer.id, orderDate);
      }
    });
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const churnedCustomers = Array.from(customerLastOrders.values())
      .filter(date => date < ninetyDaysAgo).length;
    
    return customerLastOrders.size > 0 ? churnedCustomers / customerLastOrders.size : 0;
  }

  private getShopifyCustomersByPeriod(): Record<string, number> {
    const periods: Record<string, number> = {};
    
    this.shopifyOrders.forEach(order => {
      const month = new Date(order.created_at).toISOString().slice(0, 7);
      const customerId = order.customer.id;
      
      if (!periods[month]) periods[month] = 0;
      if (!periods[`${month}_${customerId}`]) {
        periods[month]++;
        periods[`${month}_${customerId}`] = 1;
      }
    });
    
    // Clean up temporary keys
    Object.keys(periods).forEach(key => {
      if (key.includes('_')) {
        delete periods[key];
      }
    });
    
    return periods;
  }

  private groupByPeriod(transactions: Transaction[]): Record<string, number> {
    const periods: Record<string, number> = {};
    
    transactions.forEach(t => {
      const month = t.date.toISOString().slice(0, 7);
      periods[month] = (periods[month] || 0) + t.amount;
    });
    
    return periods;
  }

  private groupByCategory(transactions: Transaction[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    return categories;
  }
}

// Combined data adapter (for users with multiple data sources)
export class CombinedDataAdapter implements DataAdapter {
  source: DataSource = 'combined';
  private adapters: DataAdapter[];

  constructor(adapters: DataAdapter[]) {
    this.adapters = adapters;
  }

  getTransactions(): Transaction[] {
    return this.adapters.flatMap(adapter => adapter.getTransactions());
  }

  getRevenueData(): RevenueData {
    const allRevenueData = this.adapters.map(adapter => adapter.getRevenueData());
    
    return {
      totalRevenue: allRevenueData.reduce((sum, data) => sum + data.totalRevenue, 0),
      recurringRevenue: allRevenueData.reduce((sum, data) => sum + data.recurringRevenue, 0),
      oneTimeRevenue: allRevenueData.reduce((sum, data) => sum + data.oneTimeRevenue, 0),
      averageOrderValue: this.calculateCombinedAverageOrderValue(allRevenueData),
      revenueByPeriod: this.combinePeriodData(allRevenueData.map(d => d.revenueByPeriod)),
      revenueByCategory: this.combineCategoryData(allRevenueData.map(d => d.revenueByCategory))
    };
  }

  getExpenseData(): ExpenseData {
    const allExpenseData = this.adapters.map(adapter => adapter.getExpenseData());
    
    return {
      totalExpenses: allExpenseData.reduce((sum, data) => sum + data.totalExpenses, 0),
      operatingExpenses: allExpenseData.reduce((sum, data) => sum + data.operatingExpenses, 0),
      costOfGoods: allExpenseData.reduce((sum, data) => sum + data.costOfGoods, 0),
      expensesByCategory: this.combineCategoryData(allExpenseData.map(d => d.expensesByCategory)),
      expensesByPeriod: this.combinePeriodData(allExpenseData.map(d => d.expensesByPeriod))
    };
  }

  getCustomerData(): CustomerData {
    const allCustomerData = this.adapters.map(adapter => adapter.getCustomerData());
    
    return {
      totalCustomers: this.calculateCombinedUniqueCustomers(allCustomerData),
      activeCustomers: this.calculateCombinedActiveCustomers(allCustomerData),
      newCustomers: allCustomerData.reduce((sum, data) => sum + data.newCustomers, 0),
      customerLifetimeValue: this.calculateCombinedCustomerLifetimeValue(allCustomerData),
      churnRate: this.calculateCombinedChurnRate(allCustomerData),
      customersByPeriod: this.combinePeriodData(allCustomerData.map(d => d.customersByPeriod))
    };
  }

  getProductData(): ProductData {
    const allProductData = this.adapters.map(adapter => adapter.getProductData());
    
    // Combine product data from all sources
    const combinedProducts = new Map<string, { revenue: number; quantity: number; margin?: number }>();
    
    allProductData.forEach(data => {
      data.topSellingProducts.forEach(product => {
        const existing = combinedProducts.get(product.name) || { revenue: 0, quantity: 0 };
        existing.revenue += product.revenue;
        existing.quantity += product.quantity;
        combinedProducts.set(product.name, existing);
      });
    });
    
    const products = Array.from(combinedProducts.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      quantity: data.quantity,
      margin: data.margin
    }));

    return {
      totalProducts: products.length,
      topSellingProducts: products
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      productPerformance: products.reduce((acc, product) => {
        acc[product.name] = {
          revenue: product.revenue,
          quantity: product.quantity,
          margin: product.margin || 0
        };
        return acc;
      }, {} as Record<string, any>)
    };
  }

  isDataAvailable(): boolean {
    return this.adapters.some(adapter => adapter.isDataAvailable());
  }

  // Helper methods for combining data
  private calculateCombinedAverageOrderValue(revenueData: RevenueData[]): number {
    const totalRevenue = revenueData.reduce((sum, data) => sum + data.totalRevenue, 0);
    const totalTransactions = this.getTransactions().filter(t => t.type === 'income').length;
    
    return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  }

  private calculateCombinedUniqueCustomers(customerData: CustomerData[]): number {
    // This is a simplified calculation - in practice, you'd need to deduplicate customers across sources
    return Math.max(...customerData.map(data => data.totalCustomers));
  }

  private calculateCombinedActiveCustomers(customerData: CustomerData[]): number {
    return customerData.reduce((sum, data) => sum + data.activeCustomers, 0);
  }

  private calculateCombinedCustomerLifetimeValue(customerData: CustomerData[]): number {
    const totalCustomers = this.calculateCombinedUniqueCustomers(customerData);
    const totalRevenue = this.getRevenueData().totalRevenue;
    
    return totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  }

  private calculateCombinedChurnRate(customerData: CustomerData[]): number {
    const totalCustomers = customerData.reduce((sum, data) => sum + data.totalCustomers, 0);
    const totalChurned = customerData.reduce((sum, data) => sum + (data.churnRate * data.totalCustomers), 0);
    
    return totalCustomers > 0 ? totalChurned / totalCustomers : 0;
  }

  private combinePeriodData(periodDataArray: Record<string, number>[]): Record<string, number> {
    const combined: Record<string, number> = {};
    
    periodDataArray.forEach(periodData => {
      Object.entries(periodData).forEach(([period, value]) => {
        combined[period] = (combined[period] || 0) + value;
      });
    });
    
    return combined;
  }

  private combineCategoryData(categoryDataArray: Record<string, number>[]): Record<string, number> {
    const combined: Record<string, number> = {};
    
    categoryDataArray.forEach(categoryData => {
      Object.entries(categoryData).forEach(([category, value]) => {
        combined[category] = (combined[category] || 0) + value;
      });
    });
    
    return combined;
  }
}

// Factory function to create appropriate data adapter
export function createDataAdapter(
  transactions: Transaction[],
  shopifyOrders: ShopifyOrder[] = []
): DataAdapter {
  const hasShopifyData = transactions.some(t => t.source === 'shopify') || shopifyOrders.length > 0;
  const hasManualData = transactions.some(t => t.source === 'manual');
  
  if (hasShopifyData && hasManualData) {
    return new CombinedDataAdapter([
      new ShopifyDataAdapter(transactions, shopifyOrders),
      new ManualDataAdapter(transactions)
    ]);
  } else if (hasShopifyData) {
    return new ShopifyDataAdapter(transactions, shopifyOrders);
  } else {
    return new ManualDataAdapter(transactions);
  }
}
