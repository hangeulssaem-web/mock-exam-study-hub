# GitHub Pages 및 Firebase 모의고사 앱 설계

## 목표

현재 모의고사 준비 허브를 새 공개 GitHub 저장소와 GitHub Pages에 배포하고, 모의고사 노트의 기록을 Firebase Authentication + Cloud Firestore에 사용자별로 저장한다.

## 선택한 접근

- GitHub Pages는 `dist/`를 GitHub Actions로 배포한다. 기존 순수 HTML/CSS/JavaScript 구조와 저장소 경로 하위 배포를 유지한다.
- Firebase Modular Web SDK는 공식 Firebase CDN의 버전을 고정해 사용한다. 별도 빌드 의존성 없이 현재 정적 사이트에 연결한다.
- Google 계정 로그인은 Firebase Authentication 팝업 흐름을 쓴다. 인증은 현재 탭의 세션으로만 유지한다. Firestore 경로는 `users/{uid}/notes/{noteId}`로 한정한다.
- 허브의 프로그램 목록은 기존처럼 브라우저에 남긴다. 모의고사 노트만 로그인한 사용자의 Firestore에서 읽고 쓴다.
- 기존 브라우저 로컬 노트는 로그인만으로 전송하지 않는다. 앱 화면의 명시적 이전 동작을 선택한 경우에만 로그인 사용자의 계정으로 복사하고, 성공 후 원본 로컬 복사본을 지운다.
- Firebase 웹 구성값은 브라우저에서 공개되는 값으로 취급한다. 비밀 키나 서비스 계정은 배포하지 않고, 데이터 보호는 Firestore 규칙과 Firebase 프로젝트의 API 키 제한으로 수행한다.

## 개인정보 범위

- Google 로그인은 Firebase Authentication을 통해 계정 식별을 한다. 앱은 이메일을 Firestore에 저장하지 않는다.
- 노트는 로그인 UID 경로로 격리하고, 본인 외 읽기·쓰기·삭제를 거부한다.
- 앱은 Analytics, 광고, 쿠키, 자체 서버 요청을 추가하지 않는다.
- 사용자에게 로그인 후 기록이 Firebase에 저장된다는 안내와 로컬 기록 이전 동의를 표시한다.

## Firestore 데이터 모델

Collection path: `users/{uid}/notes/{noteId}`

Fields:

- `examLabel`: string, 1–60 characters, required
- `examDate`: string, empty or `YYYY-MM-DD`, required
- `subject`: string, one of `국어`, `수학`, `영어`, `한국사`, `탐구`, `기타`
- `kind`: string, one of `오답`, `핵심 개념`, `질문`, `학습 메모`
- `title`: string, 1–80 characters, required
- `body`: string, 1–1400 characters, required
- `reviewDate`: string, empty or `YYYY-MM-DD`, required
- `createdAt`: Firestore timestamp, required and immutable
- `updatedAt`: Firestore timestamp, required; updates use server time

Client query: only this signed-in user's notes, ordered by `createdAt` descending, capped to the latest 500 records. Search and subject filter remain client-side as in the current app.

## 계정 연결 전 단계

GitHub와 Google 브라우저 세션은 로그아웃 상태다. 로컬에는 GitHub 원격 저장소, GitHub CLI, Firebase CLI, Firebase 프로젝트 설정이 없다. 로컬 구현과 검토는 진행할 수 있지만 저장소 생성·Firebase 구성·프로바이더 설정·배포는 사용자가 브라우저에서 직접 로그인한 다음 완료한다. 암호나 비밀 키를 채팅으로 요청하지 않는다.

## 공개 배포 파일 보안 검토

- Tracked source includes only the static app, documentation, public cover image, and Sites metadata project ID.
- No tokens, service account JSON, OAuth client secret, user notes, email, phone, or school data are present in tracked files or Git history.
- The current app uses localStorage for notes and project cards; user input is inserted with `textContent`. The only third-party runtime resources are Google Fonts and the official Firebase SDK when configured.
- The approved Firestore Standard database location is Seoul: `asia-northeast3`.
- Public Pages exposes all code and the EBS cover PNG. The cover is publisher artwork with an official source link; check reuse permission before redistributing the repository outside the intended educational use.

## 미완료 외부 설정

- GitHub account sign-in, public repository creation, Pages deployment enablement.
- Firebase project and Web app creation, Google provider enablement, Firestore Standard database in `asia-northeast3`, deployment of the rules, and adding the GitHub Pages host to authorized domains.
- Public Firebase Web config values added to `dist/firebase-config.js` after the Firebase app is registered.

## 근거 자료

- Firebase Google login: https://firebase.google.com/docs/auth/web/google-signin
- Firebase Firestore security rules: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firebase CDN SDK: https://firebase.google.com/docs/web/alt-setup
