import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MascotBot from '../components/MascotBot';

export default function BlockedScreen() {
  return (
    <View style={s.container}>
      <View style={s.glow} />
      <View style={s.lockBox}>
        <Text style={{ fontSize: 72 }}>🔒</Text>
      </View>
      <Text style={s.title}>המכשיר נעול 🔒</Text>
      <Text style={s.sub}>
        ההורה שלך נעל את המכשיר.{'\n'}
        תוכל לקבל גישה כשהוא יפתח אותו{'\n'}
        או כשתסיים את המשימות שלך.
      </Text>
      <View style={s.mascotCard}>
        <MascotBot size={48} mood="sleepy" />
        <View>
          <Text style={s.mascotTitle}>הרובוט שלך נח עכשיו</Text>
          <Text style={s.mascotSub}>נתראה בקרוב!</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0F172A',
    alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 20,
  },
  glow: {
    position: 'absolute', top: '20%',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  lockBox: {
    width: 140, height: 140, borderRadius: 36,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.6, shadowRadius: 32, elevation: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: {
    fontSize: 16, color: '#94A3B8', textAlign: 'center',
    lineHeight: 26, maxWidth: 280,
  },
  mascotCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  mascotTitle: { color: '#fff', fontWeight: '600', fontSize: 14 },
  mascotSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
});
