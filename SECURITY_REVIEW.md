# 공개 배포 전 보안·개인정보 검토

검토 범위: 추적 파일과 저장소 커밋, 정적 앱 코드, GitHub Pages workflow, Firebase 클라이언트 설정·Firestore 규칙.

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
- 노트는 `users/{uid}/notes/{noteId}` 아래에만 저장하고, 게시된 규칙은 UID 소유자 외 접근을 거부합니다.
- 허브 프로그램 카드는 현재 브라우저의 `localStorage`에 남습니다. 기존 노트는 사용자가 옮기기 버튼을 선택하고 확인한 경우에만 Firebase로 전송합니다. 실패 시 원본을 지우지 않습니다.
- 로그인 세션은 현재 탭에서만 유지되도록 구성했습니다. 노트는 사용자가 삭제할 때까지 보관되며, 한 건씩 앱에서 삭제할 수 있습니다.
- 브라우저는 Google Fonts와 Firebase SDK의 공식 CDN에 연결됩니다. Firebase 설정이 비어 있으면 Firebase SDK를 불러오거나 노트 요청을 보내지 않습니다.

## 운영 상태와 남은 검토

- Firebase project `mock-exam-study-hub`, 웹 앱, Firestore `asia-northeast3` Standard 인스턴스가 생성되었습니다. Firestore Rules는 Console에서 게시했습니다. 사용자의 명시적 승인으로 Google Provider를 활성화하고 현재 지원 이메일을 공개 OAuth 연락처로 설정했으며, GitHub Pages 도메인을 승인 목록에 추가했습니다.
- GitHub 저장소와 Pages 배포가 완료되었습니다. 코드와 표지 이미지는 공개 저장소와 사이트에서 제공됩니다. 이미지 출처 링크는 있지만 재배포 허가 여부는 별도 확인 대상입니다.
- 이 파일과 화면 안내는 기능·보안 설명이며 정식 개인정보 처리방침이 아닙니다. 실제 공개 운영 전에는 운영자 식별·연락처와 개인정보 문의·삭제 절차를 확정해야 합니다.

## Firebase 기준 자료

- Firebase API 키는 Firebase 서비스에서 프로젝트 식별용 공개 값이며, 데이터 접근은 Security Rules로 제한해야 합니다: https://firebase.google.com/docs/projects/api-keys
- Firebase Rules는 인증 UID 기반으로 본인 데이터만 허용할 수 있습니다: https://firebase.google.com/docs/firestore/security/rules-conditions
- 한국 지역 코드 `asia-northeast3`는 Seoul입니다: https://firebase.google.com/docs/firestore/locations
