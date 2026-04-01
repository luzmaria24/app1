import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Trash2, DollarSign, RefreshCw } from 'lucide-react-native';
import {
  getScannedItems,
  deleteScannedItem,
  clearAllScannedItems,
} from '@/services/database';
import { ScannedItem } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen() {
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadItems = async () => {
    try {
      const data = await getScannedItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load scanned items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadItems();
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteScannedItem(id);
            await loadItems();
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear All Items',
      'Are you sure you want to delete all scanned items? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllScannedItems();
              await loadItems();
            } catch (error) {
              console.error('Error clearing items:', error);
              Alert.alert('Error', 'Failed to clear items');
            }
          },
        },
      ]
    );
  };

  const calculateTotalBolivares = () => {
    return items.reduce((sum, item) => sum + item.price_bolivares, 0);
  };

  const calculateTotalUSD = () => {
    return items.reduce((sum, item) => {
      if (item.currency === 'USD') {
        return sum + item.price_original;
      } else {
        return sum + item.price_original / item.exchange_rate;
      }
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: ScannedItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>
              {item.currency === 'USD' ? '$' : 'Bs '}
              {item.price_original.toFixed(2)}
            </Text>
            <View
              style={[
                styles.currencyBadge,
                item.currency === 'USD'
                  ? styles.currencyBadgeUSD
                  : styles.currencyBadgeVES,
              ]}>
              <Text
                style={[
                  styles.currencyBadgeText,
                  item.currency === 'USD'
                    ? styles.currencyBadgeTextUSD
                    : styles.currencyBadgeTextVES,
                ]}>
                {item.currency}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.convertedPrice}>
            Bs {item.price_bolivares.toFixed(2)}
          </Text>
          {item.currency === 'USD' && (
            <Text style={styles.exchangeRate}>
              Rate: {item.exchange_rate.toFixed(4)}
            </Text>
          )}
        </View>

        <Text style={styles.timestamp}>{formatDate(item.scanned_at)}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalSection}>
        <View style={styles.totalContent}>
          <DollarSign size={32} color="#2563eb" />
          <View style={styles.totalTextContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${calculateTotalUSD().toFixed(2)}
            </Text>
            <Text style={styles.totalAmountSecondary}>
              Bs {calculateTotalBolivares().toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{items.length} items scanned</Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <DollarSign size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No items scanned yet</Text>
          <Text style={styles.emptyText}>
            Start scanning prices using the Scanner tab
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#2563eb"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalTextContainer: {
    marginLeft: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  totalAmountSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  clearAllText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currencyBadgeUSD: {
    backgroundColor: '#dbeafe',
  },
  currencyBadgeVES: {
    backgroundColor: '#fef3c7',
  },
  currencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyBadgeTextUSD: {
    color: '#1e40af',
  },
  currencyBadgeTextVES: {
    color: '#92400e',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  itemDetails: {
    marginBottom: 8,
  },
  convertedPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  exchangeRate: {
    fontSize: 14,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
