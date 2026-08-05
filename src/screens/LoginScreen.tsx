import React, {useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {useAuth} from '../context/authContext';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {colors} from '../theme/colors';
import {sanitizeEmailInput} from '../utils/inputUtils';
import {styles} from './LoginScreen.styles';

type NetInfoState = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

type RuntimeNetworkCheckResult =
  | {
      ok: true;
      reason: 'online';
      details: {
        networkState: NetInfoState | null;
        internetProbe: {ok: true; status?: number};
        googleProbe: {ok: true; status?: number};
      };
    }
  | {
      ok: false;
      reason: 'no_network' | 'no_internet' | 'google_blocked' | 'probe_timed_out';
      details: {
        networkState: NetInfoState | null;
        internetProbe?: {ok: boolean; status?: number; error?: string};
        googleProbe?: {ok: boolean; status?: number; error?: string};
      };
    };

const INTERNET_PROBE_URL = 'https://example.com/';
const INTERNET_PROBE_TIMEOUT_MS = 4000;
const GOOGLE_PROBE_TIMEOUT_MS = 4000;

const getNetworkState = async (): Promise<NetInfoState | null> => {
  try {
    const {fetch} = require('@amazon-devices/keplerscript-netmgr-lib');
    if (typeof fetch === 'function') {
      return await fetch();
    }
  } catch (error) {
    console.log('Network preflight unavailable:', error);
  }

  return null;
};

const probeUrl = async (url: string, timeoutMs: number) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {Accept: 'text/plain'},
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {ok: response.ok, status: response.status};
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      return {ok: false, error: 'PROBE_TIMED_OUT'};
    }

    const message =
      error instanceof TypeError && /Network request failed/i.test(error.message)
        ? 'NETWORK_REQUEST_FAILED'
        : error?.message || 'REQUEST_FAILED';

    return {ok: false, error: message};
  }
};

const checkRuntimeNetwork = async (): Promise<RuntimeNetworkCheckResult> => {
  const networkState = await getNetworkState();
  const isConnected = networkState?.isConnected === true;

  if (!isConnected) {
    return {
      ok: false,
      reason: 'no_network' as const,
      details: {
        networkState,
      },
    };
  }

  const internetProbe = await probeUrl(
    INTERNET_PROBE_URL,
    INTERNET_PROBE_TIMEOUT_MS,
  );
  if (!internetProbe.ok) {
    if (internetProbe.error === 'PROBE_TIMED_OUT') {
      return {
        ok: false,
        reason: 'probe_timed_out' as const,
        details: {
          networkState,
          internetProbe,
        },
      };
    }

    return {
      ok: false,
      reason: 'no_internet' as const,
      details: {
        networkState,
        internetProbe,
      },
    };
  }

  const googleProbe = await probeUrl(
    'https://www.google.com/generate_204',
    GOOGLE_PROBE_TIMEOUT_MS,
  );
  if (!googleProbe.ok) {
    if (googleProbe.error === 'PROBE_TIMED_OUT') {
      return {
        ok: false,
        reason: 'probe_timed_out' as const,
        details: {
          networkState,
          internetProbe,
          googleProbe,
        },
      };
    }

    return {
      ok: false,
      reason: 'google_blocked' as const,
      details: {
        networkState,
        internetProbe,
        googleProbe,
      },
    };
  }

  return {
    ok: true,
    reason: 'online',
    details: {
      networkState,
      internetProbe: {
        ok: true,
        status: internetProbe.status,
      },
      googleProbe: {
        ok: true,
        status: googleProbe.status,
      },
    },
  };
};

type Props = {
  navigation: {
    navigate: (routeName: string, params?: unknown) => void;
    dispatch: (action: any) => void;
  };
};

export const LoginScreen = ({navigation}: Props) => {
  const {login} = useAuth();

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
      const runtimeNetwork = await checkRuntimeNetwork();
      if (!runtimeNetwork.ok) {
        if (runtimeNetwork.reason === 'no_network') {
          setErrorMsg(strings.errors.networkUnavailable);
        } else if (runtimeNetwork.reason === 'no_internet') {
          showToast(strings.errors.noInternetToast);
        } else if (runtimeNetwork.reason === 'probe_timed_out') {
          setErrorMsg(strings.errors.networkProbeTimeout);
        } else {
          setErrorMsg(strings.errors.googleBlocked);
        }
        return;
      }

      await login({
        email: cleanEmail,
        password,
      });
      navigation.dispatch(StackActions.replace(Routes.Settings));
    } catch (err: any) {
      console.log('Login error:', err);
      setErrorMsg(err.message || strings.errors.invalidLogin);
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
          onPress={() => navigation.navigate(Routes.Register)}
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
