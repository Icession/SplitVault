import React, { useState, useCallback } from 'react';
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

import { COLORS, formatPeso } from '../constants';
import { getGoals, saveGoals, getWallets } from '../storage/storage';

export default function GoalsScreen() {

  const [goals, setGoals] = useState([]);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');

  const EMOJI_OPTIONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📱', '👟', '🎓', '💍', '🏖️'];

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
      emoji: goalEmoji,
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
    setGoalEmoji('🎯');
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

  // Calculates progress as a capped percentage of savings vs goal target
  const getProgress = (target) => {
    if (target <= 0) return 0;
    return Math.min(savingsBalance / target, 1);
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <Text style={styles.subtitle}>
          Savings wallet: {formatPeso(savingsBalance)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the button below to create your first savings goal
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal.target);
            const isComplete = progress >= 1;

            return (
              <View key={goal.id} style={[
                styles.goalCard,
                isComplete && styles.goalCardComplete,
              ]}>

                <View style={styles.goalTop}>
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDate}>Created {goal.createdAt}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress amounts */}
                <View style={styles.goalAmounts}>
                  <Text style={styles.goalCurrent}>
                    {formatPeso(Math.min(savingsBalance, goal.target))}
                  </Text>
                  <Text style={styles.goalTarget}>
                    of {formatPeso(goal.target)}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: isComplete ? COLORS.expense : COLORS.savings,
                    },
                  ]} />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[
                    styles.goalPercent,
                    { color: isComplete ? COLORS.expense : COLORS.savings },
                  ]}>
                    {Math.round(progress * 100)}%
                  </Text>
                  {isComplete ? (
                    <Text style={styles.completeTag}>✅ Goal Reached!</Text>
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

      {/* Add Goal Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ New Goal</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
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
              placeholderTextColor={COLORS.subtext}
              value={goalName}
              onChangeText={setGoalName}
            />

            <Text style={styles.label}>Target Amount (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25000"
              placeholderTextColor={COLORS.subtext}
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />

            <Text style={styles.label}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiRow}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiBtn,
                    goalEmoji === emoji && styles.emojiBtnSelected,
                  ]}
                  onPress={() => setGoalEmoji(emoji)}
                >
                  <Text style={styles.emojiOption}>{emoji}</Text>
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
                style={[
                  styles.confirmBtn,
                  { opacity: goalName && goalTarget ? 1 : 0.5 },
                ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
  },
  content: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  goalCardComplete: {
    borderColor: COLORS.expense,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalEmoji: {
    fontSize: 28,
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
  deleteBtnText: {
    fontSize: 14,
    color: COLORS.subtext,
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
    fontSize: 12,
    color: COLORS.expense,
    fontWeight: '600',
  },
  goalRemaining: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.savings,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  emojiRow: {
    gap: 10,
    paddingBottom: 20,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSelected: {
    borderColor: COLORS.savings,
    backgroundColor: COLORS.savings + '22',
  },
  emojiOption: {
    fontSize: 22,
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
    backgroundColor: COLORS.savings,
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