import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import BananaLogo from '../components/BananaLogo';
import styles from '../styles';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!onLogin(username.trim(), password)) {
      setError('Incorrect username or password. Please try again.');
      return;
    }
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.loginScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loginCardGroup}>
          <View style={styles.loginLogo}>
            <BananaLogo size={84} />
          </View>
          <View style={styles.loginCard}>
            <AppText style={styles.loginLabel}>Username</AppText>
            <TextInput
              value={username}
              onChangeText={value => {
                setUsername(value);
                setError('');
              }}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              style={styles.loginInput}
              accessibilityLabel="Username"
            />

            <AppText style={styles.loginLabel}>Password</AppText>
            <TextInput
              value={password}
              onChangeText={value => {
                setPassword(value);
                setError('');
              }}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={submit}
              style={styles.loginInput}
              accessibilityLabel="Password"
            />

            {!!error && (
              <View style={styles.loginError}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color="#A33A2B"
                />
                <AppText style={styles.loginErrorText}>{error}</AppText>
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={submit}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <AppText style={styles.loginButtonText}>Sign in</AppText>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <AppText style={styles.loginHint}>Demo login: admin / admin</AppText>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
