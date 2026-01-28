import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const AdminDashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      console.log('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const StatCard = ({ icon, iconColor, title, value, subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: iconColor }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.statsGrid}>
        <StatCard
          icon="wallet-outline"
          iconColor={COLORS.accent}
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle={`${stats?.totalOrders || 0} pesanan`}
        />
        <StatCard
          icon="cube-outline"
          iconColor={COLORS.primary}
          title="Total Produk"
          value={stats?.totalProducts || 0}
        />
        <StatCard
          icon="people-outline"
          iconColor={COLORS.secondary}
          title="Total Users"
          value={stats?.totalUsers || 0}
        />
        <StatCard
          icon="time-outline"
          iconColor={COLORS.warning}
          title="Pesanan Pending"
          value={stats?.pendingOrders || 0}
        />
      </View>

      {/* Recent Orders Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          stats.recentOrders.slice(0, 5).map((order, index) => (
            <View key={order._id || index} style={styles.orderItem}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('id-ID')}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>
                  {formatCurrency(order.total_amount)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) }
                  ]}>
                    {order.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.noData}>Belum ada pesanan</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return COLORS.accent;
    case 'pending':
      return COLORS.warning;
    case 'shipped':
      return COLORS.primary;
    case 'completed':
      return COLORS.accent;
    case 'cancelled':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  statTitle: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONTS.h3,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONTS.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  statusText: {
    fontSize: FONTS.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  noData: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default AdminDashboardScreen;
