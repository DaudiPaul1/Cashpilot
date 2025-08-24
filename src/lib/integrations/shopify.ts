import { Transaction } from '@/types';

// Shopify API types
export interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: 'paid' | 'pending' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'fulfilled' | 'partial' | 'unfulfilled';
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: ShopifyLineItem[];
  transactions: ShopifyTransaction[];
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  total_discount: string;
}

export interface ShopifyTransaction {
  id: number;
  order_id: number;
  kind: 'sale' | 'refund' | 'void' | 'authorization' | 'capture';
  status: 'success' | 'failure' | 'pending';
  amount: string;
  currency: string;
  gateway: string;
  created_at: string;
}

export interface ShopifyIntegration {
  shopId: string;
  shopName: string;
  accessToken: string;
  isActive: boolean;
  lastSync: Date;
  webhookUrl?: string;
  syncSettings: {
    syncOrders: boolean;
    syncCustomers: boolean;
    syncProducts: boolean;
    syncInventory: boolean;
  };
}

// Shopify API client
export class ShopifyClient {
  private shopDomain: string;
  private accessToken: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://${this.shopDomain}/admin/api/2024-01/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get orders from Shopify
  async getOrders(limit: number = 50, sinceId?: number): Promise<{ orders: ShopifyOrder[] }> {
    let endpoint = `orders.json?limit=${limit}&status=any`;
    if (sinceId) {
      endpoint += `&since_id=${sinceId}`;
    }

    return this.makeRequest(endpoint);
  }

  // Get specific order
  async getOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.makeRequest(`orders/${orderId}.json`);
  }

  // Get shop information
  async getShop(): Promise<{ shop: { id: number; name: string; email: string; domain: string } }> {
    return this.makeRequest('shop.json');
  }

  // Get customers
  async getCustomers(limit: number = 50): Promise<{ customers: any[] }> {
    return this.makeRequest(`customers.json?limit=${limit}`);
  }

  // Get products
  async getProducts(limit: number = 50): Promise<{ products: any[] }> {
    return this.makeRequest(`products.json?limit=${limit}`);
  }
}

// Convert Shopify orders to CashPilot transactions
export function convertShopifyOrderToTransaction(
  order: ShopifyOrder,
  shopName: string
): Transaction {
  const orderDate = new Date(order.created_at);
  const amount = parseFloat(order.total_price);
  
  // Determine transaction type based on financial status
  let type: 'income' | 'expense' | 'transfer' = 'income';
  if (order.financial_status === 'refunded' || order.financial_status === 'partially_refunded') {
    type = 'expense'; // Refunds are expenses
  }

  // Create description from order details
  const itemCount = order.line_items.length;
  const firstItem = order.line_items[0]?.title || 'Unknown Product';
  const description = itemCount === 1 
    ? `Shopify Order #${order.order_number} - ${firstItem}`
    : `Shopify Order #${order.order_number} - ${firstItem} + ${itemCount - 1} more items`;

  // Auto-categorize based on order content
  const category = categorizeShopifyOrder(order);

  return {
    id: `shopify_${order.id}`,
    userId: '', // Will be set by the caller
    date: orderDate,
    amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    currency: order.currency,
    description,
    category,
    type,
    source: 'shopify',
    sourceId: order.id.toString(),
    status: order.financial_status === 'paid' ? 'completed' : 'pending',
    tags: ['shopify', 'ecommerce', 'order'],
    attachments: [],
    createdAt: orderDate,
    updatedAt: new Date(order.updated_at)
  };
}

// Auto-categorize Shopify orders
function categorizeShopifyOrder(order: ShopifyOrder): string {
  // Analyze line items to determine category
  const categories = order.line_items.map(item => {
    const title = item.title.toLowerCase();
    
    if (title.includes('clothing') || title.includes('shirt') || title.includes('dress')) {
      return 'Product Sales';
    }
    if (title.includes('digital') || title.includes('download') || title.includes('ebook')) {
      return 'Digital Products';
    }
    if (title.includes('service') || title.includes('consulting')) {
      return 'Client Services';
    }
    if (title.includes('subscription') || title.includes('membership')) {
      return 'Subscription';
    }
    
    return 'Product Sales'; // Default category
  });

  // Return the most common category, or default
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommon = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return mostCommon ? mostCommon[0] : 'Product Sales';
}

// Sync Shopify data
export async function syncShopifyData(
  shopifyClient: ShopifyClient,
  userId: string,
  lastSyncDate?: Date
): Promise<Transaction[]> {
  try {
    const transactions: Transaction[] = [];
    let sinceId: number | undefined;
    let hasMore = true;
    const limit = 50;

    while (hasMore) {
      const response = await shopifyClient.getOrders(limit, sinceId);
      const orders = response.orders;

      if (orders.length === 0) {
        hasMore = false;
        break;
      }

      for (const order of orders) {
        const orderDate = new Date(order.created_at);
        
        // Skip if order is older than last sync
        if (lastSyncDate && orderDate <= lastSyncDate) {
          continue;
        }

        const transaction = convertShopifyOrderToTransaction(order, 'Shopify Store');
        transaction.userId = userId;
        transactions.push(transaction);
      }

      // Update since_id for next iteration
      sinceId = Math.max(...orders.map(o => o.id));
      
      // If we got fewer orders than requested, we've reached the end
      if (orders.length < limit) {
        hasMore = false;
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error syncing Shopify data:', error);
    throw new Error(`Failed to sync Shopify data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validate Shopify credentials
export async function validateShopifyCredentials(
  shopDomain: string,
  accessToken: string
): Promise<{ isValid: boolean; shopInfo?: any; error?: string }> {
  try {
    const client = new ShopifyClient(shopDomain, accessToken);
    const shopInfo = await client.getShop();
    
    return {
      isValid: true,
      shopInfo: shopInfo.shop
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid credentials'
    };
  }
}
