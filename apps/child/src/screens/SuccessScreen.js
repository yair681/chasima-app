import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = { green: '#22C55E', greenDeep: '#16A34A', greenSoft: '#F0FDF4', blue: '#2563EB' };

export default function SuccessScreen({ route, navigation }) {
  const { task, totalPoints } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <Animated.View style={[s.circle, { transform: [{ scale }] }]}>
        <Text style={{ fontSize: 64 }}>✓</Text>
        <Text style={s.confetti1}>🎉</Text>
        <Text style={s.confetti2}>✨</Text>
      </Animated.View>

      <Animated.Text style={[s.title, { opacity, transform: [{ translateY: slideY }] }]}>
        כל הכבוד!
      </Animated.Text>
      <Animated.Text style={[s.sub, { opacity }]}>
        סיימת את "{task?.title}"
      </Animated.Text>

      <Animated.View style={[s.pointsCard, { opacity, transform: [{ translateY: slideY }] }]}>
        <Text style={{ fontSize: 32 }}>⭐</Text>
        <View>
          <Text style={s.pointsLabel}>זכית ב-</Text>
          <Text style={s.pointsValue}>+{task?.points} נקודות</Text>
        </View>
      </Animated.View>

      <Animated.Text style={[s.total, { opacity }]}>
        סה"כ: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{totalPoints?.toLocaleString('he-IL')}</Text> נקודות
      </Animated.Text>

      <Animated.View style={[{ width: '100%', opacity }]}>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Tasks')}>
          <Text style={s.btnText}>המשך</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, backgroundColor: '#fff', gap: 16,
  },
  circle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.green, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
    position: 'relative',
  },
  confetti1: { position: 'absolute', top: -10, right: -16, fontSize: 32 },
  confetti2: { position: 'absolute', bottom: -8, left: -16, fontSize: 24 },
  title: { fontSize: 36, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  sub: { fontSize: 16, color: '#64748B', textAlign: 'center' },
  pointsCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: '18px 24px',
    paddingHorizontal: 24, paddingVertical: 18,
    borderWidth: 1.5, borderColor: C.greenSoft,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: C.green, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  pointsLabel: { fontSize: 13, color: '#64748B' },
  pointsValue: { fontSize: 28, fontWeight: '800', color: C.greenDeep },
  total: { fontSize: 13, color: '#64748B' },
  btn: {
    backgroundColor: C.blue, borderRadius: 18, padding: 18,
    alignItems: 'center', width: '100%',
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
