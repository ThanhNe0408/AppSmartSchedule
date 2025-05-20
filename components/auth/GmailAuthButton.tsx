"use client"

import React from "react"
import { TouchableOpacity, Text, StyleSheet, Alert, View, ActivityIndicator } from "react-native"
import { useAuth } from "../context/AuthContext"
import Icon from "react-native-vector-icons/FontAwesome" // Changed to regular FontAwesome which has the google icon

type GmailAuthButtonProps = {
  mode: "login" | "signup"
  onLogin?: (user: any) => void
}

const GmailAuthButton = ({ mode, onLogin }: GmailAuthButtonProps) => {
  const { signInWithGmail, isLoading } = useAuth()
  const [localLoading, setLocalLoading] = React.useState(false)

  const handleGmailAuth = async () => {
    setLocalLoading(true)
    try {
      const user = await signInWithGmail()
      if (onLogin) {
        onLogin(user)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Google Sign-In Failed", error.message)
      } else {
        Alert.alert("Google Sign-In Failed", "An unexpected error occurred")
      }
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleGmailAuth} disabled={isLoading || localLoading}>
      <View style={styles.buttonContent}>
        {localLoading ? (
          <ActivityIndicator size="small" color="#DB4437" />
        ) : (
          <>
            <Icon name="google" size={20} color="#DB4437" style={styles.icon} />
            <Text style={styles.text}>{mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "#444",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default GmailAuthButton
