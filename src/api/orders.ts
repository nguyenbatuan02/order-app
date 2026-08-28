import type { Order } from '../types/order';

const API_BASE_URL = 'http://161.248.80.30:3001';

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export type ShippingFilter = 'TH' | 'EX' | 'PICKUP' | null;

export async function fetchOrders(
  from: string,
  to: string,
  page: number,
  pageSize: number,
  status?: string | null,
  q?: string,
  chayCua?: boolean,
  shipping?: ShippingFilter,
  warehouse?: string | null
): Promise<OrdersPage> {
  const params = new URLSearchParams({ from, to, page: String(page), pageSize: String(pageSize) });
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
  if (shipping) params.set('shipping', shipping);
  if (warehouse) params.set('warehouse', warehouse);
  const res = await fetch(`${API_BASE_URL}/api/orders/list?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tải đơn hàng (${res.status})`);
  }
  return res.json();
}

export interface StatusCounts {
  tiepnhan: number;
  suachờ: number;
  chuanbi: number;
  donggoi: number;
  congno: number;
}

export async function fetchOrderSummary(
  from: string, to: string, q?: string, chayCua?: boolean, shipping?: ShippingFilter, warehouse?: string | null
): Promise<StatusCounts> {
  const params = new URLSearchParams({ from, to });
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
  if (shipping) params.set('shipping', shipping);
  if (warehouse) params.set('warehouse', warehouse);
  const res = await fetch(`${API_BASE_URL}/api/orders/summary?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tải tổng quan (${res.status})`);
  }
  const data = await res.json();
  return data.counts;
}

export interface ShippingCounts {
  TH: number;
  EX: number;
  PICKUP: number;
}

export async function fetchShippingSummary(
  from: string, to: string, q?: string, chayCua?: boolean, status?: string | null, warehouse?: string | null
): Promise<ShippingCounts> {
  const params = new URLSearchParams({ from, to });
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
  if (status) params.set('status', status);
  if (warehouse) params.set('warehouse', warehouse);
  const res = await fetch(`${API_BASE_URL}/api/orders/shipping-summary?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tải tổng quan vận chuyển (${res.status})`);
  }
  const data = await res.json();
  return data.counts;
}

export interface WarehouseOption {
  code: string;
  name: string;
  count: number;
}

export async function fetchWarehouses(
  from: string, to: string, q?: string, chayCua?: boolean, status?: string | null, shipping?: ShippingFilter
): Promise<WarehouseOption[]> {
  const params = new URLSearchParams({ from, to });
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
  if (status) params.set('status', status);
  if (shipping) params.set('shipping', shipping);
  const res = await fetch(`${API_BASE_URL}/api/orders/warehouses?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tải danh sách kho (${res.status})`);
  }
  const data = await res.json();
  return data.warehouses;
}

export async function findOrder(docNo: string): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/api/orders/find/${encodeURIComponent(docNo)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tra cứu đơn hàng (${res.status})`);
  }
  return res.json();
}

export type OrderStep = 'kho' | 'donggoi' | 'vanchuyen';

export async function completeOrderStep(
  docNo: string,
  step: OrderStep,
  token: string,
  items: { rowId: string; itemCode: string; quantity?: number }[]
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${encodeURIComponent(docNo)}/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ step, items }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi cập nhật đơn hàng (${res.status})`);
  }
}
