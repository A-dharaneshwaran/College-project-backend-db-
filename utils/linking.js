import { Linking, Platform } from 'react-native';

export const sendEmail = (email) => {
  const url = `mailto:${email}`;
  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    Linking.openURL(url).catch(err => console.error('Error opening email link:', err));
  }
};

export const makeCall = (phone) => {
  const url = `tel:${phone}`;
  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    Linking.openURL(url).catch(err => console.error('Error opening phone link:', err));
  }
};
