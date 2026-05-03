/**
 * SaffronInput.tsx
 * A TextInput wrapper that shows a saffron (#F5A623) border on focus,
 * matching the TripWise light-theme design system.
 *
 * Usage:
 *   <SaffronInput
 *     placeholder="Enter destination"
 *     value={text}
 *     onChangeText={setText}
 *     style={styles.myInput}     // optional extra style
 *     inputStyle={styles.text}   // optional text style override
 *   />
 */
import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Typography } from '../constants/Typography';

interface SaffronInputProps extends TextInputProps {
  /** Extra style applied to the outer container View */
  containerStyle?: ViewStyle;
  /** Extra style applied to the TextInput itself */
  inputStyle?: TextStyle;
}

export default function SaffronInput({
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}: SaffronInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused ? styles.containerFocused : styles.containerBlurred,
        containerStyle,
      ]}
    >
      <TextInput
        placeholderTextColor="#9B96A8"
        style={[styles.input, inputStyle]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  containerBlurred: {
    borderColor: '#EDE8E0',
  },
  containerFocused: {
    borderColor: '#F5A623',
    // Subtle amber glow shadow
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    fontFamily: Typography.sans,
    fontSize: 15,
    color: '#1A1A2E',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
