import type { Order } from '../types/order';

const API_BASE_URL = 'http://161.248.80.30:3001';

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchOrders(
  from: string,
  to: string,
  page: number,
  pageSize: number,
  status?: string | null,
  q?: string,
  chayCua?: boolean
): Promise<OrdersPage> {
  const params = new URLSearchParams({ from, to, page: String(page), pageSize: String(pageSize) });
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
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

export async function fetchOrderSummary(from: string, to: string, q?: string, chayCua?: boolean): Promise<StatusCounts> {
  const params = new URLSearchParams({ from, to });
  if (q) params.set('q', q);
  if (chayCua) params.set('chayCua', '1');
  const res = await fetch(`${API_BASE_URL}/api/orders/summary?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi tải tổng quan (${res.status})`);
  }
  const data = await res.json();
  return data.counts;
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
