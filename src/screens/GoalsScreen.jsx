import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { formatPeso } from '../constants';
import { getGoals, saveGoals, getWallets } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';

const GOAL_ICONS = [
  { name: 'home', label: 'Home' },
  { name: 'airplane', label: 'Travel' },
  { name: 'car', label: 'Car' },
  { name: 'laptop', label: 'Laptop' },
  { name: 'phone-portrait', label: 'Phone' },
  { name: 'school', label: 'School' },
  { name: 'heart', label: 'Health' },
  { name: 'gift', label: 'Gift' },
  { name: 'bicycle', label: 'Bike' },
  { name: 'diamond', label: 'Luxury' },
];

export default function GoalsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [goals, setGoals] = useState([]);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('flag');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const g = await getGoals();
        const w = await getWallets();
        setGoals(g);
        setSavingsBalance(w.savings);
      };
      fetchData();
    }, [])
  );

  const handleAddGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Missing Name', 'Please enter a goal name.');
      return;
    }
    if (!goalTarget || parseFloat(goalTarget) <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      name: goalName.trim(),
      target: parseFloat(goalTarget),
      icon: goalIcon,
      createdAt: new Date().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updatedGoals = [...goals, newGoal];
    await saveGoals(updatedGoals);
    setGoals(updatedGoals);
    setGoalName('');
    setGoalTarget('');
    setGoalIcon('flag');
    setModalVisible(false);
  };

  const handleDeleteGoal = (id) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to remove this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = goals.filter((g) => g.id !== id);
            await saveGoals(updated);
            setGoals(updated);
          },
        },
      ]
    );
  };

  const getProgress = (target) => {
    if (target <= 0) return 0;
    return Math.min(savingsBalance / target, 1);
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet. Set your first savings goal!</Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal.target);
            const isComplete = progress >= 1;

            return (
              <View key={goal.id} style={[
                styles.goalCard,
                isComplete && { borderColor: colors.primary },
              ]}>
                <View style={styles.goalTop}>
                  <View style={[
                    styles.goalIconContainer,
                    { backgroundColor: isComplete ? colors.primary + '20' : colors.goals + '20' }
                  ]}>
                    <Ionicons
                      name={goal.icon || 'flag'}
                      size={22}
                      color={isComplete ? colors.primary : colors.goals}
                    />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDate}>Created {goal.createdAt}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.deleteBtn}>
                    <Ionicons name="close" size={18} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <View style={styles.goalAmounts}>
                  <Text style={styles.goalCurrent}>
                    {formatPeso(Math.min(savingsBalance, goal.target))}
                  </Text>
                  <Text style={styles.goalTarget}>
                    of {formatPeso(goal.target)}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: isComplete ? colors.primary : colors.goals,
                    },
                  ]} />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[
                    styles.goalPercent,
                    { color: isComplete ? colors.primary : colors.goals },
                  ]}>
                    {Math.round(progress * 100)}%
                  </Text>
                  {isComplete ? (
                    <View style={styles.completeTag}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={[styles.completeTagText, { color: colors.primary }]}>Goal Reached!</Text>
                    </View>
                  ) : (
                    <Text style={styles.goalRemaining}>
                      {formatPeso(goal.target - savingsBalance)} remaining
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>

            <Text style={styles.label}>Goal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. New Laptop, Travel Fund"
              placeholderTextColor={colors.subtext}
              value={goalName}
              onChangeText={setGoalName}
            />

            <Text style={styles.label}>Target Amount (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25000"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />

            <Text style={styles.label}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconRow}
            >
              {GOAL_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[
                    styles.iconBtn,
                    goalIcon === icon.name && styles.iconBtnSelected,
                  ]}
                  onPress={() => setGoalIcon(icon.name)}
                >
                  <Ionicons
                    name={icon.name}
                    size={22}
                    color={goalIcon === icon.name ? colors.primary : colors.subtext}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { opacity: goalName && goalTarget ? 1 : 0.5 }]}
                onPress={handleAddGoal}
                disabled={!goalName || !goalTarget}
              >
                <Text style={styles.confirmBtnText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  goalDate: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  goalCurrent: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  goalTarget: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  completeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalRemaining: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  iconRow: {
    gap: 10,
    paddingBottom: 20,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});