import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Platform, View, Text, TextInput, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [ipAddress, setIpAddress] = useState('192.168.1.100'); // Default placeholder IP
  const [isConfigured, setIsConfigured] = useState(false);

  // In production (e.g. TestFlight), we don't ask for an IP address.
  const isProduction = !__DEV__;
  const productionUrl = 'https://example.com'; // TODO: Replace with your actual Memore web app URL!
  const devUrl = `http://${Platform.OS === 'android' && ipAddress === 'localhost' ? '10.0.2.2' : ipAddress}:9002`;
  
  const urlToLoad = isProduction ? productionUrl : devUrl;

  if (!isProduction && !isConfigured) {
    return (
      <SafeAreaView style={styles.configContainer}>
        <StatusBar style="auto" />
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Memore Mobile!</Text>
          <Text style={styles.subtitle}>
            To run this app on your phone via Expo Go, enter your computer's local IP address below:
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="e.g. 192.168.1.50"
            value={ipAddress}
            onChangeText={setIpAddress}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
          />

          <View style={styles.buttonWrapper}>
            <Button
              title="Connect & Launch App"
              color="#C4622D"
              onPress={() => setIsConfigured(true)}
            />
          </View>
          
          <Text style={styles.infoText}>
            Tip: You can find your IP address in system settings under Network. Make sure your phone and computer are on the same Wi-Fi network.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebView 
        source={{ uri: urlToLoad }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F4',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  webview: {
    flex: 1,
  },
  configContainer: {
    flex: 1,
    backgroundColor: '#FAF7F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#1A0F06',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(26, 15, 6, 0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A0F06',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#8C7B6B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(26, 15, 6, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FAF7F4',
    fontSize: 15,
    color: '#1A0F06',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 11,
    color: '#B0A090',
    textAlign: 'center',
    lineHeight: 16,
  },
});
