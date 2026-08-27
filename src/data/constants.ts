import type { StatusDef, StageDef } from '../types/order';

export const STATUSES: StatusDef[] = [
  { id: 'tiepnhan', name: 'Lập phiếu (Tiếp nhận)', color: 'purple', icon: 'file' },
  { id: 'suachờ', name: 'Đơn sửa lại, chờ xử lý', color: 'amber', icon: 'edit' },
  { id: 'chuanbi', name: 'Kho đã chuẩn bị & chuyển xuống', color: 'blue', icon: 'box' },
  { id: 'donggoi', name: 'Đã đóng gói xong', color: 'teal', icon: 'package' },
  { id: 'congno', name: 'Đã lên công nợ', color: 'green', icon: 'check' },
];

export const STAGES: StageDef[] = [
  { key: 'tiepnhan', label: 'Tiếp nhận đơn' },
  { key: 'xacnhan', label: 'Thủ kho xác nhận' },
  { key: 'nhat', label: 'Nhặt hàng' },
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
