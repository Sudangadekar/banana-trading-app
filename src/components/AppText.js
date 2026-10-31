import React from 'react';
import { Platform, Text as NativeText } from 'react-native';

const systemFontFamily = Platform.select({
  android: 'sans-serif',
  web: 'system-ui',
});

export default function AppText({ style, ...props }) {
  return (
    <NativeText
      {...props}
      allowFontScaling
      style={[
        {
          fontFamily: systemFontFamily,
          fontSize: 14,
          lineHeight: 20,
          color: '#26372C',
        },
        style,
      ]}
    />
  );
}
