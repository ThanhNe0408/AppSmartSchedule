import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Image, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

type GmailAuthButtonProps = {
  mode: 'login' | 'signup';
  onLogin?: (user: any) => void; // ✅ THÊM DÒNG NÀY
};

const GmailAuthButton = ({ mode, onLogin }: GmailAuthButtonProps) => {
  const { signInWithGmail, isLoading } = useAuth();

  const handleGmailAuth = async () => {
    try {
      const user = await signInWithGmail(); // ✅ Giả định hàm này trả về `user`
      if (onLogin && user) {
        onLogin(user); // ✅ Gọi callback nếu có
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Google Sign-In Failed', error.message);
      } else {
        Alert.alert('Google Sign-In Failed', 'An unexpected error occurred');
      }
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleGmailAuth}
      disabled={isLoading}
    >
      <View style={styles.buttonContent}>
       
        <Text style={styles.text}>
          {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  text: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GmailAuthButton;
