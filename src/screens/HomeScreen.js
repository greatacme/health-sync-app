import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { healthAPI } from '../services/api';
import healthConnectService from '../services/healthConnect';

const USER_ID_KEY = '@health_sync_user_id';

export default function HomeScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [serverStatus, setServerStatus] = useState({ status: 'checking', message: '서버 상태 확인 중...' });
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(false);
  const [healthConnectInitialized, setHealthConnectInitialized] = useState(false);

  useEffect(() => {
    loadUserId();
    checkServerStatus();
    initHealthConnect();
  }, []);

  const loadUserId = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (savedUserId) {
        setUserId(savedUserId);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    }
  };

  const saveUserId = async (id) => {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, id);
    } catch (error) {
      console.error('Failed to save user ID:', error);
    }
  };

  const checkServerStatus = async () => {
    try {
      const status = await healthAPI.checkServerHealth();
      setServerStatus(status);

      // 서버가 시작 중이면 재시도
      if (status.status === 'starting') {
        setTimeout(() => checkServerStatus(), 5000);
      }
    } catch (error) {
      setServerStatus({ status: 'error', message: '서버 상태 확인 실패' });
    }
  };

  const initHealthConnect = async () => {
    try {
      // Health Connect 사용 가능 여부 확인
      const isAvailable = await healthConnectService.checkHealthConnectStatus();
      setHealthConnectAvailable(isAvailable);

      if (isAvailable) {
        // Health Connect 초기화
        const isInitialized = await healthConnectService.initializeHealthConnect();
        setHealthConnectInitialized(isInitialized);

        if (!isInitialized) {
          console.warn('Health Connect initialization failed');
        }
      } else {
        console.warn('Health Connect is not available on this device');
      }
    } catch (error) {
      console.error('Health Connect init error:', error);
      setHealthConnectAvailable(false);
      setHealthConnectInitialized(false);
    }
  };

  const requestHealthConnectPermissions = async () => {
    try {
      if (!healthConnectAvailable) {
        Alert.alert(
          'Health Connect 사용 불가',
          '이 기기에서는 Health Connect를 사용할 수 없습니다. 서버에서 데이터를 가져오는 기능만 사용할 수 있습니다.'
        );
        return false;
      }

      const permissions = await healthConnectService.requestHealthConnectPermissions();
      return permissions && permissions.length > 0;
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('오류', 'Health Connect 권한 요청에 실패했습니다');
      return false;
    }
  };

  const handleFetchFromHealthConnect = async () => {
    if (!userId.trim()) {
      Alert.alert('오류', '사용자 ID를 입력해주세요');
      return;
    }

    saveUserId(userId.trim());

    // 권한 요청
    const hasPermissions = await requestHealthConnectPermissions();
    if (!hasPermissions) {
      return;
    }

    setLoading(true);

    try {
      // Health Connect에서 데이터 가져오기
      const data = await healthConnectService.getAllHealthDataByDateRange(startDate, endDate);

      // userId 추가
      const dataWithUserId = data.map(item => ({
        ...item,
        userId: userId.trim(),
      }));

      setHealthData(dataWithUserId);

      if (data.length === 0) {
        Alert.alert('알림', '해당 기간의 데이터가 없습니다');
      } else {
        Alert.alert('성공', `${data.length}건의 데이터를 가져왔습니다`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('오류', 'Health Connect에서 데이터를 가져오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    if (!userId.trim()) {
      Alert.alert('오류', '사용자 ID를 입력해주세요');
      return;
    }

    saveUserId(userId.trim());
    setLoading(true);

    try {
      // 서버에서 데이터 가져오기
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const data = await healthAPI.getRecordsByDateRange(userId.trim(), startDateStr, endDateStr);
      setHealthData(data);

      if (data.length === 0) {
        Alert.alert('알림', '해당 기간의 데이터가 없습니다');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('오류', '데이터를 가져오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToNotion = async () => {
    if (healthData.length === 0) {
      Alert.alert('알림', '동기화할 데이터가 없습니다');
      return;
    }

    setSyncing(true);
    try {
      // 각 데이터를 Notion에 동기화
      let successCount = 0;
      for (const data of healthData) {
        try {
          await healthAPI.syncHealthData(data);
          successCount++;
        } catch (error) {
          console.error('Sync error for data:', data, error);
        }
      }

      Alert.alert(
        '동기화 완료',
        `${successCount}/${healthData.length} 건의 데이터가 Notion에 동기화되었습니다`
      );
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('오류', 'Notion 동기화에 실패했습니다');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const getServerStatusColor = () => {
    switch (serverStatus.status) {
      case 'online': return '#34C759';
      case 'starting': return '#FF9500';
      case 'checking': return '#007AFF';
      default: return '#FF3B30';
    }
  };

  const renderHealthData = () => {
    if (healthData.length === 0) return null;

    return (
      <View style={styles.dataSection}>
        <Text style={styles.dataSectionTitle}>가져온 데이터 ({healthData.length}건)</Text>
        {healthData.map((item, index) => (
          <View key={index} style={styles.dataCard}>
            <Text style={styles.dataDate}>{item.recordDate}</Text>
            <View style={styles.dataDetails}>
              <Text style={styles.dataItem}>걸음: {item.steps?.toLocaleString() || '-'}</Text>
              {item.heartRate && <Text style={styles.dataItem}>심박수: {item.heartRate} bpm</Text>}
              {item.calories && <Text style={styles.dataItem}>칼로리: {item.calories.toLocaleString()} kcal</Text>}
              {item.sleepMinutes && (
                <Text style={styles.dataItem}>
                  수면: {Math.floor(item.sleepMinutes / 60)}시간 {item.sleepMinutes % 60}분
                </Text>
              )}
              {item.weightKg && <Text style={styles.dataItem}>체중: {item.weightKg} kg</Text>}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Health Sync</Text>

          {/* 서버 상태 */}
          <View style={[styles.serverStatus, { backgroundColor: getServerStatusColor() }]}>
            <Text style={styles.serverStatusText}>
              {serverStatus.status === 'checking' && '● '}
              {serverStatus.message}
            </Text>
            {serverStatus.status === 'checking' && <ActivityIndicator size="small" color="#fff" />}
          </View>

          {/* Health Connect 상태 */}
          <View style={[
            styles.healthConnectStatus,
            { backgroundColor: healthConnectAvailable ? '#34C759' : '#FF9500' }
          ]}>
            <Text style={styles.healthConnectStatusText}>
              Health Connect: {healthConnectAvailable ? '사용 가능' : '사용 불가'}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* 사용자 ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>사용자 ID</Text>
            <TextInput
              style={styles.input}
              placeholder="사용자 ID를 입력하세요"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 시작 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>시작 날짜</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
              />
            )}
          </View>

          {/* 종료 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>종료 날짜</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
              />
            )}
          </View>

          {/* Health Connect에서 가져오기 버튼 */}
          {healthConnectAvailable && (
            <TouchableOpacity
              style={[styles.healthConnectButton, loading && styles.buttonDisabled]}
              onPress={handleFetchFromHealthConnect}
              disabled={loading || !userId.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Health Connect에서 가져오기</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 서버에서 가져오기 버튼 */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleFetchData}
            disabled={loading || !userId.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>서버에서 가져오기</Text>
            )}
          </TouchableOpacity>

          {/* 가져온 데이터 표시 */}
          {renderHealthData()}

          {/* Notion 동기화 버튼 */}
          {healthData.length > 0 && (
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.buttonDisabled]}
              onPress={handleSyncToNotion}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>노션 동기화</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 기록 보기 버튼 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Records', { userId: userId.trim() })}
            disabled={!userId.trim()}
          >
            <Text style={styles.secondaryButtonText}>전체 기록 보기</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  serverStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  healthConnectStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  healthConnectStatusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  healthConnectButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
  syncButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
  dataSection: {
    marginTop: 20,
  },
  dataSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dataDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  dataDetails: {
    gap: 5,
  },
  dataItem: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 2,
  },
});
