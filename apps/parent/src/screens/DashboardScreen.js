import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getSocket } from '../services/api';
import { useAuth } from '../services/AuthContext';
import MascotBot from '../components/MascotBot';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  green: '#22C55E', greenDeep: '#16A34A', greenSoft: '#F0FDF4',
  red: '#EF4444', redDeep: '#DC2626', redSoft: '#FEF2F2',
  amber: '#F59E0B',
  ink: '#0F172A', ink2: '#334155', ink3: '#64748B', ink4: '#94A3B8',
  line: '#E2E8F0', bg: '#F8FAFC',
};

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [kids, tasks] = await Promise.all([
        api.get('/children'),
        api.get('/tasks'),
      ]);
      setChildren(kids);
      setPendingCount(tasks.filter(t => t.status === 'pending_approval').length);
    } catch (e) {
      Alert.alert('שגיאה', e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onPending = () => {
      setPendingCount(c => c + 1);
      load();
    };
    const onUsage = ({ child_id, minutes_used }) => {
      setChildren(cs => cs.map(c =>
        c.id === child_id
          ? { ...c, minutes_used_today: minutes_used, time_left: Math.max(0, c.daily_quota_minutes - minutes_used) }
          : c
      ));
    };
    socket.on('task:pending', onPending);
    socket.on('screentime:usage_updated', onUsage);
    return () => { socket.off('task:pending', onPending); socket.off('screentime:usage_updated', onUsage); };
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const lockToggle = async (kid) => {
    try {
      await api.patch(`/screentime/${kid.id}/lock`, { locked: !kid.is_locked });
      setChildren(cs => cs.map(c => c.id === kid.id ? { ...c, is_locked: !c.is_locked } : c));
    } catch (e) { Alert.alert('שגיאה', e.message); }
  };

  const addBonus = async (kid) => {
    try {
      await api.patch(`/screentime/${kid.id}/bonus`, { minutes: 15 });
      setChildren(cs => cs.map(c =>
        c.id === kid.id ? { ...c, time_left: c.time_left + 15 } : c
      ));
      Alert.alert('✅', `נוספו 15 דקות ל${kid.name}`);
    } catch (e) { Alert.alert('שגיאה', e.message); }
  };

  const totalTasksToday = children.reduce((s, k) => s + (k.tasks_done_today || 0), 0);

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero banner */}
      <View style={s.hero}>
        <View style={s.heroCircle} />
        <View style={s.heroLeft}>
          <MascotBot size={52} mood="happy" />
        </View>
        <View style={s.heroText}>
          <Text style={s.heroGreeting}>שלום, {user?.name}</Text>
          <Text style={s.heroTitle}>{children.length} ילדים פעילים</Text>
          <Text style={s.heroSub}>{totalTasksToday} משימות הושלמו היום</Text>
        </View>
        {pendingCount > 0 && (
          <TouchableOpacity style={s.badge} onPress={() => navigation.navigate('Tasks')}>
            <Text style={s.badgeText}>{pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Children list */}
      <View style={s.list}>
        {children.map(kid => (
          <ChildCard
            key={kid.id}
            kid={kid}
            onLock={() => lockToggle(kid)}
            onBonus={() => addBonus(kid)}
            onPress={() => navigation.navigate('ScreenTime', { kid })}
          />
        ))}

        <TouchableOpacity style={s.addKid} onPress={() => navigation.navigate('AddChild')}>
          <Text style={s.addKidText}>+ הוסף ילד</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ChildCard({ kid, onLock, onBonus, onPress }) {
  const pct = Math.min(1, (kid.time_left || 0) / (kid.daily_quota_minutes || 120));
  const timeColor = pct > 0.25 ? C.green : C.amber;

  return (
    <View style={s.card}>
      {/* Top row */}
      <TouchableOpacity style={s.cardTop} onPress={onPress} activeOpacity={0.7}>
        <View style={[s.avatar, { backgroundColor: kid.is_locked ? C.redSoft : C.blueSoft }]}>
          <Text style={[s.avatarText, { color: kid.is_locked ? C.redDeep : C.blueDeep }]}>
            {kid.name[0]}
          </Text>
        </View>
        <View style={s.kidInfo}>
          <Text style={s.kidName}>{kid.name}</Text>
          <Text style={s.kidSub}>גיל {kid.age} · {kid.tasks_done_today || 0}/{kid.tasks_total_today || 0} משימות</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: kid.is_locked ? C.redSoft : C.greenSoft }]}>
          <View style={[s.statusDot, { backgroundColor: kid.is_locked ? C.red : C.green }]} />
          <Text style={[s.statusText, { color: kid.is_locked ? C.redDeep : C.greenDeep }]}>
            {kid.is_locked ? 'נעול' : 'פתוח'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Metrics */}
      <View style={s.metrics}>
        <View style={[s.metric, s.metricBorder]}>
          <Text style={s.metricLabel}>⏱ זמן מסך נותר</Text>
          <Text style={s.metricValue}>
            {kid.time_left || 0}<Text style={s.metricUnit}> דק׳</Text>
          </Text>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: timeColor }]} />
          </View>
        </View>
        <View style={s.metric}>
          <Text style={s.metricLabel}>⭐ נקודות</Text>
          <Text style={s.metricValue}>{(kid.points || 0).toLocaleString('he-IL')}</Text>
          <Text style={s.metricSub}>+{kid.points_today || 0} היום</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: kid.is_locked ? C.green : C.red }]}
          onPress={onLock}
        >
          <Text style={s.actionBtnText}>{kid.is_locked ? '🔓 פתח מכשיר' : '🔒 נעל עכשיו'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bonusBtn} onPress={onBonus}>
          <Text style={s.bonusBtnText}>⚡ בונוס +15 דק׳</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  hero: {
    margin: 16, borderRadius: 24, padding: 18,
    backgroundColor: C.blueDeep,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    overflow: 'hidden',
    shadowColor: C.blueDeep, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  heroCircle: {
    position: 'absolute', top: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroLeft: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  heroText: { flex: 1 },
  heroGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  badge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.red,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  list: { paddingHorizontal: 16, gap: 14, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff', borderRadius: 24,
    borderWidth: 1, borderColor: C.line,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800' },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 18, fontWeight: '700', color: C.ink },
  kidSub: { fontSize: 12, color: C.ink3, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  metrics: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: C.line,
  },
  metric: { flex: 1, padding: 14 },
  metricBorder: { borderRightWidth: 1, borderRightColor: C.line },
  metricLabel: { fontSize: 11, color: C.ink3, fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '800', color: C.ink },
  metricUnit: { fontSize: 12, color: C.ink4, fontWeight: '600' },
  metricSub: { fontSize: 11, color: C.ink4, marginTop: 2 },
  progressBg: {
    height: 4, backgroundColor: C.bg,
    borderRadius: 999, marginTop: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },

  actions: {
    flexDirection: 'row', gap: 8,
    padding: 12,
    borderTopWidth: 1, borderTopColor: C.line,
    backgroundColor: C.bg,
  },
  actionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bonusBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: C.blue,
  },
  bonusBtnText: { color: C.blueDeep, fontSize: 14, fontWeight: '700' },

  addKid: {
    borderWidth: 2, borderColor: C.blue, borderStyle: 'dashed',
    borderRadius: 18, padding: 16, alignItems: 'center',
  },
  addKidText: { color: C.blueDeep, fontSize: 15, fontWeight: '700' },
});
