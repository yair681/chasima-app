import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getSocket } from '../services/api';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  green: '#22C55E', greenDeep: '#16A34A', greenSoft: '#F0FDF4',
  red: '#EF4444', redDeep: '#DC2626', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB',
  ink: '#0F172A', ink2: '#334155', ink3: '#64748B', ink4: '#94A3B8',
  line: '#E2E8F0', bg: '#F8FAFC',
};

export default function TasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await api.get('/tasks');
    setTasks(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onPending = (task) => setTasks(ts => [task, ...ts.filter(t => t.id !== task.id)]);
    socket.on('task:pending', onPending);
    return () => socket.off('task:pending', onPending);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const review = async (task, action) => {
    try {
      await api.patch(`/tasks/${task.id}/review`, { action });
      setTasks(ts => ts.map(t => t.id === task.id
        ? { ...t, status: action === 'approve' ? 'completed' : 'rejected' }
        : t
      ));
    } catch (e) { Alert.alert('שגיאה', e.message); }
  };

  const pending = tasks.filter(t => t.status === 'pending_approval');
  const library = tasks.filter(t => t.status === 'active');

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabRow}>
        {[
          { id: 'pending', label: `ממתין לאישור (${pending.length})` },
          { id: 'library', label: 'ספרייה' },
        ].map(tab_ => (
          <TouchableOpacity
            key={tab_.id}
            style={[s.tab, tab === tab_.id && s.tabActive]}
            onPress={() => setTab(tab_.id)}
          >
            <Text style={[s.tabText, tab === tab_.id && s.tabTextActive]}>{tab_.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'pending' && (
          pending.length === 0
            ? <Text style={s.empty}>אין משימות ממתינות לאישור 🎉</Text>
            : pending.map(t => (
              <PendingCard key={t.id} task={t}
                onApprove={() => review(t, 'approve')}
                onReject={() => review(t, 'reject')}
              />
            ))
        )}
        {tab === 'library' && library.map(t => (
          <LibraryCard key={t.id} task={t} />
        ))}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateTask')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function PendingCard({ task, onApprove, onReject }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.kidAvatar}>
          <Text style={s.kidAvatarText}>{task.child_name?.[0]}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle}>{task.title}</Text>
          <Text style={s.cardSub}>{task.child_name} · {new Date(task.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={s.pointsPill}>
          <Text style={s.pointsText}>⭐ +{task.points}</Text>
        </View>
      </View>
      {task.proof && (
        <View style={s.proof}>
          <Text style={s.proofText}>💬 {task.proof}</Text>
        </View>
      )}
      <View style={s.cardActions}>
        <TouchableOpacity style={s.rejectBtn} onPress={onReject}>
          <Text style={s.rejectBtnText}>דחה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.approveBtn} onPress={onApprove}>
          <Text style={s.approveBtnText}>✓ אשר</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LibraryCard({ task }) {
  const EMOJI = { study: '📚', order: '🛏️', help: '❤️', health: '🏃', creative: '🎨', other: '✨' };
  return (
    <View style={[s.card, s.libCard]}>
      <View style={s.libIcon}>
        <Text style={{ fontSize: 20 }}>{EMOJI[task.category] || '✨'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{task.title}</Text>
        <Text style={s.cardSub}>{task.child_name}</Text>
      </View>
      <View style={s.pointsPill}>
        <Text style={s.pointsText}>⭐ +{task.points}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabRow: {
    flexDirection: 'row', margin: 16,
    backgroundColor: C.bg, borderRadius: 14, padding: 4, gap: 4,
    borderWidth: 1, borderColor: C.line,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: C.ink3 },
  tabTextActive: { color: C.ink },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  empty: { textAlign: 'center', color: C.ink4, fontSize: 14, marginTop: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 22,
    borderWidth: 1, borderColor: C.line, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  kidAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.amberSoft, alignItems: 'center', justifyContent: 'center',
  },
  kidAvatarText: { fontSize: 20, fontWeight: '800', color: C.amber },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  cardSub: { fontSize: 12, color: C.ink3, marginTop: 2 },
  pointsPill: {
    backgroundColor: C.greenSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: C.greenDeep },
  proof: { backgroundColor: C.bg, borderRadius: 14, padding: 10, marginBottom: 12 },
  proofText: { fontSize: 12, color: C.ink2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.redSoft,
    alignItems: 'center',
  },
  rejectBtnText: { color: C.redDeep, fontWeight: '700', fontSize: 13 },
  approveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    backgroundColor: C.green, alignItems: 'center',
    shadowColor: C.green, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  libCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  libIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center',
  },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.blueDeep, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.blueDeep, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
