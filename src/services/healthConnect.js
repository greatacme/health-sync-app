import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// Health Connect 초기화
export const initializeHealthConnect = async () => {
  try {
    const isInitialized = await initialize();
    return isInitialized;
  } catch (error) {
    console.error('Health Connect initialization error:', error);
    return false;
  }
};

// SDK 상태 확인
export const checkHealthConnectStatus = async () => {
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch (error) {
    console.error('Health Connect status check error:', error);
    return false;
  }
};

// 권한 요청
export const requestHealthConnectPermissions = async () => {
  try {
    // 읽기 권한 요청
    const grantedPermissions = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'Weight' },
    ]);

    console.log('Granted permissions:', grantedPermissions);
    return grantedPermissions;
  } catch (error) {
    console.error('Permission request error:', error);
    throw error;
  }
};

// 걸음 수 데이터 가져오기
export const getStepsData = async (startDate, endDate) => {
  try {
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.records || [];
  } catch (error) {
    console.error('Steps data fetch error:', error);
    return [];
  }
};

// 심박수 데이터 가져오기
export const getHeartRateData = async (startDate, endDate) => {
  try {
    const result = await readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.records || [];
  } catch (error) {
    console.error('Heart rate data fetch error:', error);
    return [];
  }
};

// 칼로리 데이터 가져오기
export const getCaloriesData = async (startDate, endDate) => {
  try {
    const result = await readRecords('TotalCaloriesBurned', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.records || [];
  } catch (error) {
    console.error('Calories data fetch error:', error);
    return [];
  }
};

// 수면 데이터 가져오기
export const getSleepData = async (startDate, endDate) => {
  try {
    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.records || [];
  } catch (error) {
    console.error('Sleep data fetch error:', error);
    return [];
  }
};

// 체중 데이터 가져오기
export const getWeightData = async (startDate, endDate) => {
  try {
    const result = await readRecords('Weight', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return result.records || [];
  } catch (error) {
    console.error('Weight data fetch error:', error);
    return [];
  }
};

// 날짜별로 데이터 집계
const aggregateDataByDate = (records, valueKey, aggregationType = 'sum') => {
  const dailyData = {};

  records.forEach(record => {
    const date = new Date(record.startTime).toISOString().split('T')[0];

    if (!dailyData[date]) {
      dailyData[date] = {
        values: [],
        count: 0,
      };
    }

    const value = record[valueKey];
    if (value !== undefined && value !== null) {
      dailyData[date].values.push(value);
      dailyData[date].count += 1;
    }
  });

  // 집계 타입에 따라 계산
  const result = {};
  Object.keys(dailyData).forEach(date => {
    const values = dailyData[date].values;
    if (values.length > 0) {
      if (aggregationType === 'sum') {
        result[date] = values.reduce((a, b) => a + b, 0);
      } else if (aggregationType === 'average') {
        result[date] = values.reduce((a, b) => a + b, 0) / values.length;
      } else if (aggregationType === 'last') {
        result[date] = values[values.length - 1];
      }
    }
  });

  return result;
};

// 모든 건강 데이터를 날짜별로 가져오기
export const getAllHealthDataByDateRange = async (startDate, endDate) => {
  try {
    // 모든 데이터를 병렬로 가져오기
    const [stepsData, heartRateData, caloriesData, sleepData, weightData] = await Promise.all([
      getStepsData(startDate, endDate),
      getHeartRateData(startDate, endDate),
      getCaloriesData(startDate, endDate),
      getSleepData(startDate, endDate),
      getWeightData(startDate, endDate),
    ]);

    // 날짜별로 집계
    const stepsByDate = aggregateDataByDate(stepsData, 'count', 'sum');
    const heartRateByDate = aggregateDataByDate(heartRateData, 'beatsPerMinute', 'average');
    const caloriesByDate = aggregateDataByDate(caloriesData, 'energy', 'sum');

    // 수면 데이터 처리 (분 단위로 변환)
    const sleepByDate = {};
    sleepData.forEach(record => {
      const date = new Date(record.startTime).toISOString().split('T')[0];
      const startTime = new Date(record.startTime);
      const endTime = new Date(record.endTime);
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));

      if (!sleepByDate[date]) {
        sleepByDate[date] = 0;
      }
      sleepByDate[date] += durationMinutes;
    });

    // 체중 데이터 처리
    const weightByDate = {};
    weightData.forEach(record => {
      const date = new Date(record.time).toISOString().split('T')[0];
      weightByDate[date] = record.weight.inKilograms;
    });

    // 모든 날짜 수집
    const allDates = new Set([
      ...Object.keys(stepsByDate),
      ...Object.keys(heartRateByDate),
      ...Object.keys(caloriesByDate),
      ...Object.keys(sleepByDate),
      ...Object.keys(weightByDate),
    ]);

    // 날짜별로 통합된 데이터 생성
    const result = Array.from(allDates).map(date => ({
      recordDate: date,
      steps: Math.round(stepsByDate[date]) || null,
      heartRate: heartRateByDate[date] ? Math.round(heartRateByDate[date]) : null,
      calories: caloriesByDate[date] ? Math.round(caloriesByDate[date]) : null,
      sleepMinutes: sleepByDate[date] || null,
      weightKg: weightByDate[date] || null,
    }));

    // 날짜순으로 정렬
    result.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

    return result;
  } catch (error) {
    console.error('Error fetching all health data:', error);
    throw error;
  }
};

export const healthConnectService = {
  initializeHealthConnect,
  checkHealthConnectStatus,
  requestHealthConnectPermissions,
  getAllHealthDataByDateRange,
  getStepsData,
  getHeartRateData,
  getCaloriesData,
  getSleepData,
  getWeightData,
};

export default healthConnectService;
