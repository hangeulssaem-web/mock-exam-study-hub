# GitHub Pages and Firebase Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Prepare the mock-exam hub for a new public GitHub Pages repository and move private study notes to per-user Firebase storage with Google sign-in.

**Architecture:** GitHub Actions publishes the existing `dist/` site without a framework build. The browser app uses Firebase JavaScript SDK 13.2.0, Firebase Authentication, and Firestore at `users/{uid}/notes/{noteId}`; strict Security Rules enforce UID ownership and note schema. The approved Firestore Standard region is Seoul (`asia-northeast3`). User account provisioning and cloud deployment are completed after the user signs in.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Firebase JS SDK 13.2.0 CDN, Firebase Authentication, Cloud Firestore Standard, GitHub Actions Pages deployment.

**Spec:** `docs/superpowers/specs/2026-11-07-github-pages-firebase-mock-exam-design.md`

## Global Constraints

- Do not include passwords, service-account keys, or private OAuth secrets in files, commits, or chat.
- Firebase web config is public client configuration; data security is enforced by Firestore Rules.
- Users only read or write `users/{theirUid}/notes/{noteId}`.
- Existing local notes are never uploaded without an explicit in-app migration action.
- Keep project-card metadata in localStorage; move mock-exam notes to Firestore.
- Do not add or run a test suite unless the user asks; perform static syntax/config checks.

## Review Focus

- Unauthenticated visitors must see no cloud notes and cannot create, modify, or delete them — inspect all sign-out transitions and default states.
- One user must not read or modify another user's note path — review owner matching on every operation.
- Invalid/oversized fields and ownership-shaped extra fields must be rejected on both create and update — review the domain validator and allowed-key set.
- Local notes must remain intact if migration is skipped or any write fails — review migration sequencing.
- Firebase config placeholders must keep the app usable enough to explain setup without silently falling back to local storage — inspect the unconfigured state.

---

### Task 1: Static Pages deployment and Firebase configuration shell

**Files:**
- Create: `.github/workflows/pages.yml`
- Create: `dist/.nojekyll`
- Create: `firebase.json`
- Create: `firestore.indexes.json`
- Create: `firestore.rules`
- Create: `dist/firebase-config.js`
- Modify: `README.md`
- Modify: `dist/index.html`

**Interfaces:**
- `dist/firebase-config.js` exports `firebaseConfig` with the four public Web app fields and an `isFirebaseConfigured` boolean.
- Pages workflow deploys the repository's `dist/` folder on pushes to `main` and manual dispatch.

- [ ] Create a Pages workflow with least-privilege permissions and official deployment actions pinned to immutable commit SHAs.
- [ ] Add Firebase project config placeholder and default-deny rules/index config.
- [ ] Add Google sign-in controls and a clear cloud-storage privacy notice; do not display account email.
- [ ] Document Firebase Console setup, API key referrer restrictions, and GitHub Pages authorized-domain steps.
- [ ] Verify workflow YAML/JSON structure and `git diff --check`.

### Task 2: Firebase authentication and per-user note persistence

**Files:**
- Create: `dist/firebase-client.js`
- Modify: `dist/app.js`
- Modify: `dist/index.html`
- Modify: `dist/styles.css`

**Interfaces:**
- `firebase-client.js` exports `auth`, `db`, `signInWithGoogle()`, `signOutUser()`, `subscribeToAuth(callback)`, and note CRUD/migration functions.
- `app.js` renders notes only for a signed-in Firebase user and never uses localStorage as a silent fallback.

- [ ] Initialize Firebase only if all required public config fields are set.
- [ ] Add popup Google sign-in, sign-out, and Korean user-facing auth errors/status.
- [ ] Load, create, and delete notes under the authenticated UID only; keep search/filter behavior.
- [ ] Offer explicit one-time migration from the prior localStorage key; remove local source only after every cloud write succeeds.
- [ ] Review auth state changes, duplicate migration safety, malformed local data, and disconnected/error states.
- [ ] Verify ES module syntax and references with `node --check` / static inspection.

### Task 3: Firestore rules and final security review

**Files:**
- Modify: `firestore.rules`
- Modify: `README.md`

**Interfaces:**
- Rules allow create/read/update/delete only for authenticated owner UID path and validated note records.

- [ ] Define strict required/allowed fields, type/size limits, subject/kind allowlists, timestamp validation, and immutable `createdAt`.
- [ ] Apply the same domain validation function to create and update.
- [ ] Review unauthenticated, cross-user, oversized, malformed, extra-field, ownership, and update-bypass attacks manually.
- [ ] Mark rules as a prototype requiring project-side syntax validation and owner review before broad use.

### Task 4: Account provisioning and publishing handoff

**External systems:** GitHub, Firebase Console.

- [ ] After the user signs in, create a new public GitHub repository named `mock-exam-study-hub` and push the reviewed source.
- [ ] Create the Firebase project and Web app; set approved Firestore region (recommended `asia-northeast3`, Seoul), enable Google provider, set Pages host as authorized domain, and deploy Security Rules.
- [ ] Add the public Web config values, verify the config contains no private credentials, and push the matching Pages version.
- [ ] Verify GitHub Pages is active and Google sign-in is configured for the exact Pages host.
- [ ] Report the public repository and Pages URLs, Firebase setup state, security review, and any remaining verification limits.
