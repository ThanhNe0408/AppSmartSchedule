import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EventItemProps {
  day: string;
  month: string;
  title: string;
  info: string;
  indicatorColor: string;
}

const EventItem: React.FC<EventItemProps> = ({
  day,
  month,
  title,
  info,
  indicatorColor,
}) => {
  return (
    <View style={styles.container}>
      {/* Indicator line with custom color */}
      <View
        style={[styles.indicatorLine, { backgroundColor: indicatorColor }]}
      />

      <View style={styles.content}>
        {/* Date box */}
        <View style={[styles.dateBox, { backgroundColor: indicatorColor + '33' }]}>
          <Text style={styles.dayText}>{day}</Text>
          <Text style={styles.monthText}>{month}</Text>
        </View>

        {/* Event details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <Text style={styles.info} numberOfLines={2} ellipsizeMode="tail">
            {info}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
  },
  indicatorLine: {
    width: 6,
    height: "100%",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    paddingLeft: 8,
    paddingRight: 60, // Để tránh chồng lên các nút button ở bên phải
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dayText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  monthText: {
    fontSize: 12,
    color: "#555",
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#666",
  },
});

export default EventItem;