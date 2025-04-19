import React from "react";
import { View, Text, StyleSheet } from "react-native";

type EventItemProps = {
  day: string;
  month: string;
  title: string;
  info: string;
  indicatorColor: string;
};

const EventItem = ({ day, month, title, info, indicatorColor }: EventItemProps) => {
  return (
    <View style={styles.eventItem}>
      <View style={styles.eventTimeContainer}>
        <Text style={styles.eventDay}>{day}</Text>
        <Text style={styles.eventMonth}>{month}</Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{title}</Text>
        <Text style={styles.eventInfo}>{info}</Text>
      </View>
      <View style={[
        styles.eventIndicator, 
        { backgroundColor: indicatorColor }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  eventItem: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  eventTimeContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  eventMonth: {
    fontSize: 12,
    color: "#666",
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventInfo: {
    fontSize: 12,
    color: "#666",
  },
  eventIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    marginLeft: 8,
  }
});

export default EventItem;
