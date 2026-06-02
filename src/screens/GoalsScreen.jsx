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
import { getGoals, saveGoals } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import ProgressBar from '../components/ProgressBar';

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

  // Add / edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('flag');

  // Add funds modal
  const [fundsVisible, setFundsVisible] = useState(false);
  const [fundsGoalId, setFundsGoalId] = useState(null);
  const [fundsAmount, setFundsAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const g = await getGoals();
        setGoals(g);
      };
      fetchData();
    }, [])
  );

  const totalSaved = goals.reduce((sum, g) => sum + (g.saved || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);

  const openAdd = () => {
    setEditingId(null);
    setGoalName('');
    setGoalTarget('');
    setGoalIcon('flag');
    setModalVisible(true);
  };

  const openEdit = (goal) => {
    setEditingId(goal.id);
    setGoalName(goal.name);
    setGoalTarget(String(goal.target));
    setGoalIcon(goal.icon || 'flag');
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Missing Name', 'Please enter a goal name.');
      return;
    }
    const target = parseFloat(goalTarget);
    if (!goalTarget || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    let updated;
    if (editingId) {
      updated = goals.map((g) =>
        g.id === editingId
          ? { ...g, name: goalName.trim(), target, icon: goalIcon }
          : g
      );
    } else {
      const newGoal = {
        id: Date.now().toString(),
        name: goalName.trim(),
        target,
        icon: goalIcon,
        saved: 0,
        createdAt: new Date().toLocaleDateString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      updated = [...goals, newGoal];
    }

    await saveGoals(updated);
    setGoals(updated);
    setModalVisible(false);
  };

  const handleDeleteGoal = (id) => {
    Alert.alert('Delete Goal', 'Are you sure you want to remove this goal?', [
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
    ]);
  };

  const openFunds = (goal) => {
    setFundsGoalId(goal.id);
    setFundsAmount('');
    setFundsVisible(true);
  };

  const handleAddFunds = async () => {
    const amt = parseFloat(fundsAmount);
    if (!fundsAmount || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    const updated = goals.map((g) =>
      g.id === fundsGoalId ? { ...g, saved: (g.saved || 0) + amt } : g
    );
    await saveGoals(updated);
    setGoals(updated);
    setFundsVisible(false);
  };

  const getProgress = (goal) => {
    const saved = goal.saved || 0;
    if (goal.target <= 0) return 0;
    return Math.min(saved / goal.target, 1);
  };

  const fundsGoal = goals.find((g) => g.id === fundsGoalId);

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Savings Goals</Text>
        <PressableScale style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Goal</Text>
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {goals.length === 0 ? (
            <FadeInView delay={0} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="flag-outline" size={32} color={colors.goals} />
              </View>
              <Text style={styles.emptyTitle}>No savings goals yet</Text>
              <Text style={styles.emptyText}>
                Set a target and track your progress toward it.
              </Text>
              <PressableScale style={styles.emptyCta} onPress={openAdd}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyCtaText}>Create your first goal</Text>
              </PressableScale>
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={0} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  Total saved across {goals.length} goal{goals.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.summaryAmount}>{formatPeso(totalSaved)}</Text>
                <Text style={styles.summarySub}>of {formatPeso(totalTarget)} target</Text>
              </FadeInView>

              {goals.map((goal, index) => {
                const progress = getProgress(goal);
                const isComplete = progress >= 1;
                const saved = goal.saved || 0;

                return (
                  <FadeInView key={goal.id} delay={80 + index * 70} style={[
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
                      <TouchableOpacity onPress={() => openEdit(goal)} style={styles.iconBtnSmall}>
                        <Ionicons name="create-outline" size={18} color={colors.subtext} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.iconBtnSmall}>
                        <Ionicons name="trash-outline" size={18} color={colors.subtext} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.goalAmounts}>
                      <Text style={styles.goalCurrent}>
                        {formatPeso(Math.min(saved, goal.target))}
                      </Text>
                      <Text style={styles.goalTarget}>of {formatPeso(goal.target)}</Text>
                    </View>

                    <View style={{ marginBottom: 8 }}>
                      <ProgressBar
                        progress={progress}
                        color={isComplete ? colors.primary : colors.goals}
                        trackColor={colors.border}
                      />
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
                          {formatPeso(Math.max(goal.target - saved, 0))} remaining
                        </Text>
                      )}
                    </View>

                    <PressableScale style={styles.addFundsBtn} onPress={() => openFunds(goal)}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text style={styles.addFundsText}>Add funds</Text>
                    </PressableScale>
                  </FadeInView>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add / Edit goal modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Goal' : 'New Savings Goal'}
            </Text>

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
              <PressableScale style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[styles.confirmBtn, { opacity: goalName && goalTarget ? 1 : 0.5 }]}
                onPress={handleSaveGoal}
                disabled={!goalName || !goalTarget}
              >
                <Text style={styles.confirmBtnText}>
                  {editingId ? 'Save Changes' : 'Create Goal'}
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add funds modal */}
      <Modal
        visible={fundsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFundsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Funds</Text>
            {fundsGoal && (
              <Text style={styles.modalSubtitle}>Toward "{fundsGoal.name}"</Text>
            )}

            <Text style={styles.label}>Amount (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1000"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
              value={fundsAmount}
              onChangeText={setFundsAmount}
            />

            <View style={styles.modalActions}>
              <PressableScale style={styles.cancelBtn} onPress={() => setFundsVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[styles.confirmBtn, { opacity: parseFloat(fundsAmount) > 0 ? 1 : 0.5 }]}
                onPress={handleAddFunds}
                disabled={!(parseFloat(fundsAmount) > 0)}
              >
                <Text style={styles.confirmBtnText}>Add</Text>
              </PressableScale>
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
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.goals + '20',
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
    marginBottom: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  summarySub: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 2,
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
  iconBtnSmall: {
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
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  iconRow: {
    gap: 10,
    paddingBottom: 20,
    paddingTop: 4,
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
    marginTop: 8,
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