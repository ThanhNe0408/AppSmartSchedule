import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { COLORS } from "../../styles/theme";

type ToggleSwitchProps = {
  isActive: boolean;
  onToggle: () => void;
  activeColor?: string;
};

const ToggleSwitch = ({ isActive, onToggle, activeColor = COLORS.primary }: ToggleSwitchProps) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.toggleButton, 
        {
          backgroundColor: isDarkMode ? colors.darkBorder : "#E0E0E0"
        },
        isActive && { backgroundColor: activeColor }
      ]}
      onPress={onToggle}
    >
      <View style={[
        styles.toggleButtonInner, 
        {
          backgroundColor: isDarkMode ? colors.darkText : colors.white
        },
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
    padding: 2,
  },
  toggleButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleButtonActive: {
    marginLeft: "auto",
  }
});

export default ToggleSwitch;