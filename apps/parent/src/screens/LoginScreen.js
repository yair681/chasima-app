import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import MascotBot from '../components/MascotBot';

const C = {
  blue: '#3B82F6', blueDeep: '#2563EB', blueSoft: '#EFF6FF',
  ink: '#0F172A', ink3: '#64748B', ink4: '#94A3B8', line: '#E2E8F0',
};

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('שגיאה', 'מלא את כל השדות');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (e) {
      Alert.alert('שגיאה', e.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <MascotBot size={80} mood="happy" />
        <Text style={s.title}>חסימה הורה</Text>
        <Text style={s.sub}>{mode === 'login' ? 'התחברות להורה' : 'הרשמה'}</Text>

        {mode === 'register' && (
          <TextInput style={s.input} placeholder="שם מלא" value={name}
            onChangeText={setName} textAlign="right" />
        )}
        <TextInput style={s.input} placeholder="אימייל" value={email}
          onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" textAlign="right" />
        <TextInput style={s.input} placeholder="סיסמה" value={password}
          onChangeText={setPassword} secureTextEntry textAlign="right" />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
          <Text style={s.btnText}>{loading ? '...' : mode === 'login' ? 'התחבר' : 'הירשם'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(m => m === 'login' ? 'register' : 'login')}>
          <Text style={s.toggle}>
            {mode === 'login' ? 'אין לך חשבון? הירשם' : 'יש לך חשבון? התחבר'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.blueSoft },
  inner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 12,
  },
  title: { fontSize: 32, fontWeight: '800', color: C.ink, marginTop: 12 },
  sub: { fontSize: 15, color: C.ink3, marginBottom: 8 },
  input: {
    width: '100%', backgroundColor: '#fff',
    borderWidth: 2, borderColor: C.line, borderRadius: 16,
    padding: 16, fontSize: 16, color: C.ink,
  },
  btn: {
    width: '100%', backgroundColor: C.blueDeep,
    padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 8,
    shadowColor: C.blueDeep, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  toggle: { color: C.blue, fontSize: 14, fontWeight: '600', marginTop: 8 },
});
