import { Clipboard, Platform } from 'react-native';

export const copyToClipboard = (text) => {
  if (Platform.OS === 'web') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
  } else {
    Clipboard.setString(text);
  }
};
