import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system/legacy';
import HomeScreen from './src/screens/HomeScreen';
import InputScreen from './src/screens/InputScreen';
import RecordsScreen from './src/screens/RecordsScreen';

const Stack = createStackNavigator();
const LOG_FILE_PATH = FileSystem.documentDirectory + 'health-sync-logs.txt';

// Global error handler
const setupGlobalErrorHandler = () => {
  const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();

  global.ErrorUtils?.setGlobalHandler(async (error, isFatal) => {
    const now = new Date().toISOString();
    const errorLog = `[${now}] [FATAL ERROR] ${isFatal ? 'FATAL: ' : ''}${error.message}\nStack: ${error.stack}\n`;

    console.error('[Global Error Handler]', errorLog);

    try {
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, errorLog, {
        encoding: FileSystem.EncodingType.UTF8,
        append: true,
      });
    } catch (fileError) {
      console.error('Failed to write error log:', fileError);
    }

    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });

  // Unhandled promise rejection handler
  const originalPromiseRejectionHandler = global.onunhandledrejection;
  global.onunhandledrejection = async (event) => {
    const now = new Date().toISOString();
    const reason = event.reason;
    const errorLog = `[${now}] [UNHANDLED REJECTION] ${reason?.message || reason}\nStack: ${reason?.stack || 'No stack'}\n`;

    console.error('[Unhandled Rejection]', errorLog);

    try {
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, errorLog, {
        encoding: FileSystem.EncodingType.UTF8,
        append: true,
      });
    } catch (fileError) {
      console.error('Failed to write rejection log:', fileError);
    }

    if (originalPromiseRejectionHandler) {
      originalPromiseRejectionHandler(event);
    }
  };
};

export default function App() {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Input"
          component={InputScreen}
          options={{ title: '데이터 입력' }}
        />
        <Stack.Screen
          name="Records"
          component={RecordsScreen}
          options={{ title: '기록 목록' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
