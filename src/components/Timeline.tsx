import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STAGES, initials } from '../data/constants';
import { colors } from '../theme';
import type { Order } from '../types/order';

export default function Timeline({ order }: { order: Order }) {
  const doneKeys = order.log.map((l) => l.stage);

  return (
    <View style={{ marginTop: 4 }}>
      {STAGES.map((st, i) => {
        const logEntry = order.log.find((l) => l.stage === st.key);
        const isDone = !!logEntry;
        const isCurrent = !isDone && (i === 0 || doneKeys.includes(STAGES[i - 1].key));
        const isLast = i === STAGES.length - 1;
        const dotStyle = isDone ? styles.dotDone : isCurrent ? styles.dotCurrent : styles.dotPending;

        return (
          <View style={styles.item} key={st.key}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, dotStyle]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : isCurrent ? (
                  <View style={styles.currentInner} />
                ) : (
                  <Text style={styles.dotNumber}>{i + 1}</Text>
                )}
              </View>
              {!isLast && <View style={[styles.line, isDone && styles.lineDone]} />}
            </View>
            <View style={styles.content}>
              <Text style={[styles.stage, !isDone && !isCurrent && styles.stagePending]}>
                {st.label}{isCurrent ? ' · đang xử lý' : ''}
              </Text>
              {logEntry ? (
                <View style={styles.meta}>
                  <View style={styles.person}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(logEntry.person.split('· ')[1] || logEntry.person)}</Text>
                    </View>
                    <Text style={styles.metaText}>{logEntry.person}</Text>
                  </View>
                  <Text style={styles.metaText}>{logEntry.time}</Text>
                  {logEntry.note && <Text style={styles.note}>· {logEntry.note}</Text>}
                </View>
              ) : (
                <Text style={styles.metaText}>Chưa thực hiện</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12 },
  dotCol: { width: 22, alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.green },
  dotCurrent: { backgroundColor: colors.blue },
  dotPending: { backgroundColor: colors.grayBg, borderWidth: 1, borderColor: colors.borderStrong },
  dotNumber: { fontSize: 11, color: colors.text3, fontWeight: '600' },
  currentInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.green },
  content: { flex: 1, paddingBottom: 16 },
  stage: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  stagePending: { color: colors.text3, fontWeight: '500' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 3 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.purpleBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 8.5, fontWeight: '700', color: colors.purpleText },
  metaText: { fontSize: 12, color: colors.text3 },
  note: { fontSize: 12, color: colors.amberText },
});
