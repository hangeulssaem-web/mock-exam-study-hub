# 고3 모의고사 준비 허브 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 브라우저에서 동작하는 고3 모의고사 준비 허브와 첫 정보 정리 앱을 만들고 공개 주소로 배포해 교사의 별자리에 등록한다.

**Architecture:** 빌드 도구 없는 정적 HTML/CSS/JavaScript 앱을 `dist/`에 둔다. 허브 프로젝트 목록과 모의고사 기록은 각각 `localStorage`에 저장하고, 한 페이지 안에서 허브와 도구 화면을 전환한다. Sites 정적 호스팅으로 공개하고, 등록 안내의 검증 스크립트를 실행한다.

**Tech Stack:** HTML, CSS, JavaScript, browser `localStorage`, Sites static hosting.

**Spec:** `docs/superpowers/specs/2026-11-07-mock-exam-hub-design.md`

## Global Constraints

- 서버와 로그인을 추가하지 않는다.
- 첫 앱은 날짜/회차, 과목, 유형, 제목, 내용, 복습일을 저장한다.
- 공개 허브 등록에는 공개 HTTPS 배포 주소와 허용된 JSON 필드만 사용한다.
- 개인 정보, 학교 정보, 학생 정보, 연락처, 비밀값은 등록하지 않는다.
- 실제 2027학년도 수능특강 표지 이미지를 대표 표지로 넣고 EBS 공식 교재 페이지에 연결한다.
- 사용자 요청 없이 별도 테스트 코드를 추가하거나 테스트 명령을 실행하지 않는다.

## Review Focus

- 모바일 폭에서 허브와 기록 폼이 넘치지 않는지 — 브라우저 미리보기에서 확인.
- 검색/과목 필터 결과가 빈 데이터와 한글 입력에서 정상 동작하는지 — 브라우저에서 조작 확인.
- 저장 내용이 새로고침 후 유지되고 삭제 후 사라지는지 — 브라우저에서 조작 확인.
- 공개 등록 URL이 인증·쿼리·해시·별도 포트 없는 HTTPS인지 — 등록 전 URL 형식 점검.
- 표지 이미지가 배포 환경에서 열리는지 — 배포 전후 브라우저 확인.

---

### Task 1: 정적 앱 화면과 허브 프로그램 목록

**Files:**
- Create: `dist/index.html`
- Create: `dist/styles.css`
- Create: `dist/app.js`
- Create: `dist/assets/` (EBS 공식 페이지에서 확인한 표지 이미지)

**Interfaces:**
- Produces: `app.js` exports or defines `renderHub()`, `renderOrganizer()`, and one `init()` entry point.
- Hub records use `{ id, name, description, status, href, category }`.

- [ ] 시맨틱 HTML로 허브 탐색, 콘텐츠 영역, 프로그램 추가 폼을 작성한다.
- [ ] 반응형 CSS에 수능특강 표지를 히어로 배경/이미지로 배치하고 가독성 있는 카드 레이아웃을 만든다.
- [ ] 허브 앱 카드 생성, 편집, 삭제를 구현하고 기본 카드로 첫 정보 정리 앱을 제공한다.
- [ ] 프로그램 목록은 `mock-exam-hub:projects` 키로 localStorage에 JSON 저장한다.
- [ ] 화면 너비와 폼 입력 길이를 브라우저에서 점검한다.

### Task 2: 모의고사 정보 정리 앱

**Files:**
- Modify: `dist/app.js`
- Modify: `dist/index.html`
- Modify: `dist/styles.css`

**Interfaces:**
- Consumes: Task 1 `init()` and view shell.
- Record shape: `{ id, examDate, subject, kind, title, body, reviewDate, createdAt }`.
- Storage key: `mock-exam-hub:notes`.

- [ ] 기록 작성 폼에 날짜/회차, 과목, 기록 유형, 제목, 내용, 복습일 필드를 둔다.
- [ ] 저장된 기록을 날짜 순으로 렌더하고 제목/내용 검색과 과목 필터를 연결한다.
- [ ] 각 기록 삭제와 확인 피드백을 제공한다.
- [ ] 새로고침 후에도 저장 내용이 남는지, 삭제가 유지되는지 브라우저에서 조작 확인한다.
- [ ] 모바일 화면과 키보드 포커스/레이블을 확인한다.

### Task 3: 공개 Sites 배포와 등록

**Files:**
- Create or Modify: `.openai/hosting.json`
- Create: `README.md`

**Interfaces:**
- Consumes: completed static `dist/` site.
- Produces: verified public HTTPS URL and registration receipt/tracking link.

- [ ] Sites 프로젝트를 한 번만 생성하고 반환된 `project_id`를 hosting manifest에 그대로 기록한다.
- [ ] Sites 소스 워크플로우에서 정확한 소스를 연결 저장소에 반영하고 정적 사이트를 패키징한다.
- [ ] 사이트를 공개 URL로 배포한다. (교사의 별자리 등록 안내가 비공개나 로컬 URL을 허용하지 않는다.)
- [ ] 배포 성공 URL과 공개 접근 상태를 확인한다.
- [ ] 등록 스크립트와 유효성 검사 코드를 프로젝트 외부 임시 경로에 내려받아 검토한다.
- [ ] 공개 이름·소개·URL·분류·문양만 담은 JSON으로 접수 API를 실행한다.
- [ ] 종료 코드와 마지막 `state: queued`/접수 확인을 검토해 접수 번호와 tracking 링크를 보고한다.
