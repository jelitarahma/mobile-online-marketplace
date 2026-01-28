import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
      setItems(response.data.items || []);
    } catch (error) {
      console.log('Error fetching order detail:', error);
      Alert.alert('Error', 'Gagal memuat detail pesanan');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return COLORS.accent;
      case 'pending': return COLORS.warning;
      case 'shipped': return COLORS.primary;
      case 'completed': return COLORS.accent;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getImageUrl = (item) => {
    if (!item) return null;
    const v = item.variant_id;
    
    // 1. Check direct variant fields
    const directPath = v?.thumbnail_url || v?.image_url || v?.thumbnail || item.thumbnail;
    
    // 2. Check variant attributes for URL-like strings
    let attrPath = null;
    const attrs = v?.attributes || item.variant_attributes;
    if (attrs) {
      attrPath = Object.values(attrs).find(val => 
        typeof val === 'string' && (val.startsWith('http') || val.includes('/uploads/'))
      );
    }

    // 3. Fallback to product thumbnail
    const productPath = v?.product_id?.thumbnail || v?.product_id?.thumbnail_url;

    const path = directPath || attrPath || productPath;

    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://backend-online-marketplace.vercel.app${path.startsWith('/') ? path : '/' + path}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) + '20' }
          ]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          Dipesan pada: {new Date(order.createdAt).toLocaleString('id-ID')}
        </Text>
      </View>

      {/* Items List */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Produk</Text>
        {items.map((item, index) => (
          <View key={item._id || index} style={styles.itemRow}>
            <Image 
              source={{ uri: getImageUrl(item) }} 
              style={styles.itemImage} 
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.variant_id?.product_id?.name || item.product_name}
              </Text>
              <Text style={styles.itemVariant}>
                {Object.entries(item.variant_attributes || {})
                  .filter(([k, v]) => {
                    const isImageUrl = (typeof v === 'string' && (v.startsWith('http') || v.includes('/uploads/')));
                    const imageKeys = ['image_url', 'thumbnail_url', 'thumbnail', 'variant_images', 'images'];
                    return !imageKeys.includes(k.toLowerCase()) && !isImageUrl;
                  })
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Shipping Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Info Pengiriman</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Metode</Text>
          <Text style={styles.infoValue}>{order.shipping_method}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Alamat</Text>
          <Text style={[styles.infoValue, { textAlign: 'right', flex: 1 }]}>
            {order.shipping_address}
          </Text>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Metode Pembayaran</Text>
          <Text style={styles.infoValue}>{order.payment_method}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Subtotal</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.subtotal_products)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ongkos Kirim</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.shipping_cost)}</Text>
        </View>
        <View style={[styles.infoRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
        </View>
      </View>

      {/* Payment Button */}
      {order.status?.toLowerCase() === 'pending' && order.snap_redirect_url && (
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={() => Linking.openURL(order.snap_redirect_url)}
          >
            <Ionicons name="card-outline" size={20} color={COLORS.white} />
            <Text style={styles.paymentButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
          <Text style={styles.paymentNote}>
            Selesaikan pembayaran Anda menggunakan Midtrans Aman & Cepat.
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONTS.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDate: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  itemName: {
    fontSize: FONTS.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemVariant: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  itemQty: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONTS.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  totalLabel: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONTS.h3,
    fontWeight: '700',
    color: COLORS.primary,
  },
  paymentButtonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  paymentButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  paymentButtonText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  paymentNote: {
    fontSize: FONTS.tiny,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default OrderDetailScreen;
