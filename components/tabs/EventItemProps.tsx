import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EventItemProps {
  day: string;
  month: string;
  title: string;
  info: string;
  indicatorColor: string;
}

const EventItem: React.FC<EventItemProps> = ({ day, month, title, info, indicatorColor }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.dateContainer}>
        <Text style={styles.dayText}>{day}</Text>
        <Text style={styles.monthText}>{month}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        <Text style={styles.infoText} numberOfLines={2}>{info}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  dateContainer: {
    width: 50,
    alignItems: "center",
    marginRight: 15,
  },
  dayText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  monthText: {
    fontSize: 12,
    color: "#666",
  },
  contentContainer: {
    flex: 1,
    paddingRight: 40, // Tạo không gian cho action buttons
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
  },
});

export default EventItem;