import React, { useState } from 'react';

import AuthScreen from '../screens/AuthScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState('auth');

  if (screen === 'reset') {
    return <ResetPasswordScreen onRequestNewLink={() => setScreen('auth')} />;
  }

  return (
    <AuthScreen
      onAuthenticated={onAuthenticated}
      onForgotPassword={() => setScreen('reset')}
    />
  );
}
