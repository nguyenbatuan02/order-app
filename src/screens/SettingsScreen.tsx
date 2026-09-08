import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initials } from '../data/constants';
import { colors, radius } from '../theme';
import { fetchSlaSettings, updateSlaSettings } from '../api/orders';
import type { AuthUser } from '../api/auth';

interface Props {
  user: AuthUser;
  token: string;
  onLogout: () => void;
}

function minutesToHM(total: number): { h: string; m: string } {
  return { h: String(Math.floor(total / 60)), m: String(total % 60) };
}

export default function SettingsScreen({ user, token, onLogout }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');

  useEffect(() => {
    fetchSlaSettings()
      .then((total) => {
        const hm = minutesToHM(total);
        setHours(hm.h);
        setMinutes(hm.m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải cấu hình'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const total = h * 60 + m;
    if (total <= 0) {
      setError('Ngưỡng SLA phải lớn hơn 0');
      return;
    }
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      await updateSlaSettings(total, token);
      setSavedMsg('Đã lưu cấu hình SLA');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Cấu hình</Text>

      <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
      <View style={styles.accountCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(user.ten)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{user.ten}</Text>
          <Text style={styles.accountMeta}>{user.ma} · {user.quyen === 'admin' ? 'Quản trị' : 'Nhân viên'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>SLA GIAO HÀNG TỚI KHÁCH</Text>
      <Text style={styles.sectionDesc}>
        Thời gian tối đa cho phép từ lúc tiếp nhận đơn đến khi hoàn tất vận chuyển. Đơn vượt ngưỡng này sẽ bị đánh dấu trễ SLA.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.slaCard}>
          <View style={styles.slaInputRow}>
            <View style={styles.slaInputCol}>
              <Text style={styles.slaInputLabel}>Giờ</Text>
              <TextInput
                style={styles.slaInput}
                keyboardType="number-pad"
                value={hours}
                onChangeText={setHours}
              />
            </View>
            <View style={styles.slaInputCol}>
              <Text style={styles.slaInputLabel}>Phút</Text>
              <TextInput
                style={styles.slaInput}
                keyboardType="number-pad"
                value={minutes}
                onChangeText={setMinutes}
              />
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {!!savedMsg && <Text style={styles.savedText}>{savedMsg}</Text>}

          <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Lưu cấu hình</Text>}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 100 },
  h1: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, color: colors.text3, marginBottom: 12, marginTop: 8 },
  sectionDesc: { fontSize: 12.5, color: colors.text2, lineHeight: 18, marginBottom: 14 },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, padding: 14, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purpleBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.purpleText },
  accountName: { fontSize: 15, fontWeight: '700', color: colors.text },
  accountMeta: { fontSize: 12.5, color: colors.text3, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.redBg, borderRadius: radius, height: 46, marginBottom: 8 },
  logoutBtnText: { color: colors.red, fontWeight: '700', fontSize: 14 },
  slaCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, padding: 16 },
  slaInputRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  slaInputCol: { flex: 1 },
  slaInputLabel: { fontSize: 11.5, color: colors.text3, marginBottom: 6 },
  slaInput: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 46, fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  errorText: { color: '#a33', fontSize: 12.5, marginBottom: 10 },
  savedText: { color: colors.greenText, fontSize: 12.5, marginBottom: 10 },
  saveBtn: { backgroundColor: colors.blue, borderRadius: radius, height: 46, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
