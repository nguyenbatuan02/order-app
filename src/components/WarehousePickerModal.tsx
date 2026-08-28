import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import type { WarehouseOption } from '../api/orders';

interface Props {
  visible: boolean;
  onClose: () => void;
  warehouses: WarehouseOption[];
  selected: string[];
  onApply: (codes: string[]) => void;
}

export default function WarehousePickerModal({ visible, onClose, warehouses, selected, onApply }: Props) {
  const [draft, setDraft] = useState<string[]>(selected);

  useEffect(() => {
    if (visible) setDraft(selected);
  }, [visible]);

  function toggle(code: string) {
    setDraft((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    setDraft([]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.head}>
        <Text style={styles.headTitle}>Chọn kho</Text>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.text2} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {warehouses.map((w) => {
          const active = draft.includes(w.code);
          return (
            <Pressable key={w.code} style={styles.row} onPress={() => toggle(w.code)}>
              <Ionicons
                name={active ? 'checkbox' : 'square-outline'}
                size={20}
                color={active ? colors.blue : colors.text3}
              />
              <Text style={[styles.rowText, active && styles.rowTextActive]} numberOfLines={2}>
                {w.name} <Text style={styles.rowCount}>({w.count})</Text>
              </Text>
            </Pressable>
          );
        })}

        {warehouses.length === 0 && (
          <Text style={styles.emptyText}>Không có kho nào trong khoảng ngày đang chọn</Text>
        )}
      </ScrollView>

      <View style={styles.foot}>
        <Pressable style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Bỏ chọn hết</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>Áp dụng{draft.length > 0 ? ` (${draft.length})` : ''}</Text>
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
  bodyContent: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  rowText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  rowTextActive: { color: colors.blueText, fontWeight: '700' },
  rowCount: { color: colors.text3, fontWeight: '400' },
  emptyText: { textAlign: 'center', color: colors.text3, fontSize: 13, marginTop: 30 },
  foot: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  clearBtn: { flex: 1, height: 46, borderRadius: radius, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  applyBtn: { flex: 1, height: 46, borderRadius: radius, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
