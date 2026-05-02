import React, { useRef, useState } from 'react';
import {
  Alert, Animated, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import MascotBot from '../components/MascotBot';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  ink: '#0F172A', ink3: '#64748B', line: '#E2E8F0',
};

export default function LoginScreen() {
  const { loginWithCode } = useAuth();
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const setDigit = (i, v) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...code]; next[i] = v;
    setCode(next);
    if (v && i < 3) refs[i + 1].current?.focus();
  };

  const onKeyPress = (i, key) => {
    if (key === 'Backspace' && !code[i] && i > 0) refs[i - 1].current?.focus();
  };

  const filled = code.every(c => c !== '');

  const submit = async () => {
    if (!filled) return;
    setLoading(true);
    try {
      await loginWithCode(code.join(''));
    } catch {
      Alert.alert('קוד שגוי', 'בקש מההורה לשלוח לך קוד חדש');
      setCode(['', '', '', '']);
      refs[0].current?.focus();
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <MascotBot size={96} mood="happy" />
        <Text style={s.title}>ברוך הבא 👋</Text>
        <Text style={s.sub}>הכנס את הקוד שקיבלת מההורה</Text>

        <View style={s.codeRow}>
          {code.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              value={d}
              onChangeText={v => setDigit(i, v.slice(-1))}
              onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
              maxLength={1}
              keyboardType="number-pad"
              style={[s.digit, d ? s.digitFilled : null]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, !filled && s.btnDisabled]}
          onPress={submit}
          disabled={!filled || loading}
        >
          <Text style={s.btnText}>{loading ? '...' : 'התחבר'}</Text>
        </TouchableOpacity>

        <Text style={s.hint}>אין לך קוד? בקש מההורה</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.blueSoft },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  sub: { fontSize: 15, color: C.ink3, textAlign: 'center', maxWidth: 280 },
  codeRow: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  digit: {
    width: 60, height: 68, fontSize: 28, fontWeight: '700',
    textAlign: 'center', borderRadius: 16,
    borderWidth: 2, borderColor: C.line, backgroundColor: '#fff', color: '#0F172A',
  },
  digitFilled: { borderColor: C.blue, backgroundColor: C.blueSoft },
  btn: {
    width: '100%', backgroundColor: C.blueDeep,
    padding: 18, borderRadius: 18, alignItems: 'center',
    shadowColor: C.blueDeep, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { backgroundColor: C.line },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hint: { color: '#94A3B8', fontSize: 13 },
});
