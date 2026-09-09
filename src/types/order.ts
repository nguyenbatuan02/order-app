export type ItemType = 'noibo' | 'chaycua';

export interface OrderItem {
  rowId: string;
  itemCode: string;
  name: string;
  sku: string;
  req: number;
  shelf: string;
  type: ItemType;
  price: number;
  done: boolean;
  warehouseCode: string;
  warehouseName: string;
}

export interface LogEntry {
  stage: string;
  person: string;
  time: string;
  note?: string;
}

export type OrderStatus = 'tiepnhan' | 'suachờ' | 'chuanbi' | 'donggoi' | 'congno' | 'huy';

export interface Order {
  id: string;
  docStatus: number;
  customer: string;
  phone: string;
  status: OrderStatus;
  addr: string;
  time: string;
  date: string;
  shipping: string;
  shippingLabel: string;
  warehouseCode: string;
  warehouseName: string;
  slaMinutes: number | null;
  slaStatus: 'on_time' | 'late' | 'in_progress' | 'at_risk' | 'unknown';
  slaThresholdMinutes: number;
  items: OrderItem[];
  log: LogEntry[];
}

export type ColorKey = 'purple' | 'amber' | 'blue' | 'teal' | 'green' | 'red';
export type IconKey = 'file' | 'edit' | 'box' | 'package' | 'check';

export interface StatusDef {
  id: OrderStatus;
  name: string;
  color: ColorKey;
  icon: IconKey;
}

export interface StageDef {
  key: string;
  label: string;
}
