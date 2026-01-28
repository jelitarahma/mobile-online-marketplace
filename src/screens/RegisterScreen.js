import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    const result = await register(username, email, password, role);
    setLoading(false);
    if (result.success) {
      Alert.alert('Berhasil', 'Registrasi berhasil!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Registrasi Gagal', result.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="person-add" size={80} color={COLORS.primary} />
          <Text style={styles.title}>Buat Akun Baru</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} />
              <TextInput style={styles.input} placeholder="Nama pengguna" value={username} onChangeText={setUsername} editable={!loading} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textLight} />
              <TextInput style={styles.input} placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
              <TextInput style={styles.input} placeholder="Minimal 6 karakter" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
              <TextInput style={styles.input} placeholder="Ulangi password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry editable={!loading} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]} onPress={() => setRole('customer')} disabled={loading}>
                <Ionicons name="person-outline" size={20} color={role === 'customer' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.roleButtonText, role === 'customer' && styles.roleButtonTextActive]}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]} onPress={() => setRole('admin')} disabled={loading}>
                <Ionicons name="shield-outline" size={20} color={role === 'admin' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <><Ionicons name="person-add-outline" size={20} color={COLORS.white} /><Text style={styles.buttonText}>Daftar</Text></>}
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.footerLink}>Masuk</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: { fontSize: FONTS.h1, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  form: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.medium },
  inputContainer: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  input: { flex: 1, padding: SPACING.md, fontSize: FONTS.body, color: COLORS.text },
  roleContainer: { flexDirection: 'row', gap: SPACING.sm },
  roleButton: { flex: 1, flexDirection: 'row', padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  roleButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  roleButtonText: { fontSize: FONTS.body, color: COLORS.textSecondary },
  roleButtonTextActive: { color: COLORS.primary, fontWeight: '600' },
  button: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, padding: SPACING.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  footerText: { fontSize: FONTS.body, color: COLORS.textSecondary },
  footerLink: { fontSize: FONTS.body, color: COLORS.primary, fontWeight: '600' },
});

export default RegisterScreen;
