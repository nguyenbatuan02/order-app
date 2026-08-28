import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderListScreen from './src/screens/OrderListScreen';
import LoginScreen from './src/screens/LoginScreen';
import OrderDetailModal from './src/components/OrderDetailModal';
import BarcodeScannerModal from './src/components/BarcodeScannerModal';
import Toast from './src/components/Toast';
import { STATUSES } from './src/data/constants';
import {
  completeOrderStep, fetchOrders, fetchOrderSummary, fetchShippingSummary, fetchWarehouses, findOrder,
  type OrderStep, type StatusCounts, type ShippingFilter, type ShippingCounts, type WarehouseOption,
} from './src/api/orders';
import { login as apiLogin, logout as apiLogout, type Session } from './src/api/auth';
import { colors } from './src/theme';
import type { Order, OrderStatus } from './src/types/order';

type Diff = { name: string; req: number; val: number };
type ItemQty = { rowId: string; itemCode: string; quantity: number };

const SESSION_KEY = 'session';
const PAGE_SIZE = 20;
const EMPTY_COUNTS: StatusCounts = { tiepnhan: 0, suachờ: 0, chuanbi: 0, donggoi: 0, congno: 0 };
const EMPTY_SHIPPING_COUNTS: ShippingCounts = { TH: 0, EX: 0, PICKUP: 0 };

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setSession(JSON.parse(raw));
      })
      .finally(() => setBootstrapping(false));
  }, []);

  async function handleLogin(ma: string, matKhau: string) {
    const s = await apiLogin(ma, matKhau);
    setSession(s);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  async function handleLogout() {
    if (session) await apiLogout(session.token);
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  if (bootstrapping) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.bootRoot}>
          <ActivityIndicator color={colors.blue} size="large" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={['top']}>
          <LoginScreen onLogin={handleLogin} />
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return <MainApp session={session} onLogout={handleLogout} />;
}

function MainApp({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<StatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [filter, setFilter] = useState<OrderStatus | null>(null);
  const [chayCuaOnly, setChayCuaOnly] = useState(false);
  const [shipping, setShipping] = useState<ShippingFilter>(null);
  const [warehouse, setWarehouse] = useState<string[]>([]);
  const [shippingCounts, setShippingCounts] = useState<ShippingCounts>(EMPTY_SHIPPING_COUNTS);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const genRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const currentOrder = openId ? orders.find((o) => o.id === openId) ?? null : null;
  const hasMore = orders.length < total;

  useEffect(() => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => { if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current); };
  }, [search]);

  async function loadOrders(pageNum: number, reset: boolean) {
    const myGen = genRef.current;
    if (reset) { setLoading(true); setError(''); } else { setLoadingMore(true); }
    try {
      const data = await fetchOrders(
        toISODate(dateFrom), toISODate(dateTo), pageNum, PAGE_SIZE, filter, debouncedSearch, chayCuaOnly, shipping, warehouse
      );
      if (myGen !== genRef.current) return; // kết quả cũ (bộ lọc đã đổi), bỏ qua
      setOrders((prev) => {
        if (reset) return data.orders;
        const existingIds = new Set(prev.map((o) => o.id));
        return [...prev, ...data.orders.filter((o) => !existingIds.has(o.id))];
      });
      setTotal(data.total);
      setPage(pageNum);
    } catch (e) {
      if (myGen === genRef.current) setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      if (myGen === genRef.current) { setLoading(false); setLoadingMore(false); }
      loadingMoreRef.current = false;
    }
  }

  async function loadSummary() {
    try {
      const c = await fetchOrderSummary(toISODate(dateFrom), toISODate(dateTo), debouncedSearch, chayCuaOnly, shipping, warehouse);
      setCounts(c);
    } catch {
      // im lặng bỏ qua lỗi tổng quan, không chặn danh sách chính
    }
  }

  async function loadShippingSummary() {
    try {
      const c = await fetchShippingSummary(toISODate(dateFrom), toISODate(dateTo), debouncedSearch, chayCuaOnly, filter, warehouse);
      setShippingCounts(c);
    } catch {
      // im lặng bỏ qua
    }
  }

  async function loadWarehouses() {
    try {
      const w = await fetchWarehouses(toISODate(dateFrom), toISODate(dateTo), debouncedSearch, chayCuaOnly, filter, shipping);
      setWarehouses(w);
    } catch {
      // im lặng bỏ qua
    }
  }

  function refresh() {
    genRef.current += 1;
    loadingMoreRef.current = false;
    loadOrders(1, true);
    loadSummary();
    loadShippingSummary();
    loadWarehouses();
  }

  useEffect(() => {
    refresh();
  }, [dateFrom, dateTo, filter, debouncedSearch, chayCuaOnly, shipping, warehouse]);

  function handleLoadMore() {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    loadOrders(page + 1, false);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 3000);
  }

  function stepForDocStatus(docStatus: number): OrderStep | null {
    if (docStatus <= 1) return 'kho';
    if (docStatus === 2) return 'donggoi';
    if (docStatus === 3) return 'vanchuyen';
    return null;
  }

  async function handleCompleteSimple(id: string, items: ItemQty[], diffs: Diff[]) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const step = stepForDocStatus(order.docStatus);
    if (!step) {
      showToast('Đơn đã hoàn tất, không có bước tiếp theo');
      return;
    }

    setSaving(true);
    try {
      await completeOrderStep(id, step, session.token, items);
      setOpenId(null);
      if (diffs.length > 0) {
        showToast(`Đã ghi nhận ${diffs.length} SP chênh lệch · ${id}`);
      } else {
        showToast(`Đã hoàn thành ${id} · đủ số lượng`);
      }
      refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi lưu vào cơ sở dữ liệu');
    } finally {
      setSaving(false);
    }
  }

  async function handleScanned(docNo: string) {
    setScannerOpen(false);
    try {
      const order = await findOrder(docNo);

      if (order.docStatus > 1) {
        const s = STATUSES.find((x) => x.id === order.status);
        showToast(`${docNo} đã qua bước nhặt kho (đang: ${s?.name ?? order.status})`);
        return;
      }

      const items = order.items.map((it) => ({ rowId: it.rowId, itemCode: it.itemCode, quantity: it.req }));
      await completeOrderStep(order.id, 'kho', session.token, items);
      showToast(`Đã xác nhận nhặt kho · ${order.id} · ${order.customer}`);
      refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : `Không tìm thấy đơn ${docNo}`);
    }
  }

  // Đơn gộp nội bộ/chạy cửa: dữ liệu thật hiện không phân biệt loại hàng nên nhánh này không kích hoạt trong thực tế.
  function handleCompleteNoibo() {}
  function handleCompleteChaycua() {}

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={{ flex: 1 }}>
          <OrderListScreen
            orders={orders}
            onOpen={setOpenId}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            total={total}
            error={error}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeDateFrom={setDateFrom}
            onChangeDateTo={setDateTo}
            onRetry={refresh}
            onLoadMore={handleLoadMore}
            onScanPress={() => setScannerOpen(true)}
            currentUserName={session.user.ten}
            onLogout={onLogout}
            search={search}
            onChangeSearch={setSearch}
            filter={filter}
            onChangeFilter={setFilter}
            counts={counts}
            chayCuaOnly={chayCuaOnly}
            onChangeChayCuaOnly={setChayCuaOnly}
            shipping={shipping}
            onChangeShipping={setShipping}
            shippingCounts={shippingCounts}
            warehouse={warehouse}
            onChangeWarehouse={setWarehouse}
            warehouses={warehouses}
          />
          <OrderDetailModal
            order={currentOrder}
            saving={saving}
            onClose={() => setOpenId(null)}
            onCompleteSimple={handleCompleteSimple}
            onCompleteNoibo={handleCompleteNoibo}
            onCompleteChaycua={handleCompleteChaycua}
          />
          <BarcodeScannerModal
            visible={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onScanned={handleScanned}
          />
          <Toast message={toastMsg} show={toastShow} />
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bootRoot: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
