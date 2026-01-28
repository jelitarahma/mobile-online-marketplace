import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/product/${productId}`);
      const data = response.data;
      
      // Handle nested response structure
      if (data.product) {
        setProduct(data.product);
        setVariants(data.variants || []);
        setImages(data.images || []);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } else {
        setProduct(data);
        setVariants(data.variants || []);
        setImages(data.images || []);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      }
    } catch (error) {
      console.log('Error fetching product:', error);
      Alert.alert('Error', 'Gagal memuat detail produk');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (price) => {
    if (!price && price !== 0) return 'Rp -';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `https://backend-online-marketplace.vercel.app${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  };

  const getThumbnail = () => {
    // Try images array first
    if (images.length > 0) {
      const primaryImage = images.find(img => img.is_primary) || images[0];
      return getImageUrl(primaryImage.image_url);
    }
    // Fallback to product thumbnail
    const path = product?.thumbnail_url || product?.thumbnail;
    return getImageUrl(path);
  };

  const findVariantImage = (v) => {
    if (!v) return null;
    // Check direct fields
    const directPath = v.image_url || v.thumbnail_url || v.thumbnail;
    if (directPath) return getImageUrl(directPath);
    
    // Check attributes for URL-like strings
    if (v.attributes) {
      const urlAttr = Object.values(v.attributes).find(val => 
        typeof val === 'string' && (val.startsWith('http') || val.includes('/uploads/'))
      );
      if (urlAttr) return getImageUrl(urlAttr);
    }
    return null;
  };

  const getAllImages = () => {
    const allImages = [];
    
    // Add thumbnail first
    const thumbnail = getThumbnail();
    if (thumbnail) allImages.push(thumbnail);
    
    // Add other images from images array
    images.forEach(img => {
      const url = getImageUrl(img.image_url);
      if (url && !allImages.includes(url)) {
        allImages.push(url);
      }
    });

    // Add images from variants that are not already there
    variants.forEach(v => {
      const url = findVariantImage(v);
      if (url && !allImages.includes(url)) {
        allImages.push(url);
      }
    });
    
    return allImages.length > 0 ? allImages : [null];
  };

  const getCurrentPrice = () => {
    if (selectedVariant) return selectedVariant.price;
    if (product?.price_min !== undefined) return product.price_min;
    return 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    if (product?.total_stock !== undefined) return product.total_stock;
    return 0;
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login Diperlukan',
        'Anda harus login untuk menambahkan produk ke keranjang',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Profile', { screen: 'Login' }) },
        ]
      );
      return;
    }

    if (!selectedVariant) {
      Alert.alert('Pilih Varian', 'Silakan pilih varian produk terlebih dahulu');
      return;
    }

    setAddingToCart(true);
    try {
      await api.post('/cart/add', {
        variant_id: selectedVariant._id,
        quantity,
      });
      Alert.alert('Berhasil', 'Produk ditambahkan ke keranjang');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menambahkan ke keranjang');
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    const maxStock = getCurrentStock();
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const renderVariantSelector = () => {
    if (variants.length === 0) return null;

    // Group variants by attribute, filtering out image-related attributes
    const attributeGroups = {};
    const imageKeys = ['image_url', 'thumbnail_url', 'thumbnail', 'variant_images', 'images'];
    
    variants.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          // Skip keys that are clearly images or values that are URL strings
          const isImageUrl = (typeof value === 'string' && (value.startsWith('http') || value.includes('/uploads/')));
          if (!imageKeys.includes(key.toLowerCase()) && !isImageUrl) {
            if (!attributeGroups[key]) attributeGroups[key] = new Set();
            attributeGroups[key].add(value);
          }
        });
      }
    });

    return (
      <View style={styles.variantSection}>
        {Object.entries(attributeGroups).map(([attrName, values]) => (
          <View key={attrName} style={styles.attributeGroup}>
            <Text style={styles.attributeLabel}>{attrName}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attributeOptions}
            >
              {Array.from(values).map((value) => {
                const isSelected = selectedVariant?.attributes?.[attrName] === value;
                
                // Find a variant that has this attribute value to get its image
                const matchingVariant = variants.find(v => v.attributes?.[attrName] === value);
                const fullImageUrl = findVariantImage(matchingVariant);

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.attributeChip,
                      isSelected && styles.attributeChipSelected,
                      fullImageUrl && styles.attributeChipWithImage,
                    ]}
                    onPress={() => {
                      if (matchingVariant) {
                        setSelectedVariant(matchingVariant);
                        setQuantity(1);
                        
                        // Sync with main image gallery
                        if (fullImageUrl) {
                          const allImgs = getAllImages();
                          const imageIndex = allImgs.findIndex(img => img === fullImageUrl);
                          if (imageIndex !== -1) {
                            setCurrentImageIndex(imageIndex);
                          }
                        }
                      }
                    }}
                  >
                    {fullImageUrl && (
                      <View style={styles.attributeImageContainer}>
                        <Image 
                          source={{ uri: fullImageUrl }} 
                          style={styles.attributeImage} 
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <Text style={[
                      styles.attributeChipText,
                      isSelected && styles.attributeChipTextSelected,
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Produk tidak ditemukan</Text>
      </View>
    );
  }

  const allImages = getAllImages();
  const currentStock = getCurrentStock();
  const currentPrice = getCurrentPrice();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {allImages[currentImageIndex] ? (
            <Image
              source={{ uri: allImages[currentImageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>📷</Text>
            </View>
          )}
          
          {/* Image Counter */}
          {allImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{allImages.length}
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailStrip}
            contentContainerStyle={styles.thumbnailContent}
          >
            {allImages.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnailWrapper,
                  currentImageIndex === index && styles.thumbnailWrapperActive,
                ]}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Text>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Category */}
          {product.category_id && (
            <Text style={styles.categoryName}>
              {typeof product.category_id === 'string' ? 'Category' : product.category_id.name}
            </Text>
          )}

          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatCurrency(currentPrice)}</Text>
            {currentStock > 0 ? (
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>Stok: {currentStock}</Text>
              </View>
            ) : (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>Habis</Text>
              </View>
            )}
          </View>

          {/* Variant Selector */}
          {renderVariantSelector()}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
          <Text style={styles.description}>
            {product.description || product.short_description || 'Tidak ada deskripsi'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Text style={[styles.quantityButtonText, quantity <= 1 && styles.quantityButtonDisabled]}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={incrementQuantity}
            disabled={quantity >= currentStock}
          >
            <Text style={[styles.quantityButtonText, quantity >= currentStock && styles.quantityButtonDisabled]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton, 
            (addingToCart || currentStock === 0) && styles.buttonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={addingToCart || currentStock === 0}
        >
          {addingToCart ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.addToCartText}>
              {currentStock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONTS.body,
    color: COLORS.error,
  },
  scrollView: {
    flex: 1,
  },

  // Image Gallery
  imageGallery: {
    position: 'relative',
    width: width,
    height: width,
    backgroundColor: COLORS.surfaceAlt,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholderText: {
    fontSize: 64,
  },
  imageCounter: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  imageCounterText: {
    color: COLORS.white,
    fontSize: FONTS.small,
  },

  // Thumbnails
  thumbnailStrip: {
    backgroundColor: COLORS.surface,
  },
  thumbnailContent: {
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: SPACING.sm,
  },
  thumbnailWrapperActive: {
    borderColor: COLORS.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },

  // Product Info
  productInfo: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  categoryName: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  productName: {
    fontSize: FONTS.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  productPrice: {
    fontSize: FONTS.h3,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.md,
  },
  stockBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  stockBadgeText: {
    color: COLORS.accent,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  outOfStockBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  outOfStockBadgeText: {
    color: COLORS.error,
    fontSize: FONTS.small,
    fontWeight: '600',
  },

  // Variants
  variantSection: {
    marginBottom: SPACING.md,
  },
  attributeGroup: {
    marginBottom: SPACING.md,
  },
  attributeLabel: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  attributeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  attributeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  attributeChipWithImage: {
    paddingLeft: SPACING.xs,
  },
  attributeImageContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  attributeImage: {
    width: '100%',
    height: '100%',
  },
  attributeChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  attributeChipText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  attributeChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityButtonText: {
    fontSize: FONTS.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  quantityButtonDisabled: {
    color: COLORS.textLight,
  },
  quantityText: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: SPACING.md,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  addToCartText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
