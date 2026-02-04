import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/product'),
        api.get('/categories'),
      ]);
      
      const productsData = productsRes.data.products || productsRes.data || [];
      setProducts(productsData);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (price) => {
    if (!price && price !== 0) return 'Rp -';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductPrice = (product) => {
    if (product.price_min !== undefined) return product.price_min;
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };

  const getProductStock = (product) => {
    if (product.total_stock !== undefined) return product.total_stock;
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product.stock || 0;
  };

  const getThumbnail = (product) => {
    const path = product.thumbnail_url || product.thumbnail;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://backend-online-marketplace.vercel.app${path.startsWith('/') ? path : '/' + path}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || 
      (product.category_id && 
        (typeof product.category_id === 'string' 
          ? product.category_id === selectedCategory 
          : product.category_id._id === selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item._id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item._id ? null : item._id)}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item._id && styles.categoryChipTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => {
    const thumbnail = getThumbnail(item);
    const price = getProductPrice(item);
    const stock = getProductStock(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.productImageWrapper}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
            </View>
          )}
          {stock === 0 && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Habis</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>{formatCurrency(price)}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>
              Stok: {stock}
            </Text>
            {item.variant_count > 1 && (
              <Text style={styles.variantCount}>
                {item.variant_count} varian
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat produk...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar - Fixed at top */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.productRow}
        ListHeaderComponent={
          <>
            {/* Promo Banner */}
            <View style={styles.promoBannerContainer}>
              <LinearGradient
                colors={['#630001', '#FFFFFF']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.promoBanner}
              >
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>Lunar New Year Sale</Text>
                  <Text style={styles.promoSubtitle}>
                    Save up to 50% on your{"\n"}favorite products.
                  </Text>
                  <TouchableOpacity style={styles.promoButton}>
                    <Text style={styles.promoButtonText}>Shop Now</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <Image 
                source={require('../../assets/images/cny.png')}
                style={styles.promoImage}
                resizeMode="contain"
              />
            </View>

            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Kategori</Text>
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                />
              </View>
            )}

            {/* Products Title */}
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>
                {selectedCategory ? 'Produk' : 'Semua Produk'} ({filteredProducts.length})
              </Text>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Tidak ada produk ditemukan</Text>
          </View>
        }
      />
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.body,
  },
  
  // Search
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.body,
    color: COLORS.text,
  },

  // Promo Banner
  promoBannerContainer: {
    position: 'relative',
    margin: SPACING.md,
    marginTop: 0,
    marginBottom: SPACING.lg + 20,
  },
  promoBanner: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    height: 160,
    ...SHADOWS.medium,
    marginTop: 20,
  },
  promoContent: {
    flex: 1,
    zIndex: 1,
  },
  promoTitle: {
    color: COLORS.white,
    fontSize: FONTS.h4,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  promoSubtitle: {
    color: '#ffffffff',
    fontSize: FONTS.tiny,
    lineHeight: 20,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  promoButton: {
    backgroundColor: '#630001',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.small,
  },
  promoImage: {
    position: 'absolute',
    right: -15,
    bottom: 0,
    width: '60%',
    height: '120%',
    zIndex: 2,
  },

  // Categories
  categoriesSection: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.h4,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoriesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Products
  productsSection: {
    flex: 1,
  },
  productList: {
    padding: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    width: '48%',
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  productImageWrapper: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: FONTS.caption,
    fontWeight: '600',
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: FONTS.small,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    height: 36,
  },
  productPrice: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productStock: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
  },
  variantCount: {
    fontSize: FONTS.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default HomeScreen;
