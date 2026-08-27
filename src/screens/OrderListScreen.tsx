import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FilterModal from '../components/FilterModal';
import OrderRow from '../components/OrderRow';
import { STATUSES, initials } from '../data/constants';
import { colors, radius } from '../theme';
import type { Order, OrderStatus } from '../types/order';
import type { StatusCounts } from '../api/orders';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  orders: Order[];
  onOpen: (id: string) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  error: string;
  dateFrom: Date;
  dateTo: Date;
  onChangeDateFrom: (d: Date) => void;
  onChangeDateTo: (d: Date) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onScanPress: () => void;
  currentUserName: string;
  onLogout: () => void;
  search: string;
  onChangeSearch: (q: string) => void;
  filter: OrderStatus | null;
  onChangeFilter: (f: OrderStatus | null) => void;
  counts: StatusCounts;
  chayCuaOnly: boolean;
  onChangeChayCuaOnly: (v: boolean) => void;
}

export default function OrderListScreen({
  orders, onOpen, loading, loadingMore, hasMore, total, error, dateFrom, dateTo,
  onChangeDateFrom, onChangeDateTo, onRetry, onLoadMore, onScanPress,
  currentUserName, onLogout, search, onChangeSearch, filter, onChangeFilter, counts,
  chayCuaOnly, onChangeChayCuaOnly,
}: Props) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const today = toISODate(new Date());
  const isDateDefault = toISODate(dateFrom) === today && toISODate(dateTo) === today;
  const activeFilterCount = (isDateDefault ? 0 : 1) + (filter ? 1 : 0) + (chayCuaOnly ? 1 : 0);

  const listTitle = filter ? STATUSES.find((s) => s.id === filter)!.name : 'Tất cả đơn hàng';

  function handleClearAll() {
    const now = new Date();
    onChangeDateFrom(now);
    onChangeDateTo(now);
    onChangeFilter(null);
    onChangeChayCuaOnly(false);
    setFilterModalOpen(false);
  }

  return (
    <>
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={orders}
      keyExtractor={(o) => o.id}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View>
          <View style={styles.topbar}>
            <View style={styles.brand}>
              <View style={styles.logo}><Text style={styles.logoText}>HT</Text></View>
              <View>
                <Text style={styles.h1}>Quản lý đơn hàng</Text>
                <Text style={styles.sub}>Kho tầng 3</Text>
              </View>
            </View>
          </View>
          <View style={styles.userRow}>
            <View style={styles.userChip}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials(currentUserName)}</Text></View>
              <Text style={styles.userChipText}>{currentUserName}</Text>
            </View>
            <Pressable style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={16} color={colors.text2} />
              <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.text3} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm mã đơn, tên khách, SĐT"
                placeholderTextColor={colors.text3}
                value={search}
                onChangeText={onChangeSearch}
              />
            </View>
            <Pressable style={styles.scanBtn} onPress={onScanPress}>
              <Ionicons name="barcode-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <Pressable style={styles.filterBtn} onPress={() => setFilterModalOpen(true)}>
            <Ionicons name="options-outline" size={18} color={colors.text} />
            <Text style={styles.filterBtnText}>Bộ lọc</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.blue} size="small" />
              <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
            </View>
          )}
          {!!error && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{listTitle} ({total})</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => <OrderRow order={item} onPress={() => onOpen(item.id)} />}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={colors.blue} size="small" />
          </View>
        ) : !loading && orders.length > 0 && !hasMore ? (
          <Text style={styles.footerEnd}>— Hết danh sách —</Text>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Không tìm thấy đơn hàng phù hợp</Text></View>
        ) : null
      }
      ItemSeparatorComponent={() => null}
    />
    <FilterModal
      visible={filterModalOpen}
      onClose={() => setFilterModalOpen(false)}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onChangeDateFrom={onChangeDateFrom}
      onChangeDateTo={onChangeDateTo}
      filter={filter}
      onChangeFilter={onChangeFilter}
      counts={counts}
      chayCuaOnly={chayCuaOnly}
      onChangeChayCuaOnly={onChangeChayCuaOnly}
      onClearAll={handleClearAll}
    />
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topbar: { marginBottom: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  h1: { fontSize: 18, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12.5, color: colors.text3, marginTop: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  logoutBtnText: { fontSize: 12.5, color: colors.text2, fontWeight: '600' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.purpleBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '700', color: colors.purpleText },
  userChipText: { fontSize: 12.5, color: colors.text2 },
  searchWrap: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.text },
  scanBtn: { width: 46, height: 46, borderRadius: radius, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 40, marginBottom: 20 },
  filterBtnText: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  filterBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  loadingText: { fontSize: 13, color: colors.text3 },
  errorBox: { backgroundColor: '#fdecec', borderWidth: 1, borderColor: '#f3c2c2', borderRadius: radius, padding: 12, marginBottom: 16 },
  errorText: { color: '#a33', fontSize: 13, marginBottom: 8 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: '#a33', borderRadius: radius, paddingHorizontal: 14, paddingVertical: 7 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.text3, fontSize: 14 },
  footerLoading: { paddingVertical: 20 },
  footerEnd: { textAlign: 'center', color: colors.text3, fontSize: 12, paddingVertical: 20 },
});
