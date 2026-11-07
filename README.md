# 모의고사 준비 허브

고3 모의고사 학습 도구와 노트를 정리하는 정적 웹앱입니다. 프로그램 카드 목록은 브라우저에 저장하고, 모의고사 노트는 Google 로그인 후 Firebase Cloud Firestore에 사용자별로 저장합니다.

## GitHub Pages 배포

`.github/workflows/pages.yml`은 전체 커밋 SHA로 고정한 공식 Actions를 사용해 `main` 변경 때 `dist/`를 GitHub Pages로 배포합니다. 저장소의 **Settings → Pages → Build and deployment → Source**를 `GitHub Actions`로 설정하세요.

## Firebase 연결

1. Firebase Console에서 프로젝트를 만들고 웹 앱을 등록합니다.
2. 프로젝트의 **Authentication → Sign-in method**에서 Google 로그인을 켭니다.
3. **Firestore Database**에서 Standard 데이터베이스를 만듭니다. 한국 사용자를 위한 권장 위치는 `asia-northeast3` (Seoul)이지만, 데이터베이스 위치는 나중에 바꿀 수 없으므로 생성 전에 직접 선택하세요.
4. `dist/firebase-config.js`에는 등록된 웹 앱의 공개 Firebase 설정값이 적용되어 있습니다. 이 값에는 비밀키가 포함되지 않습니다.
5. Authentication의 **Authorized domains**에 GitHub Pages 호스트(`계정명.github.io`)와 로컬 개발용 `localhost`를 추가합니다. 저장소 경로는 도메인에 포함하지 않습니다.
6. 저장소 루트에서 Firebase CLI로 `firebase deploy --project <project-id> --only firestore:rules,firestore:indexes`를 실행합니다.
7. Firebase에서 발급한 브라우저 API 키는 공개 설정값입니다. Firebase 서비스만 사용하도록 API 제한을 확인하고, 어떤 경우에도 서비스 계정 JSON이나 OAuth 클라이언트 비밀값을 브라우저 코드에 넣지 마세요.

Firestore Rules는 로그인 사용자 UID 아래의 노트만 허용하며, 필드·자료형·길이를 검사합니다. `firestore.rules`는 보안 규칙 초안이므로 실제 배포 전에 Firebase Rules 도구로 문법을 검증하고 검토해야 합니다.

## 개인정보와 저장

- 추적용 Analytics, 광고, 별도 API 서버를 추가하지 않았습니다. 브라우저는 Google Fonts와 Firebase SDK/CDN에 연결됩니다.
- Firebase Authentication은 Google 계정 인증을 처리합니다. 앱 화면에는 표시 이름만 표시하며 이메일을 노트에 저장하지 않습니다.
- 로그인은 현재 탭의 세션으로만 유지되며 탭을 닫으면 로그아웃됩니다. 공유 기기에 로그인 상태를 남기지 않도록 합니다.
- 모의고사 노트는 `users/{uid}/notes/{noteId}` 경로에 저장됩니다. 프로젝트 카드 목록은 이 브라우저의 localStorage에 남습니다.
- 로그인 후 기존 localStorage 기록을 옮기도록 누르면, 확인 창에서 동의한 뒤에만 Firebase로 전송합니다. 이전이 실패하면 브라우저 원본은 보존됩니다. 유효하지 않은 로컬 항목은 자동 전송하지 않습니다.
- 기록 내용에 본인 외 다른 학생의 이름, 연락처, 민감한 정보를 쓰지 마세요.
- 브라우저에는 Firebase Web 앱 설정값이 공개됩니다. Firebase API 키는 프로젝트 식별값이며 비밀번호가 아닙니다. 실제 데이터 접근 보호는 Firestore Rules가 담당합니다.
- 위 안내는 기능 설명이며 정식 개인정보 처리방침을 대신하지 않습니다. 공개 운영 전 운영자 연락처와 개인정보 문의·삭제 절차를 포함한 정책을 확정하세요.

## 실행

`dist/index.html`을 정적 웹 서버로 제공하세요. Firebase 설정이 없으면 로그인과 노트 입력은 비활성화되고 설정 안내가 표시됩니다. Google 로그인 공급자, 승인 도메인, 데이터베이스 규칙을 Firebase Console에서 먼저 설정해야 합니다.

## 표지 이미지

`dist/assets/suneung-2027-literature-cover.png`는 EBSi 2027학년도 수능특강 국어영역 문학 교재 페이지의 이미지입니다. 표지 출처 링크에서 공식 페이지를 열 수 있습니다. 공개 저장소에 표지 이미지를 재배포하기 전에 사용 권한을 확인하세요.
