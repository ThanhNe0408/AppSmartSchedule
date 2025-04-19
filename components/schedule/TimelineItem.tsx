import React from "react";
import { View, Text, StyleSheet } from "react-native";

type TimelineItemProps = {
  time: string;
  title: string;
  location: string;
  pointColor?: string;
  isLast?: boolean;
};

const TimelineItem = ({ 
  time, 
  title, 
  location, 
  pointColor = "#4285F4",
  isLast = false 
}: TimelineItemProps) => {
  return (
    <View style={styles.timeItem}>
      <View style={[
        styles.timelinePoint,
        { backgroundColor: pointColor }
      ]} />
      {!isLast && <View style={styles.timelineConnector} />}
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTime}>{time}</Text>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineLocation}>{location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timeItem: {
    flexDirection: "row",
    marginBottom: 12,
    position: "relative",
  },
  timelinePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4285F4",
    marginRight: 16,
    marginTop: 4,
    zIndex: 2,
  },
  timelineConnector: {
    position: "absolute",
    left: 5.5,
    top: 12,
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: "#666",
  }
});

export default TimelineItem;
