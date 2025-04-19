import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

type ToggleSwitchProps = {
  isActive: boolean;
  onToggle: () => void;
};

const ToggleSwitch = ({ isActive, onToggle }: ToggleSwitchProps) => {
  return (
    <TouchableOpacity 
      style={[styles.toggleButton, isActive && styles.toggleActive]}
      onPress={onToggle}
    >
      <View style={[
        styles.toggleButtonInner, 
        isActive && styles.toggleButtonActive
      ]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#7B66FF",
  },
  toggleButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleButtonActive: {
    marginLeft: 'auto',
  }
});

export default ToggleSwitch;