import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorMessage({ message, type = 'error' }: ErrorMessageProps) {
  const backgroundColor = {
    error: Colors.dangerLight,
    warning: Colors.warningLight,
    info: Colors.primaryLight,
  }[type];

  const textColor = {
    error: Colors.danger,
    warning: '#92400E',
    info: Colors.primaryDark,
  }[type];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});
