import axios from 'axios';

const API_BASE_URL = 'https://health-sync-6ses.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthAPI = {
  // 서버 상태 확인 및 기동
  checkServerHealth: async () => {
    try {
      const response = await api.get('/health/records?userId=healthcheck', {
        timeout: 60000 // 60초 타임아웃
      });
      return { status: 'online', message: '서버가 준비되었습니다' };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return { status: 'starting', message: '서버가 시작 중입니다...' };
      }
      return { status: 'offline', message: '서버 연결 실패' };
    }
  },

  // 건강 데이터 동기화
  syncHealthData: async (data) => {
    const response = await api.post('/health/sync', data);
    return response.data;
  },

  // 전체 기록 조회
  getRecords: async (userId) => {
    const response = await api.get(`/health/records`, {
      params: { userId }
    });
    return response.data;
  },

  // 최신 기록 조회
  getLatestRecord: async (userId) => {
    const response = await api.get(`/health/records/${userId}/latest`);
    return response.data;
  },

  // 날짜 범위로 기록 조회
  getRecordsByDateRange: async (userId, startDate, endDate) => {
    const response = await api.get(`/health/records`, {
      params: { userId }
    });
    // 클라이언트에서 날짜 필터링
    return response.data.filter(record => {
      const recordDate = new Date(record.recordDate);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
  },
};

export default api;
