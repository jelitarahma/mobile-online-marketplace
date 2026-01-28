import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const CartScreen = ({ navigation }) => {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/cart');
      const rawData = response.data || [];
      // Deduplicate items based on variant_id just in case backend returns duplicates
      const mergedItems = rawData.reduce((acc, item) => {
        const variantId = item.variant_id?._id;
        if (!variantId) {
          acc.push(item);
          return acc;
        }
        const existing = acc.find(i => i.variant_id?._id === variantId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          acc.push(item);
        }
        return acc;
      }, []);
      setCartItems(mergedItems);
    } catch (error) {
      console.log('Error fetching cart:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [isLoggedIn])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getImageUrl = (item) => {
    const v = item.variant_id;
    if (!v) return null;

    // 1. Check direct variant image fields
    const directPath = v.thumbnail_url || v.image_url || v.thumbnail;
    
    // 2. Check variant attributes for URL-like strings
    let attrPath = null;
    if (v.attributes) {
      attrPath = Object.values(v.attributes).find(val => 
        typeof val === 'string' && (val.startsWith('http') || val.includes('/uploads/'))
      );
    }

    // 3. Fallback to product thumbnail
    const productPath = v.product_id?.thumbnail_url || v.product_id?.thumbnail;

    const path = directPath || attrPath || productPath;
    
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://backend-online-marketplace.vercel.app${path.startsWith('/') ? path : '/' + path}`;
  };

  const handleIncreaseQty = async (cartId) => {
    // Optimistic Update
    setCartItems(prev => prev.map(item => 
      item._id === cartId ? { ...item, quantity: item.quantity + 1 } : item
    ));

    try {
      await api.patch(`/cart/${cartId}/increase`);
      // Don't fetchCart() immediately to avoid jumpy UI, 
      // the local state is already updated.
    } catch (error) {
      // Revert on error
      fetchCart();
      Alert.alert('Error', error.response?.data?.message || 'Gagal menambah quantity');
    }
  };

  const handleDecreaseQty = async (cartId) => {
    const item = cartItems.find(i => i._id === cartId);
    if (item && item.quantity <= 1) {
      handleRemoveItem(cartId);
      return;
    }

    // Optimistic Update
    setCartItems(prev => prev.map(item => 
      item._id === cartId ? { ...item, quantity: item.quantity - 1 } : item
    ));

    try {
      await api.patch(`/cart/${cartId}/decrease`);
    } catch (error) {
      fetchCart();
      Alert.alert('Error', error.response?.data?.message || 'Gagal mengurangi quantity');
    }
  };

  const handleRemoveItem = async (cartId) => {
    Alert.alert(
      'Hapus Item',
      'Apakah Anda yakin ingin menghapus item ini dari keranjang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            // Optimistic Update
            setCartItems(prev => prev.filter(item => item._id !== cartId));
            try {
              await api.delete(`/cart/${cartId}`);
            } catch (error) {
              fetchCart();
              Alert.alert('Error', 'Gagal menghapus item');
            }
          },
        },
      ]
    );
  };

  const handleToggleCheck = async (cartId) => {
    // Optimistic Update
    setCartItems(prev => prev.map(item => 
      item._id === cartId ? { ...item, is_checked: !item.is_checked } : item
    ));

    try {
      await api.patch(`/cart/${cartId}/toggle-checked`);
    } catch (error) {
      fetchCart();
      Alert.alert('Error', 'Gagal mengubah status item');
    }
  };

  const handleCheckout = async () => {
    const checkedItems = cartItems.filter(item => item.is_checked);
    if (checkedItems.length === 0) {
      Alert.alert('Peringatan', 'Pilih item yang akan di-checkout terlebih dahulu');
      return;
    }
    navigation.navigate('Checkout');
  };

  const getTotalPrice = () => {
    return cartItems
      .filter(item => item.is_checked)
      .reduce((sum, item) => sum + (item.variant_id?.price || 0) * item.quantity, 0);
  };

  const getCheckedCount = () => {
    return cartItems.filter(item => item.is_checked).length;
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top']}>
        <Ionicons name="lock-closed-outline" size={80} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>Login Diperlukan</Text>
        <Text style={styles.emptyText}>Silakan login untuk melihat keranjang Anda</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Profile', { screen: 'Login' })}
        >
          <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderCartItem = ({ item }) => {
    const product = item.variant_id?.product_id;
    const variant = item.variant_id;
    const imageUrl = getImageUrl(item);

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => handleToggleCheck(item._id)}
        >
          <View style={[
            styles.checkboxInner,
            item.is_checked && styles.checkboxChecked,
          ]}>
            {item.is_checked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.itemContent}
          onPress={() => product?._id && navigation.navigate('ProductDetail', { productId: product._id })}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={COLORS.textLight} />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {product?.name || 'Produk'}
            </Text>
            {variant?.attributes && (
              <Text style={styles.variantText}>
                {Object.entries(variant.attributes)
                  .filter(([k, v]) => {
                    const isImageUrl = (typeof v === 'string' && (v.startsWith('http') || v.includes('/uploads/')));
                    const imageKeys = ['image_url', 'thumbnail_url', 'thumbnail', 'variant_images', 'images'];
                    return !imageKeys.includes(k.toLowerCase()) && !isImageUrl;
                  })
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}
              </Text>
            )}
            <Text style={styles.itemPrice}>{formatCurrency(variant?.price)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quantityActions}>
          <TouchableOpacity 
            style={styles.qtyButton}
            onPress={() => handleDecreaseQty(item._id)}
          >
            <Ionicons name="remove" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyButton}
            onPress={() => handleIncreaseQty(item._id)}
          >
            <Ionicons name="add" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
            <Text style={styles.emptyText}>Mulai belanja untuk menambahkan produk</Text>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="bag-outline" size={20} color={COLORS.white} />
              <Text style={styles.shopButtonText}>Mulai Belanja</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total ({getCheckedCount()} item)</Text>
            <Text style={styles.totalPrice}>{formatCurrency(getTotalPrice())}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.checkoutButton,
              getCheckedCount() === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={getCheckedCount() === 0}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  checkbox: {
    marginRight: SPACING.sm,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: FONTS.small,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  variantText: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quantityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: FONTS.body,
    fontWeight: '600',
    marginHorizontal: SPACING.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONTS.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  shopButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
  },
  shopButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.body,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.body,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  totalPrice: {
    fontSize: FONTS.h3,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  checkoutButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.body,
  },
});

export default CartScreen;
