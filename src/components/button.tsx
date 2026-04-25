import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const backgroundColor = disabled
    ? Colors.gray300
    : {
        primary: Colors.primary,
        secondary: Colors.secondary,
        danger: Colors.danger,
        outline: Colors.white,
      }[variant];

  const textColor = disabled
    ? Colors.gray500
    : {
        primary: Colors.white,
        secondary: Colors.white,
        danger: Colors.white,
        outline: Colors.primary,
      }[variant];

  const borderColor = {
    primary: 'transparent',
    secondary: 'transparent',
    danger: 'transparent',
    outline: Colors.primary,
  }[variant];

  const paddingVertical = {
    small: Spacing.sm,
    medium: Spacing.md,
    large: Spacing.lg,
  }[size];

  const fontSize = {
    small: FontSize.sm,
    medium: FontSize.md,
    large: FontSize.lg,
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontWeight: '600',
  },
});
