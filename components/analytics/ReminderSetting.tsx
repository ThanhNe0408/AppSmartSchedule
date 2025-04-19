import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ToggleSwitch from "../UI/ToggleSwitch";

type ReminderSettingProps = {
  label: string;
  isActive: boolean;
  onToggle: () => void;
};

const ReminderSetting = ({ label, isActive, onToggle }: ReminderSettingProps) => {
  return (
    <View style={styles.reminderSetting}>
      <Text style={styles.reminderLabel}>{label}</Text>
      <ToggleSwitch isActive={isActive} onToggle={onToggle} />
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
    color: "#333",
  }
});

export default ReminderSetting;