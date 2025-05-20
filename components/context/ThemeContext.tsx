import React, { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { COLORS } from "../../styles/theme"

type ThemeContextType = {
  isDarkMode: boolean
  toggleTheme: () => Promise<void>
  colors: typeof COLORS
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme_mode")
        setIsDarkMode(savedTheme === "dark")
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }
    loadTheme()
  }, [])

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode
      setIsDarkMode(newMode)
      await AsyncStorage.setItem("theme_mode", newMode ? "dark" : "light")
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  // Customize colors based on theme
// ... existing code ...
  // Customize colors based on theme
  const colors = {
    ...COLORS,
    primary: COLORS.primary,
    background: isDarkMode ? COLORS.dark.background : COLORS.background,
    card: isDarkMode ? COLORS.darkCard : COLORS.card,
    text: isDarkMode ? COLORS.darkText : COLORS.text,
    textLight: isDarkMode ? COLORS.darkTextLight : COLORS.textLight,
    border: isDarkMode ? COLORS.darkBorder : COLORS.border,
  }
// ... existing code ...

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
} 