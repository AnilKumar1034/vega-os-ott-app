import React, {useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {useAuth} from '../context/authContext';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {colors} from '../theme/colors';
import {sanitizeEmailInput} from '../utils/inputUtils';
import {formatAuthErrorMessage} from '../services/authService';
import {styles} from './LoginScreen.styles';

type Props = {
  navigation: {
    navigate: (routeName: string, params?: unknown) => void;
    dispatch: (action: any) => void;
    replace: (routeName: string, params?: unknown) => void;
  };
};

export const LoginScreen = ({navigation}: Props) => {
  const {login} = useAuth();
  const route = useRoute<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>('email');

  const handleEmailChange = (text: string) => {
    setEmail(sanitizeEmailInput(text));
  };

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogin = async () => {
    const cleanEmail = sanitizeEmailInput(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(strings.errors.validEmail);
      return;
    }
    if (!password) {
      setErrorMsg(strings.errors.enterPassword);
      return;
    }

    setErrorMsg(null);
    setToastMsg(null);
    setLoading(true);

    try {
      await login({
        email: cleanEmail,
        password,
      });
      const redirectTo = route.params?.redirectTo;
      if (redirectTo?.routeName) {
        navigation.replace(redirectTo.routeName, redirectTo.params);
      } else {
        navigation.replace(Routes.Home);
      }
    } catch (err: any) {
      console.log('Login error:', err);
      setErrorMsg(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="login-screen">
      {toastMsg ? (
        <View
          style={styles.toast}
          pointerEvents="none"
          accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}
      <TVFocusGuideView style={styles.card} autoFocus>
        <Text style={styles.title}>{strings.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.loginSubtitle}</Text>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

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
            hasTVPreferredFocus
            testID="login-email-input"
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
            placeholder={strings.placeholders.password}
            placeholderTextColor={colors.inputPlaceholder}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="login-password-input"
          />
        </View>

        {/* Submit Login Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            focusedField === 'submit' && styles.submitButtonFocused,
          ]}
          onFocus={() => setFocusedField('submit')}
          onBlur={() => setFocusedField(null)}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityRole="button"
          testID="login-submit-button">
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>
              {strings.actions.signIn}
            </Text>
          )}
        </TouchableOpacity>

        {/* Switch to Register */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            focusedField === 'switch' && styles.switchButtonFocused,
          ]}
          onFocus={() => setFocusedField('switch')}
          onBlur={() => setFocusedField(null)}
          onPress={() =>
            navigation.navigate(Routes.Register, {
              redirectTo: route.params?.redirectTo,
            })
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          testID="switch-to-register-button">
          <Text style={styles.switchButtonText}>
            {strings.actions.registerNow}
          </Text>
        </TouchableOpacity>
      </TVFocusGuideView>
    </View>
  );
};
