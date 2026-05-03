import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';

export default function HotelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { selectedHotel, destination, days } = useTripStore();

  if (!selectedHotel) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.cream, fontFamily: Typography.sans }}>No hotel selected.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.gold, marginTop: 12, fontFamily: Typography.sansBold }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalCost = selectedHotel.pricePerNight * days + selectedHotel.taxes * days;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: selectedHotel.images?.[0] || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600' }}
            style={styles.heroImage}
          />
          <LinearGradient colors={['transparent', Colors.navy]} style={styles.imageGradient} />
          <TouchableOpacity style={[styles.backBtn, { top: 12 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.cream} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Stars */}
          <View style={styles.starsRow}>
            {Array.from({ length: selectedHotel.stars || 3 }).map((_, i) => (
              <Text key={i}>⭐</Text>
            ))}
          </View>

          <Text style={styles.hotelName}>{selectedHotel.name}</Text>
          <Text style={styles.location}>{selectedHotel.location}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNum}>{selectedHotel.rating || 4.2}</Text>
            </View>
            <Text style={styles.ratingDesc}>Excellent</Text>
          </View>

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {selectedHotel.amenities?.map((a: string) => (
              <View key={a} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricingCard}>
            <Text style={styles.sectionTitle}>Pricing for {days} Nights</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Room price</Text>
              <Text style={styles.priceValue}>₹{selectedHotel.pricePerNight.toLocaleString('en-IN')} × {days}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & fees</Text>
              <Text style={styles.priceValue}>₹{selectedHotel.taxes} × {days}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{totalCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.cancellationRow}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.cancellationText}>{selectedHotel.cancellation}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Layout.sm }]}>
        <View>
          <Text style={styles.footerPrice}>₹{selectedHotel.pricePerNight.toLocaleString('en-IN')}/night</Text>
          <Text style={styles.footerTotal}>Total: ₹{totalCost.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => router.push('/itinerary')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.saveBtnGrad}>
            <Text style={styles.saveBtnText}>Save Hotel to Plan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  imageContainer: { position: 'relative', height: 280 },
  heroImage: { width: '100%', height: 280, resizeMode: 'cover' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  backBtn: { position: 'absolute', left: Layout.md, backgroundColor: Colors.overlay80, borderRadius: 20, padding: 8 },
  content: { padding: Layout.md },
  starsRow: { flexDirection: 'row', marginBottom: Layout.xs },
  hotelName: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream, marginBottom: 4 },
  location: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginBottom: Layout.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm, marginBottom: Layout.md },
  ratingBadge: { backgroundColor: Colors.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  ratingNum: { fontFamily: Typography.sansExtraBold, fontSize: Typography.sm, color: Colors.navy },
  ratingDesc: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  sectionTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream, marginBottom: Layout.sm, marginTop: Layout.md },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.sm },
  amenityChip: { backgroundColor: Colors.navyLight, borderRadius: Layout.radiusSm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.navyBorder },
  amenityText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.cream },
  pricingCard: { backgroundColor: Colors.navyCard, borderRadius: Layout.radiusLg, padding: Layout.md, marginTop: Layout.md, borderWidth: 1, borderColor: Colors.navyBorder },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  priceValue: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.navyBorder, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream },
  totalValue: { fontFamily: Typography.sansExtraBold, fontSize: Typography.xl, color: Colors.gold },
  cancellationRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: Layout.sm },
  cancellationText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.success },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.navyLight, padding: Layout.md, borderTopWidth: 1, borderTopColor: Colors.navyBorder },
  footerPrice: { fontFamily: Typography.sansExtraBold, fontSize: Typography.lg, color: Colors.gold },
  footerTotal: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  saveBtn: { borderRadius: Layout.radiusMd, overflow: 'hidden' },
  saveBtnGrad: { paddingHorizontal: Layout.xl, paddingVertical: Layout.md },
  saveBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy },
});
