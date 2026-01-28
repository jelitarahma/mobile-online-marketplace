import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const ProfileScreen = ({ navigation }) => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={100} color={COLORS.textLight} />
          <Text style={styles.title}>Anda Belum Login</Text>
          <Text style={styles.subtitle}>
            Silakan login untuk mengakses fitur lengkap
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
            <Text style={styles.loginButtonText}>Masuk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Daftar Akun Baru</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const MenuItem = ({ icon, label, onPress, color = COLORS.text }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.username || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>

      {/* Customer Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuSectionTitle}>Akun Saya</Text>
        <MenuItem
          icon="receipt-outline"
          label="Pesanan Saya"
          onPress={() => navigation.navigate('Orders')}
        />
        <MenuItem
          icon="cart-outline"
          label="Keranjang"
          onPress={() => navigation.navigate('Cart')}
        />
        <MenuItem
          icon="heart-outline"
          label="Wishlist"
          onPress={() => Alert.alert('Info', 'Fitur wishlist akan tersedia di versi selanjutnya')}
        />
        <MenuItem
          icon="settings-outline"
          label="Pengaturan"
          onPress={() => Alert.alert('Info', 'Fitur pengaturan akan tersedia di versi selanjutnya')}
        />
      </View>

      {/* Admin Menu */}
      {isAdmin && (
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Admin Panel</Text>
          <MenuItem
            icon="stats-chart-outline"
            label="Dashboard"
            onPress={() => navigation.navigate('AdminDashboard')}
          />
          <MenuItem
            icon="cube-outline"
            label="Kelola Produk"
            onPress={() => navigation.navigate('AdminProducts')}
          />
          <MenuItem
            icon="clipboard-outline"
            label="Kelola Pesanan"
            onPress={() => navigation.navigate('AdminOrders')}
          />
          <MenuItem
            icon="pricetag-outline"
            label="Kelola Kategori"
            onPress={() => navigation.navigate('AdminCategories')}
          />
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Online Marketplace v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: FONTS.small,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.sm,
  },
  adminBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  adminBadgeText: {
    color: COLORS.white,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuSectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  menuText: {
    flex: 1,
    fontSize: FONTS.body,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appVersion: {
    fontSize: FONTS.tiny,
    color: COLORS.textLight,
  },
});

export default ProfileScreen;
