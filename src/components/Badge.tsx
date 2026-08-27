import { StyleSheet, Text, View } from 'react-native';

export function Badge({ bg, text, dot, label }: { bg: string; text: string; dot: string; label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: text }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function MiniBadge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <View style={[styles.mini, { backgroundColor: bg }]}>
      <Text style={[styles.miniLabel, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 11.5, fontWeight: '600' },
  mini: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  miniLabel: { fontSize: 11, fontWeight: '700' },
});
