# Health Sync App

헬스 커넥트(Google Health Connect)에서 건강 데이터를 읽어 https://health-sync-6ses.onrender.com/ 서버로 동기화하는 리액트 네이티브 + 엑스포 앱입니다.

## 주요 기능

- **Health Connect 연동**: Google Health Connect에서 건강 데이터 자동 수집
  - 걸음 수
  - 심박수
  - 칼로리
  - 수면 시간
  - 체중

- **서버 연동**: Health Sync 서버와 양방향 통신
  - 서버에서 기존 데이터 조회
  - Health Connect 데이터를 서버로 동기화
  - Notion 자동 동기화

- **사용자 친화적 UI**
  - Health Connect 사용 가능 여부 실시간 표시
  - 서버 상태 모니터링
  - 날짜 범위 선택
  - 데이터 시각화

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 빌드 생성

Health Connect는 네이티브 모듈이므로 Expo Go로는 실행할 수 없습니다.
개발 빌드를 생성해야 합니다:

```bash
npx expo prebuild
```

### 3. Android에서 실행

#### 에뮬레이터 사용:

```bash
npm run android
```

#### 실제 기기 사용:

1. USB 디버깅 활성화
2. 기기를 컴퓨터에 연결
3. `npm run android` 실행

### 4. 개발 서버 시작 (선택사항)

```bash
npm start
```

## Android 요구사항

- **최소 Android SDK**: 26 (Android 8.0)
- **Health Connect 앱**: Google Play에서 Health Connect 앱 설치 필요

## Health Connect 설정

1. Google Play에서 "Health Connect" 앱 다운로드
2. Health Connect 앱에서 건강 데이터 입력 또는 다른 앱과 연동
3. Health Sync 앱에서 권한 허용

## 사용 방법

1. **사용자 ID 입력**: 서버와 동기화할 사용자 ID 입력
2. **날짜 범위 선택**: 데이터를 가져올 시작/종료 날짜 선택
3. **데이터 가져오기**:
   - **Health Connect에서 가져오기**: 기기의 Health Connect에서 직접 데이터 읽기
   - **서버에서 가져오기**: 서버에 저장된 데이터 조회
4. **Notion 동기화**: 가져온 데이터를 Notion에 자동 동기화

## 프로젝트 구조

```
health-sync-app/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js        # 메인 화면
│   │   ├── InputScreen.js       # 데이터 수동 입력
│   │   └── RecordsScreen.js     # 기록 목록
│   └── services/
│       ├── api.js               # 서버 API 통신
│       └── healthConnect.js     # Health Connect 연동
├── App.js                       # 앱 엔트리 포인트
├── app.json                     # Expo 설정
└── package.json                 # 의존성 관리
```

## 주요 파일 설명

### `src/services/healthConnect.js`
Health Connect와 통신하는 서비스 모듈:
- 초기화 및 상태 확인
- 권한 요청
- 건강 데이터 읽기 (걸음, 심박수, 칼로리, 수면, 체중)
- 날짜별 데이터 집계

### `src/screens/HomeScreen.js`
메인 화면:
- Health Connect 상태 표시
- 서버 상태 모니터링
- 날짜 범위 선택
- Health Connect 또는 서버에서 데이터 가져오기
- Notion 동기화

### `src/services/api.js`
서버 API 통신:
- 서버 상태 확인
- 건강 데이터 동기화
- 기록 조회

## 문제 해결

### Health Connect를 사용할 수 없다고 표시됨

- Android 버전이 8.0 (API 26) 이상인지 확인
- Google Play에서 Health Connect 앱 설치
- 앱을 완전히 종료하고 다시 시작

### 권한 요청이 표시되지 않음

- Health Connect 앱이 설치되어 있는지 확인
- 앱 설정 > 권한에서 Health Connect 권한 확인

### 데이터가 없다고 표시됨

- Health Connect 앱에 데이터가 있는지 확인
- 선택한 날짜 범위에 데이터가 있는지 확인
- 다른 건강 앱(Google Fit 등)과 Health Connect 연동 확인

## 개발 정보

- **React Native**: 0.81.5
- **Expo SDK**: 54
- **Health Connect SDK**: react-native-health-connect 3.4.0
- **서버**: https://health-sync-6ses.onrender.com/

## 라이선스

Private
