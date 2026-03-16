import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface BackgroundProps {
  children: React.ReactNode;
}

export function Background({ children }: BackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      <View style={[styles.orb, styles.orb4]} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.4,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: '#6366F1',
    top: -100,
    left: -50,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: '#8B5CF6',
    top: 100,
    right: -80,
  },
  orb3: {
    width: 150,
    height: 150,
    backgroundColor: '#10B981',
    bottom: 50,
    left: 20,
  },
  orb4: {
    width: 250,
    height: 250,
    backgroundColor: '#6366F1',
    bottom: -100,
    right: -50,
  },
});