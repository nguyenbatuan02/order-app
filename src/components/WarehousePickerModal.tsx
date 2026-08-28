import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import type { WarehouseOption } from '../api/orders';

interface Props {
  visible: boolean;
  onClose: () => void;
  warehouses: WarehouseOption[];
  selected: string | null;
  onSelect: (code: string | null) => void;
}

export default function WarehousePickerModal({ visible, onClose, warehouses, selected, onSelect }: Props) {
  function choose(code: string | null) {
    onSelect(code);
    onClose();
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
        <Pressable style={styles.row} onPress={() => choose(null)}>
          <Ionicons
            name={selected === null ? 'checkbox' : 'square-outline'}
            size={20}
            color={selected === null ? colors.blue : colors.text3}
          />
          <Text style={styles.rowText}>Tất cả các kho</Text>
        </Pressable>

        {warehouses.map((w) => {
          const active = selected === w.code;
          return (
            <Pressable key={w.code} style={styles.row} onPress={() => choose(w.code)}>
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
});
