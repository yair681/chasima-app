import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { api, getSocket } from '../services/api';
import MascotBot from '../components/MascotBot';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  green: '#22C55E', greenDeep: '#16A34A', greenSoft: '#F0FDF4',
  red: '#EF4444', redDeep: '#DC2626', redSoft: '#FEF2F2',
  amber: '#F59E0B',
  ink: '#0F172A', ink3: '#64748B', ink4: '#94A3B8',
  line: '#E2E8F0', bg: '#F8FAFC',
};

const LEVEL_NAMES = ['מתחיל', 'חוקר', 'גיבור', 'אלוף', 'אגדה'];

export default function DashboardScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [tasks, setTasks] = useState([]);

  const level = Math.floor((user?.points || 0) / 50) + 1;
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];

  useEffect(() => {
    (async () => {
      const [p, t] = await Promise.all([
        api.get(`/screentime/${user.id}`),
        api.get('/tasks'),
      ]);
      setPolicy(p);
      setTasks(t);
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('screentime:lock_changed', ({ locked }) => {
      setPolicy(p => p ? { ...p, is_locked: locked } : p);
    });
    socket.on('screentime:bonus', ({ minutes }) => {
      setPolicy(p => p ? { ...p, minutes_used: Math.max(0, (p.minutes_used || 0) - minutes) } : p);
    });
    socket.on('task:approved', (task) => {
      updateUser({ points: (user.points || 0) + task.points });
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    });
    socket.on('task:new', (task) => {
      setTasks(ts => [task, ...ts]);
    });

    return () => {
      socket.off('screentime:lock_changed');
      socket.off('screentime:bonus');
      socket.off('task:approved');
      socket.off('task:new');
    };
  }, [user]);

  const todayDone = tasks.filter(t => t.status === 'completed').length;
  const todayTotal = tasks.length;
  const timeLeft = policy ? Math.max(0, policy.daily_quota_minutes - (policy.minutes_used || 0)) : 0;
  const isLocked = policy?.is_locked ?? false;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Greeting */}
      <View style={s.greeting}>
        <MascotBot size={48} mood={isLocked ? 'sleepy' : 'happy'} />
        <View style={s.greetingText}>
          <Text style={s.greetingSub}>שלום,</Text>
          <Text style={s.greetingName}>{user?.name} 👋</Text>
        </View>
      </View>

      {/* Status banner */}
      <View style={[s.statusBanner, { backgroundColor: isLocked ? C.redSoft : C.greenSoft, borderColor: isLocked ? '#FCA5A5' : '#86EFAC' }]}>
        <View style={[s.statusIcon, { backgroundColor: isLocked ? C.red : C.green }]}>
          <Text style={{ fontSize: 20 }}>{isLocked ? '🔒' : '✅'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.statusTitle, { color: isLocked ? C.redDeep : C.greenDeep }]}>
            {isLocked ? 'המכשיר חסום 🔒' : 'מכשיר פתוח ✅'}
          </Text>
          <Text style={s.statusSub}>
            {isLocked ? 'סיים משימות כדי לפתוח' : `נשארו לך ${timeLeft} דקות זמן מסך`}
          </Text>
        </View>
      </View>

      {/* Points card */}
      <View style={s.pointsCard}>
        <View style={s.pointsCircle} />
        <View style={s.pointsIcon}>
          <Text style={{ fontSize: 28 }}>⭐</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pointsLabel}>הנקודות שלי</Text>
          <Text style={s.pointsValue}>{(user?.points || 0).toLocaleString('he-IL')}</Text>
        </View>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>רמה {level}</Text>
          <Text style={s.levelName}>{levelName}</Text>
        </View>
      </View>

      {/* Mini stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statIcon}>🔥</Text>
          <Text style={s.statValue}>{user?.streak_days || 0}</Text>
          <Text style={s.statLabel}>ימי רצף</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>📋</Text>
          <Text style={s.statValue}>{todayDone}<Text style={s.statTotal}>/{todayTotal}</Text></Text>
          <Text style={s.statLabel}>משימות היום</Text>
        </View>
      </View>

      {/* Progress */}
      {todayTotal > 0 && (
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Text style={s.progressTitle}>התקדמות יומית</Text>
            <Text style={s.progressPct}>{Math.round((todayDone / todayTotal) * 100)}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${(todayDone / todayTotal) * 100}%` }]} />
          </View>
          <Text style={s.progressHint}>עוד {todayTotal - todayDone} משימות לבונוס יומי 🎁</Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Tasks')}>
        <Text style={s.ctaBtnText}>בוא נתחיל ← משימות</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 8 },
  greetingText: { flex: 1 },
  greetingSub: { fontSize: 13, color: C.ink3 },
  greetingName: { fontSize: 22, fontWeight: '800', color: C.ink },

  statusBanner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 18,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5,
  },
  statusIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '700' },
  statusSub: { fontSize: 12, color: C.ink3, marginTop: 2 },

  pointsCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.greenDeep, borderRadius: 28, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    overflow: 'hidden',
    shadowColor: C.green, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  pointsCircle: {
    position: 'absolute', top: -20, right: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pointsIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  pointsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  pointsValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
    padding: 10, alignItems: 'center',
  },
  levelText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  levelName: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },

  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18,
    padding: 14, borderWidth: 1, borderColor: C.line, alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: C.ink },
  statTotal: { fontSize: 16, color: C.ink4, fontWeight: '600' },
  statLabel: { fontSize: 12, color: C.ink3, marginTop: 2 },

  progressCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.line,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  progressPct: { fontSize: 13, color: C.ink3 },
  progressBg: { height: 12, backgroundColor: C.bg, borderRadius: 999, overflow: 'hidden' },
  progressFill: {
    height: '100%', backgroundColor: C.green, borderRadius: 999,
  },
  progressHint: { fontSize: 12, color: C.ink3, marginTop: 8 },

  ctaBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.blueDeep, borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: C.blueDeep, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
