# 공개 배포 전 보안·개인정보 검토

검토 범위: 현재 Git 추적 파일과 두 개의 저장소 커밋, 정적 앱 코드, 새 GitHub Pages workflow, Firebase 클라이언트 설정·Firestore 규칙 초안.

## 현재 확인

- 추적 파일이나 Git 히스토리에서 서비스 계정 키, 비밀번호, OAuth 비밀값, 액세스 토큰, 실명·연락처·학교 정보, 사용자 노트 데이터가 확인되지 않았습니다.
- `.superpowers/` 작업 기록은 Git ignore 상태이며 Pages artifact에는 포함되지 않습니다.
- `.openai/hosting.json`에는 Sites 프로젝트 식별자가 있지만 인증 자격 증명은 아닙니다.
- 앱 사용자 입력은 `textContent`로 표시합니다. 임의 HTML 실행, 쿠키 수집, 분석/광고 호출, 자체 서버 전송 코드는 없습니다.
- Firebase 설정 파일에는 실제 웹 앱의 공개 클라이언트 설정이 있습니다. Firebase API 키는 웹에 노출되는 프로젝트 식별 값이며, 데이터 접근은 Security Rules로 제한합니다. 서비스 계정 JSON은 앱에 넣지 않습니다.
- Pages workflow는 최소 권한을 사용하고 공식 GitHub Actions를 전체 커밋 SHA에 고정합니다.
- 독립 보안 리뷰에서 일부 기록 가져오기가 완료로 잘못 표시되어 재시도 버튼을 숨기는 문제를 발견했습니다. 완료된 가져오기에만 로컬 원본 제거를 허용하고, 미완료 건은 같은 기록 ID로 안전하게 재시도할 수 있도록 수정했습니다.

## 개인정보 흐름

- Google 계정 인증은 Firebase Authentication이 처리합니다. 앱 화면에는 표시 이름만 사용하고 이메일을 Firestore 노트 필드에 저장하지 않습니다.
- 노트는 `users/{uid}/notes/{noteId}` 아래에만 저장하고, 규칙 초안은 UID 소유자 외 접근을 거부합니다.
- 허브 프로그램 카드는 현재 브라우저의 `localStorage`에 남습니다. 기존 노트는 사용자가 옮기기 버튼을 선택하고 확인한 경우에만 Firebase로 전송합니다. 실패 시 원본을 지우지 않습니다.
- 로그인 세션은 현재 탭에서만 유지되도록 구성했습니다. 노트는 사용자가 삭제할 때까지 보관되며, 한 건씩 앱에서 삭제할 수 있습니다.
- 브라우저는 Google Fonts와 Firebase SDK의 공식 CDN에 연결됩니다. Firebase 설정이 비어 있으면 Firebase SDK를 불러오거나 노트 요청을 보내지 않습니다.

## 배포 전 미완료 사항

- Firebase project `mock-exam-study-hub`와 웹 앱은 생성되었습니다. Firestore `asia-northeast3` Standard 인스턴스 프로비저닝, Google Provider, GitHub Pages 승인 도메인, Rules 배포·문법 검증은 아직 진행 중입니다. 규칙은 초안이며 활성화되기 전에 Firebase 도구로 검사해야 합니다.
- GitHub 인증은 연결되어 있으나 새 저장소 생성 기능은 연결 도구에 없고 로컬 GitHub CLI도 설치되어 있지 않습니다. 원격 저장소 생성, push, Pages 실행은 계정 브라우저 접근 후 완료해야 합니다.
- 공개 저장소에는 코드와 EBS 표지 이미지가 포함됩니다. 이미지 출처 링크는 있지만 재배포 허가 여부는 별도 확인 대상입니다.
- 이 파일과 화면 안내는 기능·보안 설명이며 정식 개인정보 처리방침이 아닙니다. 실제 공개 운영 전에는 운영자 식별·연락처와 개인정보 문의·삭제 절차를 확정해야 합니다.

## Firebase 기준 자료

- Firebase API 키는 Firebase 서비스에서 프로젝트 식별용 공개 값이며, 데이터 접근은 Security Rules로 제한해야 합니다: https://firebase.google.com/docs/projects/api-keys
- Firebase Rules는 인증 UID 기반으로 본인 데이터만 허용할 수 있습니다: https://firebase.google.com/docs/firestore/security/rules-conditions
- 한국 지역 코드 `asia-northeast3`는 Seoul입니다: https://firebase.google.com/docs/firestore/locations
