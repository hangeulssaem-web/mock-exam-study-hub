import {
  addNote,
  firebaseConfigured,
  firebaseGoogleSignInEnabled,
  firebaseReady,
  firebaseSdkUnavailable,
  loadNotes,
  migrateLocalNotes,
  removeNote,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth
} from "./firebase-client.js";

const PROJECTS_KEY = "mock-exam-hub:projects";
const NOTES_KEY = "mock-exam-hub:notes";

const starterProjects = [
  {
    id: "mock-notes",
    name: "모의고사 노트",
    description: "틀린 문제와 핵심 개념을 남기고, 다시 볼 날짜를 정해요.",
    status: "사용 중",
    href: "organizer",
    category: "학습 기록"
  }
];

const projectGrid = document.querySelector("#projectGrid");
const projectForm = document.querySelector("#projectForm");
const noteForm = document.querySelector("#noteForm");
const noteList = document.querySelector("#noteList");
let currentRoute = "hub";
let currentUser = null;
let notes = [];
let authGeneration = 0;
let toastTimer;
let storageWarningShown = false;

function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isProjectRecord(value) {
  return isPlainRecord(value) &&
    ["id", "name", "description", "category", "status"].every(key => typeof value[key] === "string") &&
    (value.href === "" || value.href === "organizer" || isHttpUrl(value.href));
}

function isNoteRecord(value) {
  return isPlainRecord(value) &&
    ["id", "examLabel", "examDate", "subject", "kind", "title", "body", "reviewDate", "createdAt"].every(key => typeof value[key] === "string");
}

function warnMalformedStorage() {
  if (storageWarningShown) return;
  storageWarningShown = true;
  showToast("일부 저장 항목을 읽을 수 없어 건너뛰었어요. 저장 원본은 그대로 두었습니다.");
}

function readItems(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      warnMalformedStorage();
      return fallback;
    }
    const isValid = key === PROJECTS_KEY ? isProjectRecord : isNoteRecord;
    const valid = parsed.filter(isValid);
    if (valid.length !== parsed.length) warnMalformedStorage();
    return valid;
  } catch {
    warnMalformedStorage();
    return fallback;
  }
}

function saveItems(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("저장 공간을 사용할 수 없어요. 브라우저 저장 설정을 확인해 주세요.");
    return false;
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2800);
}

function createIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", name === "edit" ? "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" : "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v7m6-7v7");
  svg.append(path);
  return svg;
}

function appendText(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function safeProjectUrl(project) {
  if (project.href === "organizer") return "#organizer";
  if (isHttpUrl(project.href)) return project.href;
  return "#";
}

function makeProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";

  const top = document.createElement("div");
  top.className = "project-top";
  appendText(top, "span", "project-category", project.category || "학습 도구");
  const status = appendText(top, "span", "project-status", project.status || "아이디어");
  status.dataset.status = project.status || "아이디어";
  card.append(top);

  appendText(card, "h3", "project-title", project.name || "이름 없는 프로그램");
  appendText(card, "p", "project-description", project.description || "소개를 추가해 주세요.");

  const actions = document.createElement("div");
  actions.className = "project-actions";
  const open = document.createElement("a");
  open.className = "project-open";
  const destination = safeProjectUrl(project);
  open.href = destination;
  open.textContent = project.href === "organizer" ? "노트 열기 ↗" : "프로그램 열기 ↗";
  if (/^https?:\/\//i.test(destination)) {
    open.target = "_blank";
    open.rel = "noreferrer";
  }
  if (destination === "#") {
    open.setAttribute("aria-disabled", "true");
    open.addEventListener("click", event => event.preventDefault());
  }
  actions.append(open);

  const edit = document.createElement("button");
  edit.className = "project-action";
  edit.type = "button";
  edit.setAttribute("aria-label", `${project.name || "프로그램"} 수정`);
  edit.append(createIcon("edit"));
  edit.addEventListener("click", () => openProjectEditor(project));
  actions.append(edit);

  const remove = document.createElement("button");
  remove.className = "project-action";
  remove.type = "button";
  remove.setAttribute("aria-label", `${project.name || "프로그램"} 삭제`);
  remove.append(createIcon("delete"));
  remove.addEventListener("click", () => deleteProject(project.id));
  actions.append(remove);

  card.append(actions);
  return card;
}

function renderHub() {
  const projects = readItems(PROJECTS_KEY, starterProjects);
  projectGrid.replaceChildren();
  if (!projects.length) {
    const empty = appendText(projectGrid, "div", "empty-projects", "아직 등록한 프로그램이 없어요. 첫 도구부터 추가해 보세요.");
    empty.setAttribute("role", "status");
    return;
  }
  projects.forEach(project => projectGrid.append(makeProjectCard(project)));
}

function resetProjectForm() {
  projectForm.reset();
  document.querySelector("#projectId").value = "";
  document.querySelector("#projectCategory").value = "학습 도구";
  document.querySelector("#projectFormTitle").textContent = "프로그램 등록";
}

function revealProjectForm() {
  projectForm.hidden = false;
  document.querySelector("#projectName").focus();
  projectForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function openProjectEditor(project) {
  document.querySelector("#projectFormTitle").textContent = "프로그램 수정";
  document.querySelector("#projectId").value = project.id;
  document.querySelector("#projectName").value = project.name || "";
  document.querySelector("#projectCategory").value = project.category || "학습 도구";
  document.querySelector("#projectDescription").value = project.description || "";
  document.querySelector("#projectStatus").value = project.status || "아이디어";
  document.querySelector("#projectHref").value = project.href === "organizer" ? "" : project.href || "";
  revealProjectForm();
}

function deleteProject(id) {
  const projects = readItems(PROJECTS_KEY, starterProjects);
  const project = projects.find(item => item.id === id);
  if (!project || !window.confirm(`“${project.name}” 프로그램을 목록에서 삭제할까요?`)) return;
  const updated = projects.filter(item => item.id !== id);
  if (saveItems(PROJECTS_KEY, updated)) {
    renderHub();
    document.querySelector("#addProjectButton").focus();
    showToast("프로그램을 삭제했어요.");
  }
}

function saveProject(event) {
  event.preventDefault();
  const projects = readItems(PROJECTS_KEY, starterProjects);
  const id = document.querySelector("#projectId").value;
  const nameInput = document.querySelector("#projectName");
  const descriptionInput = document.querySelector("#projectDescription");
  const linkInput = document.querySelector("#projectHref");
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const href = document.querySelector("#projectHref").value.trim();
  if (!name) {
    showToast("프로그램 이름을 입력해 주세요.");
    nameInput.focus();
    return;
  }
  if (!description) {
    showToast("프로그램 소개를 입력해 주세요.");
    descriptionInput.focus();
    return;
  }
  if (href && !isHttpUrl(href)) {
    showToast("프로그램 주소는 http:// 또는 https:// 주소를 입력해 주세요.");
    linkInput.focus();
    return;
  }
  const project = {
    id: id || crypto.randomUUID(),
    name,
    description,
    category: document.querySelector("#projectCategory").value.trim() || "학습 도구",
    status: document.querySelector("#projectStatus").value,
    href: id && projects.find(item => item.id === id)?.href === "organizer" && !href ? "organizer" : href ? new URL(href).href : ""
  };
  const updated = id ? projects.map(item => item.id === id ? project : item) : [...projects, project];
  if (!saveItems(PROJECTS_KEY, updated)) return;
  renderHub();
  resetProjectForm();
  closeProjectForm();
  showToast(id ? "프로그램 정보를 수정했어요." : "프로그램을 추가했어요.");
}

function closeProjectForm() {
  projectForm.hidden = true;
  document.querySelector("#addProjectButton").focus();
}

function formatDate(value) {
  if (!value) return "날짜 미정";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function createNoteCard(note) {
  const card = document.createElement("article");
  card.className = "note-card";
  const meta = document.createElement("div");
  meta.className = "note-meta";
  const kind = appendText(meta, "span", "note-tag", note.kind || "학습 메모");
  kind.dataset.kind = note.kind || "학습 메모";
  appendText(meta, "span", "", note.subject || "기타");
  appendText(meta, "span", "", "·");
  appendText(meta, "span", "", note.examLabel || "모의고사");
  appendText(meta, "span", "", "·");
  appendText(meta, "time", "", formatDate(note.examDate));
  card.append(meta);

  appendText(card, "h3", "note-title", note.title || "제목 없음");
  appendText(card, "p", "note-body", note.body || "");

  const footer = document.createElement("div");
  footer.className = "note-footer";
  if (note.reviewDate) appendText(footer, "span", "review-date", `다시 보기 · ${formatDate(note.reviewDate)}`);
  else appendText(footer, "span", "", "복습일 미정");
  const remove = appendText(footer, "button", "delete-note", "삭제");
  remove.type = "button";
  remove.setAttribute("aria-label", `기록 “${note.title || "제목 없음"}” 삭제`);
  remove.addEventListener("click", () => deleteNote(note.id));
  card.append(footer);
  return card;
}

function renderNotes() {
  const query = document.querySelector("#noteSearch").value.trim().toLocaleLowerCase("ko-KR");
  const subject = document.querySelector("#subjectFilter").value;
  const filtered = notes.filter(note => {
    const searchable = [note.title, note.body, note.examLabel, note.kind, note.subject].join(" ").toLocaleLowerCase("ko-KR");
    return (!query || searchable.includes(query)) && (!subject || note.subject === subject);
  }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  document.querySelector("#noteCount").textContent = String(notes.length).padStart(2, "0");
  document.querySelector("#visibleCount").textContent = `${filtered.length}개 기록`;
  noteList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-notes";
    appendText(empty, "strong", "", notes.length ? "검색 결과가 없어요." : "첫 기록을 기다리고 있어요.");
    appendText(empty, "span", "", notes.length ? "검색어나 과목을 바꿔 다시 찾아보세요." : "왼쪽 폼에서 기억하고 싶은 내용을 적어보세요.");
    noteList.append(empty);
    return;
  }
  filtered.forEach(note => noteList.append(createNoteCard(note)));
}

async function saveNote(event) {
  event.preventDefault();
  if (!currentUser) {
    showToast("기록을 저장하려면 먼저 Google로 로그인해 주세요.");
    document.querySelector("#signInButton").focus();
    return;
  }
  const examLabelInput = document.querySelector("#examLabel");
  const titleInput = document.querySelector("#noteTitle");
  const bodyInput = document.querySelector("#noteBody");
  const examLabel = examLabelInput.value.trim();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!examLabel) {
    showToast("모의고사 이름을 입력해 주세요.");
    examLabelInput.focus();
    return;
  }
  if (!title) {
    showToast("기록 제목을 입력해 주세요.");
    titleInput.focus();
    return;
  }
  if (!body) {
    showToast("기록 내용을 입력해 주세요.");
    bodyInput.focus();
    return;
  }
  const note = {
    examLabel,
    examDate: document.querySelector("#examDate").value,
    subject: document.querySelector("#noteSubject").value,
    kind: document.querySelector("#noteKind").value,
    title,
    body,
    reviewDate: document.querySelector("#reviewDate").value
  };
  const userId = currentUser.uid;
  try {
    await addNote(userId, note);
    const loadedNotes = await loadNotes(userId);
    if (currentUser?.uid !== userId) return;
    notes = loadedNotes;
    noteForm.reset();
    renderNotes();
    showToast("Firebase에 기록을 저장했어요.");
    document.querySelector("#examLabel").focus();
  } catch (error) {
    console.error("Unable to save study note", error);
    showToast("기록을 저장하지 못했어요. 연결 상태와 Firebase 설정을 확인해 주세요.");
  }
}

async function deleteNote(id) {
  const note = notes.find(item => item.id === id);
  if (!note || !currentUser || !window.confirm(`“${note.title}” 기록을 Firebase에서 삭제할까요?`)) return;
  const userId = currentUser.uid;
  try {
    await removeNote(userId, id);
    if (currentUser?.uid !== userId) return;
    notes = notes.filter(item => item.id !== id);
    renderNotes();
    document.querySelector("#noteSearch").focus();
    showToast("기록을 삭제했어요.");
  } catch (error) {
    console.error("Unable to delete study note", error);
    showToast("기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

function updateAuthUI(user) {
  currentUser = user;
  const signInButton = document.querySelector("#signInButton");
  const signOutButton = document.querySelector("#signOutButton");
  const authUser = document.querySelector("#authUser");
  const authNotice = document.querySelector("#authNotice");
  signInButton.disabled = !firebaseReady || Boolean(user);
  signOutButton.hidden = !user;
  authUser.hidden = !user;
  authUser.textContent = user?.displayName || "Google 계정으로 로그인됨";
  if (!firebaseReady) {
    authNotice.textContent = firebaseConfigured && firebaseSdkUnavailable
      ? "Firebase SDK를 불러오지 못했어요. 네트워크 연결과 브라우저의 외부 스크립트 차단 설정을 확인해 주세요."
      : firebaseConfigured && !firebaseGoogleSignInEnabled
        ? "Google 로그인은 Firebase Console에서 지원 이메일을 설정하고 로그인 제공자를 켠 뒤 활성화됩니다."
        : "Firebase 설정이 아직 연결되지 않았어요. README의 Firebase 연결 안내를 완료하면 Google 로그인이 활성화됩니다.";
  } else if (!user) {
    authNotice.textContent = "Google 로그인 후 기록이 Firebase에 저장돼요. 본인 계정의 기록만 볼 수 있습니다. 아래 저장·개인정보 안내를 확인해 주세요.";
  } else {
    authNotice.textContent = `${user.displayName || "Google 계정"}으로 로그인했어요. 모의고사 기록은 Firebase에 저장됩니다.`;
  }
  noteForm.querySelectorAll("input, select, textarea, button").forEach(control => {
    control.disabled = !user;
  });
  renderMigrationButton();
}

function renderMigrationButton() {
  const button = document.querySelector("#migrateNotesButton");
  if (!button) return;
  const localNotes = readItems(NOTES_KEY, []);
  const migrationKey = currentUser ? `mock-exam-hub:migrated:${currentUser.uid}` : "";
  let alreadyMigrated = false;
  try {
    alreadyMigrated = migrationKey && localStorage.getItem(migrationKey) === "1";
  } catch {
    button.hidden = true;
    return;
  }
  button.hidden = !currentUser || localNotes.length === 0 || Boolean(alreadyMigrated);
  if (!button.hidden) button.textContent = `기존 기록 ${localNotes.length}개를 내 계정으로 옮기기`;
}

function readMigrationSource() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw === null) return { notes: [], sourceComplete: true };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { notes: [], sourceComplete: false };
    const valid = parsed.filter(isNoteRecord);
    return { notes: valid, sourceComplete: valid.length === parsed.length };
  } catch {
    return { notes: [], sourceComplete: false };
  }
}

async function migrateNotesToAccount() {
  if (!currentUser) return;
  const migrationUid = currentUser.uid;
  const { notes: localNotes, sourceComplete } = readMigrationSource();
  if (!localNotes.length) {
    renderMigrationButton();
    return;
  }
  const approved = window.confirm(
    `이 브라우저의 기록 ${localNotes.length}개를 ${currentUser.displayName || "현재 로그인 계정"}의 Firebase로 전송할까요? ` +
    "취소하면 브라우저에 남고, 전송에 실패해도 원본은 지우지 않습니다."
  );
  if (!approved) return;

  const button = document.querySelector("#migrateNotesButton");
  const signOutButton = document.querySelector("#signOutButton");
  button.disabled = true;
  signOutButton.disabled = true;
  try {
    const result = await migrateLocalNotes(migrationUid, localNotes);
    if (currentUser?.uid !== migrationUid) {
      showToast("전송은 완료됐지만 로그인 계정이 바뀌어 브라우저 원본은 그대로 남겨뒀어요.");
      return;
    }
    const loadedNotes = await loadNotes(migrationUid);
    if (currentUser?.uid !== migrationUid) {
      showToast("전송은 완료됐지만 로그인 계정이 바뀌어 브라우저 원본은 그대로 남겨뒀어요.");
      return;
    }
    const sourceCanBeRemoved = sourceComplete && result.skippedCount === 0;
    if (sourceCanBeRemoved) localStorage.removeItem(NOTES_KEY);
    notes = loadedNotes;
    renderNotes();
    renderMigrationButton();
    const skippedCount = result.skippedCount + (sourceComplete ? 0 : 1);
    const skipped = sourceCanBeRemoved
      ? " 기존 브라우저 기록은 전송을 마쳐 삭제했어요."
      : ` 이전할 수 없는 기존 데이터가 있어 브라우저 원본을 보존했어요. (${skippedCount}개 이상 확인 필요)`;
    showToast(`${result.importedCount}개 기록을 옮겼어요.${skipped}`);
  } catch (error) {
    console.error("Unable to migrate local study notes", error);
    showToast("기록 이전이 완료되지 않았어요. 원본 기록은 브라우저에 그대로 남아 있습니다.");
  } finally {
    button.disabled = false;
    signOutButton.disabled = false;
  }
}

async function handleAuthChange(user) {
  const generation = ++authGeneration;
  updateAuthUI(user);
  notes = [];
  renderNotes();
  if (!user) return;
  try {
    const loadedNotes = await loadNotes(user.uid);
    if (generation !== authGeneration) return;
    notes = loadedNotes;
    renderNotes();
  } catch (error) {
    console.error("Unable to load study notes", error);
    if (generation === authGeneration) {
      document.querySelector("#authNotice").textContent = "기록을 불러오지 못했어요. Firebase 설정과 연결 상태를 확인해 주세요.";
      showToast("기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }
}

function describeAuthError(error) {
  if (error?.code === "auth/popup-closed-by-user") return "로그인 창이 닫혔어요.";
  if (error?.code === "auth/unauthorized-domain") return "이 Pages 도메인이 Firebase 인증 허용 도메인에 등록되지 않았어요.";
  if (error?.code === "auth/popup-blocked") return "브라우저에서 로그인 팝업을 허용해 주세요.";
  return "Google 로그인에 실패했어요. Firebase 인증 설정을 확인해 주세요.";
}

function route() {
  const hash = window.location.hash;
  if (hash === "#organizer") currentRoute = "organizer";
  else if (hash === "" || hash === "#hub") currentRoute = "hub";
  const organizer = currentRoute === "organizer";
  document.querySelector("#hubView").hidden = organizer;
  document.querySelector("#organizerView").hidden = !organizer;
  document.querySelectorAll("[data-nav]").forEach(link => {
    if ((link.dataset.nav === "organizer") === organizer) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (organizer) renderNotes();
  else renderHub();
  document.title = organizer ? "모의고사 노트 · MOCKNOTE" : "모의고사 준비 허브 · MOCKNOTE";
}

function init() {
  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    const main = document.querySelector("#main");
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#addProjectButton").addEventListener("click", () => {
    resetProjectForm();
    revealProjectForm();
  });
  document.querySelector("#closeProjectForm").addEventListener("click", closeProjectForm);
  document.querySelector("#cancelProjectForm").addEventListener("click", closeProjectForm);
  projectForm.addEventListener("submit", saveProject);
  noteForm.addEventListener("submit", saveNote);
  document.querySelector("#signInButton").addEventListener("click", async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Unable to sign in with Google", error);
      showToast(describeAuthError(error));
    }
  });
  document.querySelector("#signOutButton").addEventListener("click", async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Unable to sign out", error);
      showToast("로그아웃하지 못했어요. 다시 시도해 주세요.");
    }
  });
  document.querySelector("#migrateNotesButton").addEventListener("click", migrateNotesToAccount);
  document.querySelector("#noteSearch").addEventListener("input", renderNotes);
  document.querySelector("#subjectFilter").addEventListener("change", renderNotes);
  window.addEventListener("hashchange", route);
  updateAuthUI(null);
  subscribeToAuth(handleAuthChange);
  route();
}

init();
