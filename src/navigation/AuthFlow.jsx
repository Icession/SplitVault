import React, { useState } from 'react';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState('login');

  if (screen === 'register') {
    return (
      <RegisterScreen
        onSubmit={onAuthenticated}
        onGoogle={onAuthenticated}
        onGoToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'reset') {
    return (
      <ResetPasswordScreen
        onRequestNewLink={() => setScreen('login')}
      />
    );
  }

  return (
    <LoginScreen
      onSubmit={onAuthenticated}
      onGoogle={onAuthenticated}
      onForgotPassword={() => setScreen('reset')}
      onGoToRegister={() => setScreen('register')}
    />
  );
}