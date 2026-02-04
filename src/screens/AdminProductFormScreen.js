import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const AdminProductFormScreen = ({ navigation, route }) => {
  const { productId } = route.params || {};
  const isEdit = !!productId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [form, setForm] = useState({
    name: '',
    short_description: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    variants: [
      {
        sku: '',
        price: '',
        stock: '',
        attributes: { size: '', color: '' },
      }
    ],
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProductDetail();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
      if (!isEdit && response.data?.length > 0) {
        setForm(prev => ({ ...prev, category_id: response.data[0]._id }));
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
    }
  };

  const fetchProductDetail = async () => {
    try {
      const response = await api.get(`/product/${productId}`);
      const { product, variants } = response.data;
      setForm({
        name: product.name,
        short_description: product.short_description || '',
        description: product.description || '',
        category_id: product.category_id?._id || product.category_id || '',
        thumbnail_url: product.thumbnail || '',
        variants: variants.map(v => ({
          sku: v.sku,
          price: v.price.toString(),
          stock: v.stock.toString(),
          attributes: v.attributes || { size: '', color: '' },
        })),
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail produk');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { sku: '', price: '', stock: '', attributes: { size: '', color: '' } }]
    }));
  };

  const handleRemoveVariant = (index) => {
    if (form.variants.length === 1) return;
    const newVariants = [...form.variants];
    newVariants.splice(index, 1);
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants];
    newVariants[index][field] = value;
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const updateVariantAttr = (index, attr, value) => {
    const newVariants = [...form.variants];
    newVariants[index].attributes[attr] = value;
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || form.variants.some(v => !v.price || !v.stock)) {
      Alert.alert('Error', 'Mohon lengkapi data wajib (Nama, Kategori, Harga & Stok Varian)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        variants: JSON.stringify(form.variants),
      };

      if (isEdit) {
        await api.put(`/product/${productId}`, payload);
        Alert.alert('Berhasil', 'Produk berhasil diperbarui');
      } else {
        await api.post('/product', payload);
        Alert.alert('Berhasil', 'Produk berhasil ditambahkan');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nama Produk *</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={text => setForm(prev => ({ ...prev, name: text }))}
        placeholder="Contoh: T-Shirt Premium"
      />

      <Text style={styles.label}>Kategori *</Text>
      <View style={styles.categoryPicker}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat._id}
            style={[
              styles.pickerItem,
              form.category_id === cat._id && styles.pickerItemActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, category_id: cat._id }))}
          >
            <Text style={[
              styles.pickerText,
              form.category_id === cat._id && styles.pickerTextActive
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Deskripsi Singkat</Text>
      <TextInput
        style={styles.input}
        value={form.short_description}
        onChangeText={text => setForm(prev => ({ ...prev, short_description: text }))}
        placeholder="Ringkasan produk..."
      />

      <Text style={styles.label}>Deskripsi Lengkap</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={text => setForm(prev => ({ ...prev, description: text }))}
        placeholder="Detail lengkap produk..."
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>URL Gambar Thumbnail</Text>
      <TextInput
        style={styles.input}
        value={form.thumbnail_url}
        onChangeText={text => setForm(prev => ({ ...prev, thumbnail_url: text }))}
        placeholder="https://example.com/image.jpg"
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Varian Produk *</Text>
        <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addVariantText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {form.variants.map((v, index) => (
        <View key={index} style={styles.variantCard}>
          <View style={styles.variantHeader}>
            <Text style={styles.variantLabel}>Varian {index + 1}</Text>
            {form.variants.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveVariant(index)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.subLabel}>SKU</Text>
              <TextInput
                style={styles.inputSmall}
                value={v.sku}
                onChangeText={text => updateVariant(index, 'sku', text)}
                placeholder="SKU-001"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Harga *</Text>
              <TextInput
                style={styles.inputSmall}
                value={v.price}
                onChangeText={text => updateVariant(index, 'price', text)}
                placeholder="100000"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.subLabel}>Stok *</Text>
              <TextInput
                style={styles.inputSmall}
                value={v.stock}
                onChangeText={text => updateVariant(index, 'stock', text)}
                placeholder="50"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Ukuran</Text>
              <TextInput
                style={styles.inputSmall}
                value={v.attributes.size}
                onChangeText={text => updateVariantAttr(index, 'size', text)}
                placeholder="L, XL, atau - "
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitBtnText}>{isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  subLabel: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputSmall: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONTS.small,
    color: COLORS.text,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pickerTextActive: {
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVariantText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONTS.small,
  },
  variantCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  variantLabel: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
});

export default AdminProductFormScreen;
