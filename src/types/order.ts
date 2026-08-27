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
}

export interface LogEntry {
  stage: string;
  person: string;
  time: string;
  note?: string;
}

export type OrderStatus = 'tiepnhan' | 'suachờ' | 'chuanbi' | 'donggoi' | 'congno';

export interface Order {
  id: string;
  docStatus: number;
  customer: string;
  phone: string;
  status: OrderStatus;
  addr: string;
  time: string;
  date: string;
  items: OrderItem[];
  log: LogEntry[];
}

export type ColorKey = 'purple' | 'amber' | 'blue' | 'teal' | 'green';
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
