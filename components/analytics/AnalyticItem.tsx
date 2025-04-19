import React from "react";
import { View, Text, StyleSheet } from "react-native";

type AnalyticItemProps = {
  iconText: string;
  value: string;
  label: string;
  circleColor: string;
};

const AnalyticItem = ({ iconText, value, label, circleColor }: AnalyticItemProps) => {
  return (
    <View style={styles.analyticItem}>
      <View style={[
        styles.analyticCircle, 
        { backgroundColor: circleColor }
      ]}>
        <Text style={styles.analyticIcon}>{iconText}</Text>
      </View>
      <Text style={styles.analyticValue}>{value}</Text>
      <Text style={styles.analyticLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  analyticItem: {
    alignItems: "center",
  },
  analyticCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  analyticIcon: {
    fontSize: 20,
    color: "#fff",
  },
  analyticValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  analyticLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  }
});

export default AnalyticItem;