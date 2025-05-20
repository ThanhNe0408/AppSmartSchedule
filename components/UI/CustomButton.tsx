import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  StyleProp, 
  ViewStyle,
  TextStyle 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../../styles/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'outline';
  color?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  style,
  textStyle,
  disabled = false,
  type = 'primary',
  color = COLORS.primary
}) => {
  const { isDarkMode, colors } = useTheme();

  const getButtonStyle = () => {
    switch (type) {
      case 'primary':
        return { backgroundColor: color };
      case 'secondary':
        return { backgroundColor: isDarkMode ? colors.darkCard : colors.card };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: color
        };
      default:
        return { backgroundColor: color };
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'primary':
        return { color: colors.white };
      case 'secondary':
        return { color: isDarkMode ? colors.darkText : colors.text };
      case 'outline':
        return { color };
      default:
        return { color: colors.white };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled || isLoading ? styles.disabledButton : {},
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={type === 'outline' ? color : colors.white} 
          size="small" 
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CustomButton;