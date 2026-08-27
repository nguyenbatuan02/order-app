import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import StatusGrid from './StatusGrid';
import { colors, radius } from '../theme';
import type { OrderStatus } from '../types/order';
import type { StatusCounts } from '../api/orders';

function toDisplayDate(d: Date): string {
  return d.toLocaleDateString('vi-VN');
}

interface Props {
  visible: boolean;
  onClose: () => void;
  dateFrom: Date;
  dateTo: Date;
  onChangeDateFrom: (d: Date) => void;
  onChangeDateTo: (d: Date) => void;
  filter: OrderStatus | null;
  onChangeFilter: (f: OrderStatus | null) => void;
  counts: StatusCounts;
  chayCuaOnly: boolean;
  onChangeChayCuaOnly: (v: boolean) => void;
  onClearAll: () => void;
}

export default function FilterModal({
  visible, onClose, dateFrom, dateTo, onChangeDateFrom, onChangeDateTo,
  filter, onChangeFilter, counts, chayCuaOnly, onChangeChayCuaOnly, onClearAll,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState<'from' | 'to' | null>(null);

  function onPickerChange(kind: 'from' | 'to', event: unknown, selected?: Date) {
    if (Platform.OS === 'android') setPickerOpen(null);
    if (!selected) return;
    if (kind === 'from') onChangeDateFrom(selected);
    else onChangeDateTo(selected);
  }

  function toggleFilter(id: OrderStatus) {
    onChangeFilter(filter === id ? null : id);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.head}>
        <Text style={styles.headTitle}>Bộ lọc</Text>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.text2} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>KHOẢNG NGÀY</Text>
        <View style={styles.dateRow}>
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

        <Text style={styles.sectionLabel}>TRẠNG THÁI</Text>
        <StatusGrid counts={counts} activeFilter={filter} onSelect={toggleFilter} />
      </ScrollView>

      <View style={styles.foot}>
        <Pressable style={styles.clearBtn} onPress={onClearAll}>
          <Text style={styles.clearBtnText}>Xóa bộ lọc</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={onClose}>
          <Text style={styles.applyBtnText}>Áp dụng</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, backgroundColor: colors.bg },
  bodyContent: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, color: colors.text3, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dateInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 8, height: 54, justifyContent: 'center' },
  dateInputLabel: { fontSize: 11, color: colors.text3, marginBottom: 2 },
  dateInputValue: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  pickerDoneBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  pickerDoneBtnText: { color: colors.blueText, fontWeight: '700', fontSize: 14 },
  chayCuaToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 44, marginBottom: 24 },
  chayCuaToggleActive: { backgroundColor: colors.amberBg, borderColor: colors.amber },
  chayCuaToggleText: { fontSize: 13.5, color: colors.text2, fontWeight: '600' },
  chayCuaToggleTextActive: { color: colors.amberText },
  foot: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  clearBtn: { flex: 1, height: 46, borderRadius: radius, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  applyBtn: { flex: 1, height: 46, borderRadius: radius, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
