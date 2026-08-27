import { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import StatusGrid from '../components/StatusGrid';
import OrderRow from '../components/OrderRow';
import { STATUSES, initials } from '../data/constants';
import { colors, radius } from '../theme';
import type { Order, OrderStatus } from '../types/order';
import type { StatusCounts } from '../api/orders';

function toDisplayDate(d: Date): string {
  return d.toLocaleDateString('vi-VN');
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
  const [pickerOpen, setPickerOpen] = useState<'from' | 'to' | null>(null);

  function onPickerChange(kind: 'from' | 'to', event: unknown, selected?: Date) {
    if (Platform.OS === 'android') setPickerOpen(null);
    if (!selected) return;
    if (kind === 'from') onChangeDateFrom(selected);
    else onChangeDateTo(selected);
  }

  const listTitle = filter ? STATUSES.find((s) => s.id === filter)!.name : 'Tất cả đơn hàng';

  function toggleFilter(id: OrderStatus) {
    onChangeFilter(filter === id ? null : id);
  }

  return (
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

          <Pressable
            style={[styles.chayCuaToggle, chayCuaOnly && styles.chayCuaToggleActive]}
            onPress={() => onChangeChayCuaOnly(!chayCuaOnly)}
          >
            <Ionicons
              name={chayCuaOnly ? 'checkbox' : 'square-outline'}
              size={18}
              color={chayCuaOnly ? colors.amberText : colors.text3}
            />
            <Text style={[styles.chayCuaToggleText, chayCuaOnly && styles.chayCuaToggleTextActive]}>
              Chỉ hiện đơn có hàng chạy cửa
            </Text>
          </Pressable>

          <Text style={styles.sectionLabel}>LỌC THEO KHOẢNG NGÀY</Text>
          <View style={styles.dateSearchRow}>
            <Pressable style={styles.dateInput} onPress={() => setPickerOpen('from')}>
              <Text style={styles.dateInputLabel}>Từ ngày</Text>
              <Text style={styles.dateInputValue}>{toDisplayDate(dateFrom)}</Text>
            </Pressable>
            <Pressable style={styles.dateInput} onPress={() => setPickerOpen('to')}>
              <Text style={styles.dateInputLabel}>Đến ngày</Text>
              <Text style={styles.dateInputValue}>{toDisplayDate(dateTo)}</Text>
            </Pressable>
          </View>

          {pickerOpen && (
            <DateTimePicker
              value={pickerOpen === 'from' ? dateFrom : dateTo}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(e, d) => onPickerChange(pickerOpen, e, d)}
            />
          )}
          {Platform.OS === 'ios' && pickerOpen && (
            <Pressable style={styles.pickerDoneBtn} onPress={() => setPickerOpen(null)}>
              <Text style={styles.pickerDoneBtnText}>Xong</Text>
            </Pressable>
          )}

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

          <Text style={styles.sectionLabel}>TỔNG QUAN TRẠNG THÁI</Text>
          <StatusGrid counts={counts} activeFilter={filter} onSelect={toggleFilter} />

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{listTitle} ({total})</Text>
            {filter && (
              <Pressable style={styles.filterTag} onPress={() => toggleFilter(filter)}>
                <Text style={styles.filterTagText} numberOfLines={1}>Đang lọc: {listTitle}</Text>
                <Ionicons name="close" size={13} color={colors.blueText} />
              </Pressable>
            )}
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
  searchWrap: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.text },
  scanBtn: { width: 46, height: 46, borderRadius: radius, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  chayCuaToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 44, marginBottom: 22 },
  chayCuaToggleActive: { backgroundColor: colors.amberBg, borderColor: colors.amber },
  chayCuaToggleText: { fontSize: 13.5, color: colors.text2, fontWeight: '600' },
  chayCuaToggleTextActive: { color: colors.amberText },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, color: colors.text3, marginBottom: 12 },
  dateSearchRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 8, height: 54, justifyContent: 'center' },
  dateInputLabel: { fontSize: 11, color: colors.text3, marginBottom: 2 },
  dateInputValue: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  pickerDoneBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  pickerDoneBtnText: { color: colors.blueText, fontWeight: '700', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  loadingText: { fontSize: 13, color: colors.text3 },
  errorBox: { backgroundColor: '#fdecec', borderWidth: 1, borderColor: '#f3c2c2', borderRadius: radius, padding: 12, marginBottom: 16 },
  errorText: { color: '#a33', fontSize: 13, marginBottom: 8 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: '#a33', borderRadius: radius, paddingHorizontal: 14, paddingVertical: 7 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  filterTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.blueBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, maxWidth: 220 },
  filterTagText: { fontSize: 12, fontWeight: '600', color: colors.blueText },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.text3, fontSize: 14 },
  footerLoading: { paddingVertical: 20 },
  footerEnd: { textAlign: 'center', color: colors.text3, fontSize: 12, paddingVertical: 20 },
});
