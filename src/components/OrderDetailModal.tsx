import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUSES } from '../data/constants';
import { colors, colorSets, radius } from '../theme';
import { Badge, MiniBadge } from './Badge';
import Timeline from './Timeline';
import type { Order, OrderItem } from '../types/order';

type CompleteMode = 'full' | 'edit';
type Diff = { name: string; req: number; val: number };
type ItemQty = { rowId: string; itemCode: string; quantity: number };

interface Props {
  order: Order | null;
  saving: boolean;
  onClose: () => void;
  onCompleteSimple: (id: string, items: ItemQty[], diffs: Diff[]) => void;
  onCompleteNoibo: (id: string, mode: CompleteMode, diffs: Diff[]) => void;
  onCompleteChaycua: (id: string) => void;
}

function hasChaycua(o: Order) { return o.items.some((it) => it.type === 'chaycua'); }
function hasNoibo(o: Order) { return o.items.some((it) => it.type === 'noibo'); }
function noiboAllDone(o: Order) { return o.items.filter((it) => it.type === 'noibo').every((it) => it.done); }
function chaycuaAllDone(o: Order) { return o.items.filter((it) => it.type === 'chaycua').every((it) => it.done); }

export default function OrderDetailModal({ order, saving, onClose, onCompleteSimple, onCompleteNoibo, onCompleteChaycua }: Props) {
  const [completeMode, setCompleteMode] = useState<CompleteMode>('full');
  const [qtys, setQtys] = useState<number[]>([]);
  const [enabled, setEnabled] = useState<boolean[]>([]);
  const [nbEditing, setNbEditing] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCompleteMode('full');
    setQtys(order.items.map((it) => it.req));
    setEnabled(order.items.map(() => false));
    setNbEditing(false);
  }, [order?.id]);

  const activeDiffs: Diff[] = useMemo(() => {
    if (!order) return [];
    const diffs: Diff[] = [];
    order.items.forEach((it, i) => {
      if (!enabled[i]) return;
      if (qtys[i] !== it.req) diffs.push({ name: it.name, req: it.req, val: qtys[i] });
    });
    return diffs;
  }, [order, enabled, qtys]);

  if (!order) return null;

  const s = STATUSES.find((x) => x.id === order.status)!;
  const c = colorSets[s.color];
  const mix = hasChaycua(order) && hasNoibo(order);
  const canComplete = order.status !== 'congno';

  function setMode(mode: CompleteMode) {
    setCompleteMode(mode);
    if (!order) return;
    if (mode === 'full') {
      setQtys(order.items.map((it) => it.req));
      setEnabled(order.items.map(() => false));
    } else {
      setEnabled(order.items.map(() => true));
    }
  }

  function enableEditNoibo() {
    if (!order) return;
    setNbEditing(true);
    setEnabled(order.items.map((it) => it.type === 'noibo'));
  }

  function qtyChange(i: number, val: number) {
    setQtys((prev) => { const next = prev.slice(); next[i] = val; return next; });
  }

  const renderItem = (it: OrderItem, idx: number) => (
    <View style={[styles.itemLine, it.type === 'chaycua' ? styles.itemLineAmber : styles.itemLineTeal]} key={idx}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{it.name}</Text>
        <Text style={styles.itemSub}>{it.sku} · Kệ {it.shelf}</Text>
      </View>
      <View style={styles.qtyCol}>
        <Text style={styles.qtyLabel}>SL yêu cầu</Text>
        <Text style={styles.qtyValue}>{it.req}</Text>
      </View>
      <View style={styles.qtyCol}>
        <Text style={styles.qtyLabel}>SL thực</Text>
        <TextInput
          style={[
            styles.qtyInput,
            enabled[idx] && qtys[idx] !== it.req && styles.qtyInputChanged,
            !enabled[idx] && styles.qtyInputDisabled,
          ]}
          keyboardType="number-pad"
          editable={enabled[idx]}
          value={String(qtys[idx] ?? it.req)}
          onChangeText={(t) => qtyChange(idx, parseInt(t) || 0)}
        />
      </View>
    </View>
  );

  const diffSummary = (diffs: Diff[]) => diffs.length === 0 ? null : (
    <View style={styles.diffBox}>
      <Text style={styles.diffTitle}>Chênh lệch sẽ báo sale ({diffs.length}):</Text>
      {diffs.map((d, i) => (
        <View key={i} style={styles.diffRow}>
          <Text style={styles.diffName} numberOfLines={1}>{d.name}</Text>
          <Text style={styles.diffVal}>{d.req} → {d.val}</Text>
        </View>
      ))}
    </View>
  );

  const noibo = order.items.map((it, i) => ({ it, i })).filter((x) => x.it.type === 'noibo');
  const chaycua = order.items.map((it, i) => ({ it, i })).filter((x) => x.it.type === 'chaycua');

  let completeBlock;
  if (canComplete) {
    if (mix) {
      const nbDone = noiboAllDone(order);
      const ccDone = chaycuaAllDone(order);
      completeBlock = (
        <View style={styles.completeSection}>
          <Text style={styles.sectionLabel}>Hoàn thành theo giai đoạn</Text>
          <View style={[styles.callout, styles.calloutInfo]}>
            <Ionicons name="information-circle-outline" size={17} color={colors.blueText} />
            <Text style={[styles.calloutText, { color: colors.blueText }]}>
              Đơn gộp cả hàng nội bộ và chạy cửa. Hoàn thành phần nội bộ trước; phần chạy cửa xác nhận sau khi hàng mua ngoài về kho.
            </Text>
          </View>

          <View style={[styles.splitBox, nbDone && styles.splitBoxDone]}>
            <View style={styles.splitHead}>
              <View style={styles.splitTitleRow}>
                <MiniBadge bg={colors.tealBg} text={colors.tealText} label="Nội bộ" />
                <Text style={styles.splitTitle}>Hàng có sẵn</Text>
              </View>
              {nbDone && <MiniBadge bg={colors.greenBg} text={colors.greenText} label="Đã xong" />}
            </View>
            <Text style={styles.splitDesc}>Xác nhận đủ số lượng sale yêu cầu cho phần hàng trong kho.</Text>
            {!nbDone && !nbEditing && (
              <View style={styles.rowGap}>
                <Pressable style={[styles.btn, styles.btnTeal, styles.btnSm]} onPress={() => onCompleteNoibo(order.id, 'full', [])}>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={styles.btnTealText}>Hoàn thành đủ SL</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnGhost, styles.btnSm]} onPress={enableEditNoibo}>
                  <Text style={styles.btnGhostText}>Sửa số lượng</Text>
                </Pressable>
              </View>
            )}
            {!nbDone && nbEditing && (
              <View>
                <View style={[styles.callout, styles.calloutWarn, { marginTop: 12 }]}>
                  <Ionicons name="warning-outline" size={17} color={colors.amberText} />
                  <Text style={[styles.calloutText, { color: colors.amberText }]}>Chỉnh ô "SL thực" ở phần hàng nội bộ. Chênh lệch sẽ tự báo sale.</Text>
                </View>
                {diffSummary(activeDiffs)}
                <Pressable style={[styles.btn, styles.btnTeal, styles.btnSm, { marginTop: 12 }]} onPress={() => onCompleteNoibo(order.id, 'edit', activeDiffs)}>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={styles.btnTealText}>Xác nhận phần nội bộ</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={[styles.splitBox, ccDone && styles.splitBoxDone]}>
            <View style={styles.splitHead}>
              <View style={styles.splitTitleRow}>
                <MiniBadge bg={colors.amberBg} text={colors.amberText} label="Chạy cửa" />
                <Text style={styles.splitTitle}>Hàng mua ngoài</Text>
              </View>
              {ccDone
                ? <MiniBadge bg={colors.greenBg} text={colors.greenText} label="Đã về · xong" />
                : <MiniBadge bg={colors.amberBg} text={colors.amberText} label="Chờ hàng về" />}
            </View>
            <Text style={styles.splitDesc}>
              {ccDone ? 'Hàng mua ngoài đã về kho và được xác nhận.' : 'Bấm nút bên dưới khi hàng mua ngoài đã ship về đến kho.'}
            </Text>
            {!ccDone && (
              <>
                <Pressable
                  style={[styles.btn, styles.btnAmber, styles.btnSm, { marginTop: 12 }, !nbDone && styles.btnDisabled]}
                  disabled={!nbDone}
                  onPress={() => onCompleteChaycua(order.id)}
                >
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                  <Text style={styles.btnTealText}>Xác nhận hàng chạy cửa đã về</Text>
                </Pressable>
                {!nbDone && <Text style={styles.hint}>Hoàn thành phần nội bộ trước để mở nút này.</Text>}
              </>
            )}
          </View>
        </View>
      );
    } else {
      completeBlock = (
        <View style={styles.completeSection}>
          <Text style={styles.sectionLabel}>Cơ chế hoàn thành đơn</Text>
          <View style={styles.modeTabs}>
            <Pressable style={[styles.modeTab, completeMode === 'full' && styles.modeTabActive]} onPress={() => setMode('full')}>
              <View style={styles.modeTitleRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={completeMode === 'full' ? colors.tealText : colors.text} />
                <Text style={[styles.modeTitle, completeMode === 'full' && { color: colors.tealText }]}>Hoàn thành toàn bộ</Text>
              </View>
              <Text style={styles.modeDesc}>Xác nhận đủ hàng đúng số lượng sale yêu cầu</Text>
            </Pressable>
            <Pressable style={[styles.modeTab, completeMode === 'edit' && styles.modeTabActive]} onPress={() => setMode('edit')}>
              <View style={styles.modeTitleRow}>
                <Ionicons name="create-outline" size={16} color={completeMode === 'edit' ? colors.tealText : colors.text} />
                <Text style={[styles.modeTitle, completeMode === 'edit' && { color: colors.tealText }]}>Sửa số lượng</Text>
              </View>
              <Text style={styles.modeDesc}>Nhập số thực tế khi kho thiếu/lệch hàng</Text>
            </Pressable>
          </View>
          {completeMode === 'full' ? (
            <View style={[styles.callout, styles.calloutInfo]}>
              <Ionicons name="information-circle-outline" size={17} color={colors.blueText} />
              <Text style={[styles.calloutText, { color: colors.blueText }]}>Toàn bộ sản phẩm được xác nhận đúng số lượng yêu cầu. Đơn chuyển bước tiếp theo ngay.</Text>
            </View>
          ) : (
            <View>
              <View style={[styles.callout, styles.calloutWarn]}>
                <Ionicons name="warning-outline" size={17} color={colors.amberText} />
                <Text style={[styles.calloutText, { color: colors.amberText }]}>Chỉnh ô "SL thực" ở trên. Hệ thống tự báo sale phần chênh lệch để xử lý lại đơn.</Text>
              </View>
              {diffSummary(activeDiffs)}
            </View>
          )}
          <Pressable
            style={[styles.btn, styles.btnTeal, { alignSelf: 'flex-end', marginTop: 16 }, saving && styles.btnDisabled]}
            disabled={saving}
            onPress={() => onCompleteSimple(
              order.id,
              order.items.map((it, i) => ({ rowId: it.rowId, itemCode: it.itemCode, quantity: qtys[i] ?? it.req })),
              activeDiffs
            )}
          >
            <Ionicons name="checkmark" size={17} color="#fff" />
            <Text style={styles.btnTealText}>{saving ? 'Đang lưu...' : 'Xác nhận hoàn thành'}</Text>
          </Pressable>
        </View>
      );
    }
  } else {
    completeBlock = (
      <View style={styles.completeSection}>
        <View style={[styles.callout, styles.calloutTeal]}>
          <Ionicons name="checkmark-circle-outline" size={17} color={colors.tealText} />
          <Text style={[styles.calloutText, { color: colors.tealText }]}>Đơn đã lên công nợ và hoàn tất toàn bộ quy trình.</Text>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={!!order} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalHead}>
        <View style={{ flex: 1 }}>
          <View style={styles.headTitleRow}>
            <Text style={styles.headTitle}>{order.id}</Text>
            {mix && <MiniBadge bg={colors.amberBg} text={colors.amberText} label="Đơn gộp" />}
          </View>
          <Text style={styles.headSub}>Tạo lúc {order.time} · {order.items.length} sản phẩm</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.text2} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Khách hàng</Text><Text style={styles.infoValue}>{order.customer}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Số điện thoại</Text><Text style={styles.infoValue}>{order.phone}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Địa chỉ giao</Text><Text style={styles.infoValue}>{order.addr}</Text></View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <Badge bg={c.bg} text={c.text} dot={c.dot} label={s.name} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Tiến trình xử lý</Text>
        <Timeline order={order} />

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Chi tiết sản phẩm</Text>
        {mix ? (
          <>
            <View style={styles.groupHead}>
              <MiniBadge bg={colors.tealBg} text={colors.tealText} label="Nội bộ" />
              <Text style={styles.groupHeadText}>Hàng có sẵn trong kho</Text>
            </View>
            {noibo.map((x) => renderItem(x.it, x.i))}
            <View style={styles.groupHead}>
              <MiniBadge bg={colors.amberBg} text={colors.amberText} label="Chạy cửa" />
              <Text style={styles.groupHeadText}>Hàng mua ngoài · về sau</Text>
            </View>
            {chaycua.map((x) => renderItem(x.it, x.i))}
          </>
        ) : (
          order.items.map((it, i) => renderItem(it, i))
        )}

        {completeBlock}
      </ScrollView>

      <View style={styles.modalFoot}>
        <Pressable style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={onClose}>
          <Text style={[styles.btnGhostText, { textAlign: 'center', width: '100%' }]}>Đóng</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHead: { flexDirection: 'row', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
  headSub: { fontSize: 13, color: colors.text3, marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, backgroundColor: colors.bg },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  infoItem: { width: '46%' },
  infoLabel: { fontSize: 12, color: colors.text3, marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text2, marginBottom: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  groupHeadText: { fontSize: 13, fontWeight: '700', color: colors.text },
  itemLine: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 9, marginBottom: 8, backgroundColor: colors.surface2, borderLeftWidth: 3 },
  itemLineTeal: { borderLeftColor: colors.teal },
  itemLineAmber: { borderLeftColor: colors.amber },
  itemName: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 12, color: colors.text3, marginTop: 1 },
  qtyCol: { alignItems: 'center', width: 68 },
  qtyLabel: { fontSize: 10.5, color: colors.text3 },
  qtyValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  qtyInput: { width: 56, textAlign: 'center', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 7, paddingVertical: 5, marginTop: 2, color: colors.text },
  qtyInputChanged: { borderColor: colors.amber, backgroundColor: colors.amberBg, color: colors.amberText },
  qtyInputDisabled: { backgroundColor: colors.grayBg, color: colors.text3 },
  diffBox: { marginTop: 10, padding: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  diffTitle: { fontWeight: '700', marginBottom: 6, color: colors.amberText, fontSize: 12.5 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 8 },
  diffName: { color: colors.text2, fontSize: 12.5, flex: 1 },
  diffVal: { color: colors.text, fontWeight: '700', fontSize: 12.5 },
  completeSection: { marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderColor: colors.border },
  callout: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 9, marginBottom: 8 },
  calloutInfo: { backgroundColor: colors.blueBg },
  calloutWarn: { backgroundColor: colors.amberBg },
  calloutTeal: { backgroundColor: colors.tealBg },
  calloutText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  splitBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, padding: 14, marginBottom: 12 },
  splitBoxDone: { backgroundColor: colors.greenBg, borderColor: '#b6e0c4' },
  splitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  splitTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  splitDesc: { fontSize: 12.5, color: colors.text2, lineHeight: 18 },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 12 },
  hint: { fontSize: 12, color: colors.text3, marginTop: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong },
  btnSm: { height: 38 },
  btnTeal: { backgroundColor: colors.teal, borderColor: colors.teal },
  btnTealText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnAmber: { backgroundColor: colors.amber, borderColor: colors.amber },
  btnGhost: { backgroundColor: 'transparent' },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.45 },
  modeTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeTab: { flex: 1, padding: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.surface },
  modeTabActive: { borderColor: colors.teal, backgroundColor: colors.tealBg },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  modeDesc: { fontSize: 11.5, color: colors.text2, marginTop: 5, lineHeight: 16 },
  modalFoot: { padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
});
