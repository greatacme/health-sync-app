import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { healthAPI } from '../services/api';

export default function InputScreen({ route, navigation }) {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    userId: userId,
    recordDate: today,
    steps: '',
    heartRate: '',
    calories: '',
    sleepMinutes: '',
    weightKg: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // 필수 필드 체크
    if (!formData.steps) {
      Alert.alert('오류', '걸음 수는 필수 입력 항목입니다');
      return;
    }

    setLoading(true);
    try {
      // 숫자 변환
      const data = {
        userId: formData.userId,
        recordDate: formData.recordDate,
        steps: parseInt(formData.steps) || 0,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        calories: formData.calories ? parseFloat(formData.calories) : null,
        sleepMinutes: formData.sleepMinutes ? parseInt(formData.sleepMinutes) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
      };

      const response = await healthAPI.syncHealthData(data);

      if (response.success) {
        Alert.alert(
          '성공',
          'Notion에 동기화되었습니다!',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Records', { userId }),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('오류', '데이터 동기화에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>건강 데이터 입력</Text>
          <Text style={styles.subtitle}>사용자: {userId}</Text>
          <Text style={styles.date}>날짜: {formData.recordDate}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>걸음 수 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 10000"
              keyboardType="numeric"
              value={formData.steps}
              onChangeText={(value) => updateField('steps', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>심박수 (bpm)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 72"
              keyboardType="numeric"
              value={formData.heartRate}
              onChangeText={(value) => updateField('heartRate', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>칼로리 (kcal)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 2500"
              keyboardType="numeric"
              value={formData.calories}
              onChangeText={(value) => updateField('calories', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>수면 시간 (분)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 420 (7시간)"
              keyboardType="numeric"
              value={formData.sleepMinutes}
              onChangeText={(value) => updateField('sleepMinutes', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>체중 (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 70.5"
              keyboardType="decimal-pad"
              value={formData.weightKg}
              onChangeText={(value) => updateField('weightKg', value)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Notion에 동기화</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Records', { userId })}
          >
            <Text style={styles.secondaryButtonText}>기록 보기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
