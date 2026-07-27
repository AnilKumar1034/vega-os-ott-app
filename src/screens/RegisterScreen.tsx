import React, {useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {useAuth} from '../context/AuthProvider';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {colors} from '../theme/colors';
import {sanitizeEmailInput} from '../utils/inputUtils';
import {styles} from './RegisterScreen.styles';

const SUBSCRIPTION_OPTIONS = [
  strings.subscriptions.free,
  strings.subscriptions.basic,
  strings.subscriptions.premium,
  strings.subscriptions.ultra4k,
];

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const {register} = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscription, setSubscription] = useState<string>(strings.subscriptions.premium);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>('username');

  const handleEmailChange = (text: string) => {
    setEmail(sanitizeEmailInput(text));
  };

  const handleRegister = async () => {
    const cleanEmail = sanitizeEmailInput(email);

    if (!username.trim()) {
      setErrorMsg(strings.errors.enterUsername);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(strings.errors.validEmail);
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg(strings.errors.passwordLength);
      return;
    }
    if (!city.trim()) {
      setErrorMsg(strings.errors.enterCity);
      return;
    }
    if (!country.trim()) {
      setErrorMsg(strings.errors.enterCountry);
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await register({
        username: username.trim(),
        email: cleanEmail,
        password,
        subscription,
        city: city.trim(),
        country: country.trim(),
      });
      navigation.navigate(Routes.Home);
    } catch (err: any) {
      console.log('Registration error:', err);
      setErrorMsg(err.message || strings.errors.failedRegister);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="register-screen">
      <TVFocusGuideView style={styles.card} autoFocus>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{strings.auth.registerTitle}</Text>
          <Text style={styles.subtitle}>
            {strings.auth.registerSubtitle}
          </Text>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* Username */}
          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>{strings.auth.usernameLabel}</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'username' && styles.inputFocused,
              ]}
              placeholder={strings.placeholders.username}
              placeholderTextColor={colors.inputPlaceholder}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
              hasTVPreferredFocus
              testID="register-username-input"
            />
          </View>

          {/* Email */}
          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>{strings.auth.emailLabel}</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'email' && styles.inputFocused,
              ]}
              placeholder={strings.placeholders.email}
              placeholderTextColor={colors.inputPlaceholder}
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
              testID="register-email-input"
            />
          </View>

          {/* Password */}
          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>{strings.auth.passwordLabel}</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'password' && styles.inputFocused,
              ]}
              placeholder={strings.placeholders.passwordMin}
              placeholderTextColor={colors.inputPlaceholder}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              testID="register-password-input"
            />
          </View>

          {/* Subscription Tier */}
          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>{strings.auth.subscriptionLabel}</Text>
            <View style={styles.subscriptionRow}>
              {SUBSCRIPTION_OPTIONS.map((option) => {
                const isSelected = subscription === option;
                const isFocused = focusedField === `sub-${option}`;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.subPill,
                      isSelected && styles.subPillActive,
                      isFocused && styles.subPillFocused,
                    ]}
                    onFocus={() => setFocusedField(`sub-${option}`)}
                    onBlur={() => setFocusedField(null)}
                    onPress={() => setSubscription(option)}
                    activeOpacity={0.8}
                    accessibilityRole="button">
                    <Text
                      style={[
                        styles.subPillText,
                        isSelected && styles.subPillTextActive,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* City & Country */}
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>{strings.auth.cityLabel}</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'city' && styles.inputFocused,
                ]}
                placeholder={strings.placeholders.city}
                placeholderTextColor={colors.inputPlaceholder}
                value={city}
                onChangeText={setCity}
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                autoCorrect={false}
                testID="register-city-input"
              />
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>{strings.auth.countryLabel}</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'country' && styles.inputFocused,
                ]}
                placeholder={strings.placeholders.country}
                placeholderTextColor={colors.inputPlaceholder}
                value={country}
                onChangeText={setCountry}
                onFocus={() => setFocusedField('country')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                autoCorrect={false}
                testID="register-country-input"
              />
            </View>
          </View>

          {/* Submit Register Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              focusedField === 'submit' && styles.submitButtonFocused,
            ]}
            onFocus={() => setFocusedField('submit')}
            onBlur={() => setFocusedField(null)}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            testID="register-submit-button">
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>
                {strings.actions.register}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch to Login */}
          <TouchableOpacity
            style={[
              styles.switchButton,
              focusedField === 'switch' && styles.switchButtonFocused,
            ]}
            onFocus={() => setFocusedField('switch')}
            onBlur={() => setFocusedField(null)}
            onPress={() => navigation.navigate(Routes.Login)}
            activeOpacity={0.85}
            accessibilityRole="button"
            testID="switch-to-login-button">
            <Text style={styles.switchButtonText}>
              {strings.actions.alreadyHaveAccount}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TVFocusGuideView>
    </View>
  );
};
