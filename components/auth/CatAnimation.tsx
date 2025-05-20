"use client"

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../../styles/theme';

const { width } = Dimensions.get('window');

const CatAnimation = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(-width)).current;
  
  useEffect(() => {
    // Start the horizontal movement animation
    Animated.timing(moveAnim, {
      toValue: width * 0.7,
      duration: 3000,
      useNativeDriver: true,
    }).start();
    
    // Start the bouncing animation
    const bounce = Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -15,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]);

    // Loop the bounce animation
    Animated.loop(bounce).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.catContainer, 
          { 
            transform: [
              { translateY: bounceAnim },
              { translateX: moveAnim }
            ] 
          }
        ]}
      >
        <Image 
          source={require('../../assets/images/cat_trophy.png')} 
          style={styles.catImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    overflow: 'hidden',
  },
  catContainer: {
    position: 'absolute',
    bottom: 20,
    width: 100,
    height: 100,
  },
  catImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
});

export default CatAnimation;