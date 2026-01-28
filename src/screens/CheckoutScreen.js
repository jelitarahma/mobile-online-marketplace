import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const CheckoutScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  useEffect(() => {
    fetchSelectedItems();
  }, []);

  const fetchSelectedItems = async () => {
    try {
      const response = await api.get('/cart');
      const checkedItems = (response.data || []).filter(item => item.is_checked);
      
      if (checkedItems.length === 0) {
        Alert.alert('Eror', 'Tidak ada item terpilih untuk checkout');
        navigation.goBack();
        return;
      }
      
      setCartItems(checkedItems);
    } catch (error) {
      console.log('Error fetching checkout items:', error);
      Alert.alert('Error', 'Gagal memuat item keranjang');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.variant_id?.price || 0) * item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Peringatan', 'Harap isi alamat pengiriman');
      return;
    }

    setSubmitting(true);
    try {
      // Backend expects: { shipping_address, payment_method }
      // The backend will create an order from checked cart items
      const response = await api.post('/orders/checkout', {
        shipping_address: address.trim(),
        payment_method: paymentMethod,
        shipping_method: 'Standard', // Default required by backend
        shipping_cost: 15000,        // Default required by backend
      });

      Alert.alert('Berhasil', 'Pesanan Anda telah berhasil dibuat!', [
        { 
          text: 'Lihat Pesanan', 
          onPress: () => navigation.navigate('OrdersTab') 
        }
      ]);
    } catch (error) {
      console.log('Place order error:', error.response?.data || error.message);
      Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          {cartItems.map((item) => (
            <View key={item._id} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.variant_id?.product_id?.name}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemVariant}>
                {Object.entries(item.variant_id?.attributes || {}).map(([k, v]) => `${v}`).join(', ')}
              </Text>
              <Text style={styles.itemPrice}>
                {formatCurrency((item.variant_id?.price || 0) * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculateTotal())}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Masukkan alamat lengkap pengiriman..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            value={address}
            onChangeText={setAddress}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <TouchableOpacity 
            style={[
              styles.paymentOption, 
              paymentMethod === 'bank_transfer' && styles.paymentOptionActive
            ]}
            onPress={() => setPaymentMethod('bank_transfer')}
          >
            <Ionicons 
              name={paymentMethod === 'bank_transfer' ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={paymentMethod === 'bank_transfer' ? COLORS.primary : COLORS.textLight} 
            />
            <Text style={styles.paymentText}>Transfer Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.paymentOption, 
              paymentMethod === 'cod' && styles.paymentOptionActive
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Ionicons 
              name={paymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={paymentMethod === 'cod' ? COLORS.primary : COLORS.textLight} 
            />
            <Text style={styles.paymentText}>COD (Bayar di Tempat)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, submitting && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.placeOrderButtonText}>Buat Pesanan</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  scrollContent: {
    padding: SPACING.md,
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
    marginBottom: SPACING.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '500',
    marginRight: SPACING.sm,
  },
  itemQty: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  itemVariant: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
  },
  itemPrice: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONTS.h3,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addressInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  paymentText: {
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default CheckoutScreen;
