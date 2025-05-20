"use client"

import { View, Text, StyleSheet, Animated, Easing } from "react-native"
import { useEffect, useRef } from "react"

type AnalyticItemProps = {
  iconText: string
  value: string
  label: string
  circleColor: string
  previousValue?: string
}

const AnalyticItem = ({ iconText, value, label, circleColor, previousValue }: AnalyticItemProps) => {
  // Add animation for value changes
  const animatedValue = useRef(new Animated.Value(0)).current
  const scaleValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Animate when value changes
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bounce,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()

    // Animate counter
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start()
  }, [value])

  // Calculate if value increased or decreased
  const hasChanged = previousValue && previousValue !== value
  const hasIncreased = previousValue && Number.parseFloat(value) > Number.parseFloat(previousValue)

  return (
    <View style={styles.analyticItem}>
      <Animated.View
        style={[styles.analyticCircle, { backgroundColor: circleColor, transform: [{ scale: scaleValue }] }]}
      >
        <Text style={styles.analyticIcon}>{iconText}</Text>
      </Animated.View>

      <View style={styles.valueContainer}>
        <Animated.Text style={styles.analyticValue}>{value}</Animated.Text>

        {hasChanged && (
          <Text style={[styles.changeIndicator, hasIncreased ? styles.increaseIndicator : styles.decreaseIndicator]}>
            {hasIncreased ? "▲" : "▼"}
          </Text>
        )}
      </View>

      <Text style={styles.analyticLabel}>{label}</Text>
    </View>
  )
}

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  analyticIcon: {
    fontSize: 20,
    color: "#fff",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  changeIndicator: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "bold",
  },
  increaseIndicator: {
    color: "#4CAF50",
  },
  decreaseIndicator: {
    color: "#F44336",
  },
})

export default AnalyticItem
