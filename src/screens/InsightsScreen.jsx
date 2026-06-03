import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';

import { formatPeso } from '../constants';
import { getTransactions } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';

const PALETTE = [
  '#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA',
  '#FB923C', '#22D3EE', '#F472B6', '#4ADE80', '#94A3B8',
];

const RANGES = [
  { key: 'month', label: 'This month' },
  { key: 'last', label: 'Last month' },
  { key: 'all', label: 'All time' },
];

const txTime = (t) => {
  if (t.createdAt) return new Date(t.createdAt);
  const n = Number(t.id);
  return n ? new Date(n) : null;
};

const inRange = (t, range) => {
  if (range === 'all') return true;
  const d = txTime(t);
  if (!d) return false;
  const now = new Date();
  if (range === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  // last month
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
};

export default function InsightsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [transactions, setTransactions] = useState([]);
  const [range, setRange] = useState('month');

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTransactions);
    }, [])
  );

  const data = useMemo(() => {
    const byCat = {};
    transactions
      .filter((t) => t.type === 'expense' && inRange(t, range))
      .forEach((t) => {
        const cat = t.category || 'Other';
        byCat[cat] = (byCat[cat] || 0) + t.amount;
      });
    return Object.entries(byCat)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  }, [transactions, range]);

  const total = data.reduce((s, d) => s + d.value, 0);

  // Donut geometry
  const SIZE = 200;
  const STROKE = 30;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  let acc = 0;

  const RangePicker = () => (
    <View style={styles.segment}>
      {RANGES.map((r) => {
        const active = range === r.key;
        return (
          <Pressable
            key={r.key}
            style={[styles.segBtn, active && styles.segBtnActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Insights</Text>
        <Text style={styles.screenSub}>Your spending breakdown</Text>
      </View>

      <RangePicker />

      {total === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="pie-chart-outline" size={30} color={colors.subtext} />
          </View>
          <Text style={styles.emptyTitle}>No expenses to show</Text>
          <Text style={styles.emptyText}>
            {range === 'all'
              ? 'Add some expenses and your spending breakdown will appear here.'
              : 'There are no expenses in this period. Try another range.'}
          </Text>
        </View>
      ) : (
        <FadeInView>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by category</Text>
            <View style={styles.donutWrap}>
              <Svg width={SIZE} height={SIZE}>
                <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
                  <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    stroke={colors.border}
                    strokeWidth={STROKE}
                    fill="none"
                  />
                  {data.map((d) => {
                    const len = (d.value / total) * C;
                    const seg = (
                      <Circle
                        key={d.label}
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        stroke={d.color}
                        strokeWidth={STROKE}
                        fill="none"
                        strokeDasharray={`${len} ${C - len}`}
                        strokeDashoffset={-acc}
                        strokeLinecap="butt"
                      />
                    );
                    acc += len;
                    return seg;
                  })}
                </G>
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutTotalLabel}>Total spent</Text>
                <Text style={styles.donutTotal}>{formatPeso(total)}</Text>
              </View>
            </View>

            <View style={styles.legend}>
              {data.map((d) => (
                <View key={d.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                  <Text style={styles.legendLabel}>{d.label}</Text>
                  <Text style={styles.legendPct}>
                    {Math.round((d.value / total) * 100)}%
                  </Text>
                  <Text style={styles.legendAmount}>{formatPeso(d.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 56,
  },
  headerArea: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  screenSub: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 2,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 20,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  segTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutTotalLabel: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  donutTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  legend: {
    marginTop: 12,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  legendPct: {
    fontSize: 13,
    color: COLORS.subtext,
    width: 44,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 100,
    textAlign: 'right',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
});