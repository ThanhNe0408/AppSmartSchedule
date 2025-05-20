import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ToggleSwitch from "../UI/ToggleSwitch";
import { useTheme } from "../context/ThemeContext";
import { COLORS } from "../../styles/theme";

type ReminderSettingProps = {
  label: string;
  isActive: boolean;
  onToggle: () => void;
};

const ReminderSetting = ({ label, isActive, onToggle }: ReminderSettingProps) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <View style={styles.reminderSetting}>
      <Text style={[
        styles.reminderLabel,
        { color: isDarkMode ? colors.darkText : colors.text }
      ]}>
        {label}
      </Text>
      <ToggleSwitch 
        isActive={isActive} 
        onToggle={onToggle}
        activeColor={COLORS.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  reminderSetting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reminderLabel: {
    fontSize: 16,
  }
});

export default ReminderSetting;