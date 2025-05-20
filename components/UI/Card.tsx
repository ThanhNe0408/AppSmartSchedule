import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { COLORS } from "../../styles/theme";

type CardProps = {
  title: string;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  children: ReactNode;
};

const Card = ({ title, showSeeAll = false, onSeeAllPress, children }: CardProps) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isDarkMode ? colors.darkCard : colors.card,
        shadowColor: isDarkMode ? colors.black : colors.elevation
      }
    ]}>
      <View style={styles.cardHeader}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? colors.darkText : colors.text }
        ]}>
          {title}
        </Text>
        {showSeeAll && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={[
              styles.seeAllText,
              { color: colors.primary }
            ]}>
              Xem tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  }
});

export default Card;
