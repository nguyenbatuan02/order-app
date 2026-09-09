import type { StatusDef, StageDef, Order } from '../types/order';

export const STATUSES: StatusDef[] = [
  { id: 'tiepnhan', name: 'Đang nhặt hàng', color: 'purple', icon: 'file' },
  { id: 'suachờ', name: 'Đơn sửa lại, chờ xử lý', color: 'amber', icon: 'edit' },
  { id: 'chuanbi', name: 'Đã đủ hàng', color: 'blue', icon: 'box' },
  { id: 'donggoi', name: 'Đã đóng gói xong', color: 'teal', icon: 'package' },
  { id: 'congno', name: 'Đã lên công nợ', color: 'green', icon: 'check' },
  { id: 'huy', name: 'Đã hủy', color: 'red', icon: 'edit' },
];

// Nhãn hiển thị theo từng đơn cụ thể — riêng "Đang nhặt hàng" đổi thành
// "Đang nhặt hàng và chờ chạy cửa" nếu đơn có sản phẩm chạy cửa (mã -CC).
export function statusLabel(order: Order): string {
  if (order.status === 'tiepnhan' && order.items.some((it) => it.type === 'chaycua')) {
    return 'Đang nhặt hàng và chờ chạy cửa';
  }
  return STATUSES.find((s) => s.id === order.status)?.name ?? order.status;
}

export const STAGES: StageDef[] = [
  { key: 'tiepnhan', label: 'Tiếp nhận đơn' },
  { key: 'xacnhan', label: 'Đang nhặt kho' },
  { key: 'donggoi', label: 'Đóng gói' },
  { key: 'dieuvan', label: 'Điều vận / xuất phiếu' },
];

export const STATUS_ORDER: string[] = ['tiepnhan', 'chuanbi', 'donggoi', 'congno'];

export const CURRENT_EMPLOYEE = 'Nguyễn Văn A';

export function initials(name: string): string {
  const p = name.trim().split(' ').filter(Boolean);
  if (p.length === 0) return '?';
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('vi-VN') + '₫';
}

export function now(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
