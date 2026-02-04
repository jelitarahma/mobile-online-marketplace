import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const AdminCategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.log('Error fetching categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Nama kategori tidak boleh kosong');
      return;
    }

    setAdding(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, { name: newCategoryName.trim() });
        Alert.alert('Berhasil', 'Kategori berhasil diperbarui');
      } else {
        await api.post('/categories', { name: newCategoryName.trim() });
        Alert.alert('Berhasil', 'Kategori berhasil ditambahkan');
      }
      setNewCategoryName('');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setAdding(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus "${category.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${category._id}`);
              Alert.alert('Berhasil', 'Kategori berhasil dihapus');
              fetchCategories();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Gagal menghapus kategori');
            }
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCategory = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
        <View style={styles.categoryText}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.slug && (
            <Text style={styles.categorySlug}>{item.slug}</Text>
          )}
        </View>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditCategory(item)}
        >
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kategori..."
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

      {/* Add Category Form */}
      <View style={styles.addForm}>
        <TextInput
          style={styles.addInput}
          placeholder={editingCategory ? "Edit nama kategori" : "Nama kategori baru"}
          placeholderTextColor={COLORS.textLight}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          editable={!adding}
        />
        <TouchableOpacity 
          style={[styles.addButton, adding && styles.addButtonDisabled]}
          onPress={handleAddCategory}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name={editingCategory ? "save-outline" : "add"} size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>{editingCategory ? "Simpan" : "Tambah"}</Text>
            </>
          )}
        </TouchableOpacity>
        {editingCategory && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelEdit}
            disabled={adding}
          >
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.resultCount}>{filteredCategories.length} kategori</Text>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
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
            <Ionicons name="folder-open-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Belum ada kategori</Text>
          </View>
        }
      />
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
  searchContainer: {
    padding: SPACING.md,
    paddingBottom: 0,
    backgroundColor: COLORS.surface,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  addForm: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    fontSize: FONTS.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.body,
  },
  resultCount: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  categorySlug: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  cancelButton: {
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default AdminCategoriesScreen;
