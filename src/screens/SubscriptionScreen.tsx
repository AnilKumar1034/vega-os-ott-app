import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {Routes} from '../constants/routes';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {
  getAvailablePlans,
  getSubscriptionStatus,
  normalizeTier,
  selectSubscriptionPlan,
} from '../services/subscriptionService';
import {entitlementService} from '../services/entitlementService';
import {analyticsService} from '../analytics';
import {BillingCycle, SubscriptionPlan} from '../types/subscription';
import {isBackEvent, isKeyDown, isSelectEvent} from '../utils/inputUtils';
import {styles} from './SubscriptionScreen.styles';

export const SubscriptionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user, userProfile, logout} = useAuth();
  const {clearActiveProfile} = useProfile();

  const plans = getAvailablePlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [focusedId, setFocusedId] = useState<string>('card-premium');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const userSub = userProfile?.subscription;
    const tier = normalizeTier(userSub);
    return tier === 'free' ? 'premium' : tier;
  });
  const [updating, setUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentStatus = getSubscriptionStatus(userProfile);
  const currentPlanTier = normalizeTier(userProfile?.subscription);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    analyticsService
      .trackSubscriptionStatusViewed({
        plan_name: userProfile?.subscription || 'none',
        status: currentStatus,
        source_screen: route.params?.sourceScreen || 'Settings',
      })
      .catch(() => {});
  }, [currentStatus, route.params?.sourceScreen, userProfile?.subscription]);

  const handlePlanSelect = useCallback(
    async (plan: SubscriptionPlan) => {
      if (updating) return;

      if (currentPlanTier === plan.tier && currentStatus === 'active') {
        showToast(`You are already subscribed to ${plan.name}.`);
        return;
      }

      setUpdating(true);
      try {
        await selectSubscriptionPlan(plan.id, billingCycle);
        setSelectedPlanId(plan.id);

        if (user?.uid) {
          await entitlementService.refreshEntitlement(user.uid);
        }

        await analyticsService.trackSubscriptionPlanSelected({
          plan_id: plan.id,
          plan_name: plan.name,
          billing_cycle: billingCycle,
          price:
            billingCycle === 'annually'
              ? plan.annualPrice
              : plan.monthlyPrice,
        });

        await analyticsService.trackSubscriptionStatusRefreshed({
          previous_plan: userProfile?.subscription || 'none',
          new_plan: plan.name,
          status: 'active',
        });

        showToast(`Successfully subscribed to ${plan.name}!`);

        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(Routes.Home);
          }
        }, 1200);
      } catch (err: any) {
        showToast(err.message || 'Failed to update subscription. Try again.');
      } finally {
        setUpdating(false);
      }
    },
    [
      billingCycle,
      currentPlanTier,
      currentStatus,
      navigation,
      updating,
      user?.uid,
      userProfile?.subscription,
    ],
  );

  const handleSignOut = async () => {
    try {
      await clearActiveProfile();
      await logout();
      navigation.navigate(Routes.Login);
    } catch {
      // ignore
    }
  };

  useTVEventHandler((evt) => {
    if (!evt || !isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(Routes.Home);
      }
      return;
    }

    if (focusedId === 'cycle-toggle') {
      if (type === 'left' || type === 'right' || isSelectEvent(type)) {
        setBillingCycle((prev) =>
          prev === 'annually' ? 'monthly' : 'annually',
        );
      } else if (type === 'down') {
        setFocusedId(`card-${selectedPlanId || 'premium'}`);
      } else if (type === 'up') {
        setFocusedId('sign-out');
      }
    } else if (focusedId === 'sign-out') {
      if (isSelectEvent(type)) {
        handleSignOut();
      } else if (type === 'down') {
        setFocusedId('cycle-toggle');
      }
    } else if (focusedId.startsWith('card-')) {
      const currentPlanIndex = plans.findIndex(
        (p) => `card-${p.id}` === focusedId,
      );
      if (type === 'left' && currentPlanIndex > 0) {
        setFocusedId(`card-${plans[currentPlanIndex - 1].id}`);
      } else if (type === 'right' && currentPlanIndex < plans.length - 1) {
        setFocusedId(`card-${plans[currentPlanIndex + 1].id}`);
      } else if (type === 'up') {
        setFocusedId('cycle-toggle');
      } else if (isSelectEvent(type) && currentPlanIndex >= 0) {
        handlePlanSelect(plans[currentPlanIndex]);
      }
    }
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      testID="subscription-screen">
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.brandLogo}>LOGIXSTREAM</Text>
        <TouchableOpacity
          style={[
            styles.signOutButton,
            focusedId === 'sign-out' && styles.signOutButtonFocused,
          ]}
          onFocus={() => setFocusedId('sign-out')}
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          testID="subscription-sign-out-button">
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Header & Toggle */}
      <View style={styles.headerSection}>
        <Text style={styles.stepText}>STEP 1 OF 2</Text>
        <Text style={styles.mainHeading}>
          Choose the plan that's right for you
        </Text>

        <TouchableOpacity
          style={[
            styles.cycleToggleContainer,
            focusedId === 'cycle-toggle' && styles.cycleToggleContainerFocused,
          ]}
          onFocus={() => setFocusedId('cycle-toggle')}
          onPress={() =>
            setBillingCycle((prev) =>
              prev === 'annually' ? 'monthly' : 'annually',
            )
          }
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Billing cycle toggle, currently ${billingCycle}`}
          testID="cycle-toggle-button">
          <View
            style={[
              styles.cycleTab,
              billingCycle === 'annually' && styles.cycleTabActive,
            ]}>
            <Text
              style={[
                styles.cycleTabText,
                billingCycle === 'annually' && styles.cycleTabTextActive,
              ]}>
              Annually
            </Text>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best value</Text>
            </View>
          </View>
          <View
            style={[
              styles.cycleTab,
              billingCycle === 'monthly' && styles.cycleTabActive,
            ]}>
            <Text
              style={[
                styles.cycleTabText,
                billingCycle === 'monthly' && styles.cycleTabTextActive,
              ]}>
              Monthly
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plans Horizontal Row */}
      <TVFocusGuideView style={styles.cardsRow} autoFocus>
        {plans.map((plan) => {
          const isFocused = focusedId === `card-${plan.id}`;
          const isCurrentActive =
            currentPlanTier === plan.tier && currentStatus === 'active';
          const isSelected = selectedPlanId === plan.id;
          const price =
            billingCycle === 'annually'
              ? plan.annualPriceFormatted
              : plan.monthlyPriceFormatted;
          const cycleLabel =
            billingCycle === 'annually' ? '/ annually' : '/ monthly';

          return (
            <View key={plan.id} style={styles.cardWrapper}>
              {plan.isMostRecommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Most recommended</Text>
                </View>
              ) : (
                <View style={styles.recommendedBadgePlaceholder} />
              )}

              <TouchableOpacity
                style={[
                  styles.card,
                  isFocused && styles.cardFocused,
                  isSelected && styles.cardSelected,
                ]}
                onFocus={() => setFocusedId(`card-${plan.id}`)}
                onPress={() => handlePlanSelect(plan)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${plan.name} plan, ${price} ${cycleLabel}`}
                testID={`plan-card-${plan.id}`}>
                {/* Colored Header Banner */}
                <View
                  style={[
                    styles.cardBanner,
                    {backgroundColor: plan.accentColor},
                  ]}>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText}>✓</Text>
                    </View>
                  )}

                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceAmount}>{price}</Text>
                    <Text style={styles.priceCycle}>{cycleLabel}</Text>
                  </View>

                  <View style={styles.discountChip}>
                    <Text style={styles.discountText}>
                      Save {plan.savePercent}%
                    </Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.qualitySection}>
                    <Text style={styles.qualityRating}>
                      {plan.qualityLabel.split(' ')[0]}
                    </Text>
                    <Text style={styles.qualitySub}>Video & sound quality</Text>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Text style={styles.checkmark}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.selectButton,
                      isCurrentActive && styles.selectButtonActive,
                      isFocused && styles.selectButtonFocused,
                    ]}>
                    <Text
                      style={[
                        styles.selectButtonText,
                        isFocused && styles.selectButtonTextFocused,
                      ]}>
                      {isCurrentActive
                        ? 'CURRENT PLAN'
                        : isSelected
                        ? 'SELECTED'
                        : 'SELECT PLAN'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </TVFocusGuideView>

      {updating && (
        <ActivityIndicator
          size="large"
          color="#E50914"
          style={styles.loadingIndicator}
        />
      )}

      {toastMsg && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </ScrollView>
  );
};
