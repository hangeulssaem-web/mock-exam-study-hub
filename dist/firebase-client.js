import { firebaseConfig, googleSignInEnabled, isFirebaseConfigured } from "./firebase-config.js";

const firebaseVersion = "13.2.0";

let auth = null;
let db = null;
let authApi = null;
let firestoreApi = null;
let firebaseSdkLoadError = false;

if (isFirebaseConfigured) {
  try {
    const [appApi, loadedAuthApi, loadedFirestoreApi] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`)
    ]);
    const app = appApi.initializeApp(firebaseConfig);
    auth = loadedAuthApi.getAuth(app);
    db = loadedFirestoreApi.getFirestore(app);
    authApi = loadedAuthApi;
    firestoreApi = loadedFirestoreApi;
  } catch (error) {
    firebaseSdkLoadError = true;
    console.error("Unable to initialize Firebase SDK", error);
  }
}

export const firebaseReady = Boolean(auth && db && googleSignInEnabled);
export const firebaseConfigured = isFirebaseConfigured;
export const firebaseGoogleSignInEnabled = googleSignInEnabled;
export const firebaseSdkUnavailable = firebaseSdkLoadError;

export function signInWithGoogle() {
  if (!auth) throw new Error("Firebase 설정을 먼저 완료해 주세요.");
  const provider = new authApi.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return authApi.setPersistence(auth, authApi.browserSessionPersistence)
    .then(() => authApi.signInWithPopup(auth, provider));
}

export function signOutUser() {
  if (!auth) return Promise.resolve();
  return authApi.signOut(auth);
}

export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return authApi.onAuthStateChanged(auth, callback);
}

function userNotes(uid) {
  if (!db || !uid) throw new Error("로그인한 사용자 정보가 필요해요.");
  return firestoreApi.collection(db, "users", uid, "notes");
}

function noteFromSnapshot(snapshot) {
  const data = snapshot.data();
  const createdAt = data.createdAt?.toDate?.();
  return {
    ...data,
    id: snapshot.id,
    createdAt: createdAt ? createdAt.toISOString() : ""
  };
}

export async function loadNotes(uid) {
  const notesQuery = firestoreApi.query(
    userNotes(uid),
    firestoreApi.orderBy("createdAt", "desc"),
    firestoreApi.limit(500)
  );
  const snapshot = await firestoreApi.getDocs(notesQuery);
  return snapshot.docs.map(noteFromSnapshot);
}

export async function addNote(uid, note) {
  const now = firestoreApi.serverTimestamp();
  await firestoreApi.addDoc(userNotes(uid), {
    examLabel: note.examLabel,
    examDate: note.examDate,
    subject: note.subject,
    kind: note.kind,
    title: note.title,
    body: note.body,
    reviewDate: note.reviewDate,
    createdAt: now,
    updatedAt: now
  });
}

export function removeNote(uid, noteId) {
  return firestoreApi.deleteDoc(firestoreApi.doc(db, "users", uid, "notes", noteId));
}

function isValidLocalNote(note) {
  return note && typeof note === "object" && !Array.isArray(note) &&
    typeof note.id === "string" && note.id.length > 0 && note.id.length <= 128 &&
    typeof note.examLabel === "string" && note.examLabel.trim().length > 0 && note.examLabel.length <= 60 &&
    typeof note.examDate === "string" && (note.examDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(note.examDate)) &&
    ["국어", "수학", "영어", "한국사", "탐구", "기타"].includes(note.subject) &&
    ["오답", "핵심 개념", "질문", "학습 메모"].includes(note.kind) &&
    typeof note.title === "string" && note.title.trim().length > 0 && note.title.length <= 80 &&
    typeof note.body === "string" && note.body.trim().length > 0 && note.body.length <= 1400 &&
    typeof note.reviewDate === "string" && (note.reviewDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(note.reviewDate));
}

export async function migrateLocalNotes(uid, notes) {
  const validNotes = notes.filter(isValidLocalNote);
  const invalidCount = notes.length - validNotes.length;
  const collection = userNotes(uid);
  for (let offset = 0; offset < validNotes.length; offset += 300) {
    const batch = firestoreApi.writeBatch(db);
    const chunk = validNotes.slice(offset, offset + 300);
    for (const note of chunk) {
      const ref = firestoreApi.doc(collection, note.id);
      const parsedDate = new Date(note.createdAt);
      const safeCreatedAt = Number.isNaN(parsedDate.getTime())
        ? Date.now()
        : Math.min(parsedDate.getTime(), Date.now());
      const createdAt = firestoreApi.Timestamp.fromDate(new Date(safeCreatedAt));
      batch.set(ref, {
        examLabel: note.examLabel.trim(),
        examDate: note.examDate,
        subject: note.subject,
        kind: note.kind,
        title: note.title.trim(),
        body: note.body.trim(),
        reviewDate: note.reviewDate,
        createdAt,
        updatedAt: firestoreApi.serverTimestamp()
      });
    }
    await batch.commit();
  }
  return { importedCount: validNotes.length, skippedCount: invalidCount };
}
