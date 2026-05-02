import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, RefreshControl, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getSocket } from '../services/api';
import { useAuth } from '../services/AuthContext';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  green: '#22C55E', greenDeep: '#16A34A', greenSoft: '#F0FDF4',
  ink: '#0F172A', ink3: '#64748B', ink4: '#94A3B8',
  line: '#E2E8F0', bg: '#F8FAFC',
};

const EMOJI = { study: '📚', order: '🛏️', help: '❤️', health: '🏃', creative: '🎨', other: '✨' };

export default function TasksScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(null);

  const load = useCallback(async () => {
    const data = await api.get('/tasks');
    setTasks(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('task:approved', (task) => {
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
      updateUser({ points: (user?.points || 0) + task.points });
      navigation.navigate('Success', { task, totalPoints: (user?.points || 0) + task.points });
    });
    socket.on('task:new', (task) => setTasks(ts => [task, ...ts]));
    return () => { socket.off('task:approved'); socket.off('task:new'); };
  }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const submit = async (task) => {
    setSubmitting(task.id);
    try {
      await api.patch(`/tasks/${task.id}/submit`, { proof: '' });
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: 'pending_approval' } : t));
    } catch (e) {
      Alert.alert('שגיאה', e.message);
    } finally { setSubmitting(null); }
  };

  const active = tasks.filter(t => t.status === 'active');
  const pending = tasks.filter(t => t.status === 'pending_approval');
  const done = tasks.filter(t => t.status === 'completed');

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary chips */}
      <View style={s.chips}>
        <View style={s.chipBlue}><Text style={s.chipBlueText}>{active.length} פתוחות</Text></View>
        <View style={s.chipAmber}><Text style={s.chipAmberText}>{pending.length} ממתינות לאישור</Text></View>
        <View style={s.chipGreen}><Text style={s.chipGreenText}>{done.length} הושלמו</Text></View>
      </View>

      {active.length > 0 && (
        <Section title="פתוחות">
          {active.map(t => (
            <TaskCard key={t.id} task={t}
              onPress={() => submit(t)}
              loading={submitting === t.id}
              btnLabel="סיימתי"
            />
          ))}
        </Section>
      )}

      {pending.length > 0 && (
        <Section title="ממתין לאישור הורה ⏳">
          {pending.map(t => (
            <TaskCard key={t.id} task={t} btnLabel="ממתין..." disabled />
          ))}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="הושלמו היום ✅">
          {done.map(t => (
            <TaskCard key={t.id} task={t} btnLabel="✓" done />
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionList}>{children}</View>
    </View>
  );
}

function TaskCard({ task, onPress, loading, btnLabel, done, disabled }) {
  return (
    <View style={[s.card, done && s.cardDone]}>
      <View style={s.cardIcon}>
        <Text style={{ fontSize: 22 }}>{EMOJI[task.category] || '✨'}</Text>
      </View>
      <View style={s.cardInfo}>
        <Text style={[s.cardTitle, done && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
          {task.title}
        </Text>
        <Text style={s.cardPts}>⭐ +{task.points} נקודות</Text>
      </View>
      <TouchableOpacity
        style={[s.cardBtn, done && s.cardBtnDone, disabled && s.cardBtnDisabled]}
        onPress={onPress}
        disabled={loading || done || disabled}
      >
        <Text style={[s.cardBtnText, done && s.cardBtnTextDone]}>
          {loading ? '...' : btnLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  chips: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  chipBlue: { backgroundColor: C.blueSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipBlueText: { color: C.blueDeep, fontSize: 12, fontWeight: '700' },
  chipAmber: { backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipAmberText: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  chipGreen: { backgroundColor: C.greenSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipGreenText: { color: C.greenDeep, fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: C.ink3, marginBottom: 8, marginTop: 8 },
  sectionList: { gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 22, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardDone: { opacity: 0.65 },
  cardIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: C.ink },
  cardPts: { fontSize: 13, fontWeight: '700', color: C.greenDeep, marginTop: 4 },
  cardBtn: {
    backgroundColor: C.blueDeep, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14,
    shadowColor: C.blueDeep, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
  },
  cardBtnDone: { backgroundColor: C.green, shadowColor: C.green },
  cardBtnDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0 },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardBtnTextDone: { color: '#fff' },
});
