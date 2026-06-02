import React, { useState } from 'react';

import AuthScreen from '../screens/AuthScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState('auth');

  if (screen === 'forgot') {
    return <ForgotPasswordScreen onBack={() => setScreen('auth')} />;
  }

  return (
    <AuthScreen
      onAuthenticated={onAuthenticated}
      onForgotPassword={() => setScreen('forgot')}
    />
  );
}