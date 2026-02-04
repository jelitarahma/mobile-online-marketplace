import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../theme';

// Import all screens
import {
  HomeScreen,
  ProductDetailScreen,
  LoginScreen,
  RegisterScreen,
  ProfileScreen,
  CartScreen,
  OrdersScreen,
  CheckoutScreen,
  AdminDashboardScreen,
  AdminProductsScreen,
  AdminOrdersScreen,
  AdminCategoriesScreen,
  AdminProductFormScreen,
  OrderDetailScreen,
} from '../screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen}
      options={{ title: 'Detail Produk' }}
    />
  </Stack.Navigator>
);

// Cart Stack Navigator
const CartStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen 
      name="CartMain" 
      component={CartScreen} 
      options={{ title: 'Keranjang' }}
    />
    <Stack.Screen 
      name="Checkout" 
      component={CheckoutScreen} 
      options={{ title: 'Checkout' }}
    />
  </Stack.Navigator>
);

// Orders Stack Navigator
const OrdersStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen 
      name="OrdersMain" 
      component={OrdersScreen} 
      options={{ title: 'Pesanan Saya' }}
    />
    <Stack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen} 
      options={{ title: 'Detail Pesanan' }}
    />
  </Stack.Navigator>
);

// Profile Stack Navigator (includes Auth screens)
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profil' }}
    />
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ title: 'Masuk' }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Daftar' }}
    />
    <Stack.Screen 
      name="Orders" 
      component={OrdersScreen}
      options={{ title: 'Pesanan Saya' }}
    />
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminDashboardScreen}
      options={{ title: 'Dashboard Admin' }}
    />
    <Stack.Screen 
      name="AdminProducts" 
      component={AdminProductsScreen}
      options={{ title: 'Kelola Produk' }}
    />
    <Stack.Screen 
      name="AdminOrders" 
      component={AdminOrdersScreen}
      options={{ title: 'Kelola Pesanan' }}
    />
    <Stack.Screen 
      name="AdminCategories" 
      component={AdminCategoriesScreen}
      options={{ title: 'Kelola Kategori' }}
    />
    <Stack.Screen 
      name="AdminProductForm" 
      component={AdminProductFormScreen}
      options={({ route }) => ({ title: route.params?.productId ? 'Edit Produk' : 'Tambah Produk' })}
    />
    <Stack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen} 
      options={{ title: 'Detail Pesanan' }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontSize: FONTS.caption,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Beranda' }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{ tabBarLabel: 'Keranjang' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{ tabBarLabel: 'Pesanan' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <TabNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
