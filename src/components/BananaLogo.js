import React from 'react';
import { Image } from 'react-native';

export default function BananaLogo({ size = 44 }) {
  return (
    <Image
      source={require('../assets/banana-badge.png')}
      resizeMode="contain"
      style={{ width: size, height: size }}
      accessibilityLabel="Bunch of bananas with a leaf"
    />
  );
}
