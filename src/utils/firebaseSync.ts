import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type {
  AppLanguage,
  CloudUserProfile,
  HomeWidgetConfig,
  Playlist,
  ThemePrefs,
  Track,
} from '../types/music';
import { getTranslations } from './i18n';
import { normalizeLayout } from './layoutManager';
import { DEFAULT_THEME_PREFS } from './storage';
import { sanitizeFullLengthTracks } from './youtubeAndOembed';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface CloudSyncState {
  playlists: Playlist[];
  favoriteIds: string[];
  themePrefs: ThemePrefs;
  homeLayout: HomeWidgetConfig[];
  savedTracks: Track[];
}

interface ResolvedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export const DEFAULT_FIREBASE_CONFIG: ResolvedFirebaseConfig = {
  apiKey: 'AIzaSyCFU6YRhTCVyzJJXzcDF14IFKhRs8eemT0',
  authDomain: 'muzikapptone-c6971.firebaseapp.com',
  projectId: 'muzikapptone-c6971',
  storageBucket: 'muzikapptone-c6971.firebasestorage.app',
  messagingSenderId: '49571646885',
  appId: '1:49571646885:web:e044ff2b4ec431fae0494c',
  firestoreDatabaseId: '(default)',
};

function isPlaceholderValue(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  const upper = trimmed.toUpperCase();
  return (
    upper.startsWith('MY_') ||
    upper.startsWith('YOUR_') ||
    upper.startsWith('<') ||
    upper === 'UNDEFINED' ||
    upper === 'NULL' ||
    trimmed === 'remixed-project-id'
  );
}

function readProcessEnv(name: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
      const val = process.env[name]!.trim();
      if (!isPlaceholderValue(val)) {
        return val;
      }
    }
  } catch {
    // Ignore when process is unavailable
  }
  return '';
}

function pickEnvValue(metaVal: unknown, processNames: string[], fallback: string): string {
  if (typeof metaVal === 'string') {
    const trimmed = metaVal.trim();
    if (!isPlaceholderValue(trimmed)) {
      return trimmed;
    }
  }
  for (const name of processNames) {
    const procVal = readProcessEnv(name);
    if (procVal) {
      return procVal;
    }
  }
  return fallback;
}

export interface FirebaseEnvOverrides {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_FIRESTORE_DATABASE_ID?: string;
}

export function resolveFirebaseConfig(
  overrides?: FirebaseEnvOverrides
): ResolvedFirebaseConfig {
  let metaApiKey: unknown;
  let metaAuthDomain: unknown;
  let metaProjectId: unknown;
  let metaStorageBucket: unknown;
  let metaMessagingSenderId: unknown;
  let metaAppId: unknown;
  let metaFirestoreDatabaseId: unknown;

  try {
    const envObj = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    if (envObj) {
      metaApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      metaAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
      metaProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      metaStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
      metaMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
      metaAppId = import.meta.env.VITE_FIREBASE_APP_ID;
      metaFirestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
    }
  } catch {
    // Fallback cleanly in Node test runner
  }

  const apiKey = pickEnvValue(
    overrides?.VITE_FIREBASE_API_KEY ?? metaApiKey,
    ['VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY'],
    DEFAULT_FIREBASE_CONFIG.apiKey
  );
  const authDomain = pickEnvValue(
    overrides?.VITE_FIREBASE_AUTH_DOMAIN ?? metaAuthDomain,
    ['VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'],
    DEFAULT_FIREBASE_CONFIG.authDomain
  );
  const projectId = pickEnvValue(
    overrides?.VITE_FIREBASE_PROJECT_ID ?? metaProjectId,
    ['VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'],
    DEFAULT_FIREBASE_CONFIG.projectId
  );
  const storageBucket = pickEnvValue(
    overrides?.VITE_FIREBASE_STORAGE_BUCKET ?? metaStorageBucket,
    ['VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'],
    DEFAULT_FIREBASE_CONFIG.storageBucket || ''
  );
  const messagingSenderId = pickEnvValue(
    overrides?.VITE_FIREBASE_MESSAGING_SENDER_ID ?? metaMessagingSenderId,
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'],
    DEFAULT_FIREBASE_CONFIG.messagingSenderId || ''
  );
  const appId = pickEnvValue(
    overrides?.VITE_FIREBASE_APP_ID ?? metaAppId,
    ['VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID'],
    DEFAULT_FIREBASE_CONFIG.appId
  );
  const firestoreDatabaseId = pickEnvValue(
    overrides?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ?? metaFirestoreDatabaseId,
    ['VITE_FIREBASE_FIRESTORE_DATABASE_ID', 'FIREBASE_FIRESTORE_DATABASE_ID'],
    DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId || '(default)'
  );

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId,
  };
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let connectionValidated = false;

function initFirebaseServices(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (firebaseApp && firebaseAuth && firestoreDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firestoreDb };
  }

  const cfg = resolveFirebaseConfig();

  try {
    firebaseApp = getApps().length > 0 ? getApps()[0]! : initializeApp(cfg);
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp, cfg.firestoreDatabaseId || '(default)');

    if (!connectionValidated) {
      connectionValidated = true;
      void validateFirestoreConnection(firestoreDb);
    }

    return { app: firebaseApp, auth: firebaseAuth, db: firestoreDb };
  } catch {
    return null;
  }
}

async function validateFirestoreConnection(db: Firestore): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Wait briefly for experimentalAutoDetectLongPolling fallback in cross-origin iframes and retry once
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return;
      }
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch {
        // Continue quietly in local Guest Mode if network/iframe blocks Firestore streaming
      }
    }
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = firebaseAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isFirebaseConfigured(): boolean {
  return resolveFirebaseConfig() !== null;
}

/**
 * Strips undefined keys and enforces rule boundary limits so Firestore writes
 * always satisfy hardened security rules.
 */
export function sanitizeCloudSyncPayload(state: CloudSyncState): CloudSyncState {
  const cleanPlaylists: Playlist[] = state.playlists.slice(0, 50).map((pl) => {
    const item: Playlist = {
      id: String(pl.id || 'pl-default').slice(0, 128),
      name: String(pl.name || 'Playlist').slice(0, 120),
      description: String(pl.description || '').slice(0, 300),
      trackIds: Array.isArray(pl.trackIds)
        ? pl.trackIds.map((id) => String(id).slice(0, 128)).slice(0, 200)
        : [],
      createdAt: Number.isFinite(pl.createdAt) ? pl.createdAt : Date.now(),
    };
    if (pl.coverUrl) item.coverUrl = String(pl.coverUrl).slice(0, 1000);
    if (typeof pl.isSystem === 'boolean') item.isSystem = pl.isSystem;
    return item;
  });

  const cleanFavoriteIds = Array.from(new Set(state.favoriteIds))
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    .map((id) => id.slice(0, 128))
    .slice(0, 200);

  const cleanThemePrefs: ThemePrefs = {
    accentColor: state.themePrefs?.accentColor || DEFAULT_THEME_PREFS.accentColor,
    glassIntensity: Math.min(
      100,
      Math.max(0, Number(state.themePrefs?.glassIntensity ?? DEFAULT_THEME_PREFS.glassIntensity))
    ),
    ambientGlowEnabled: Boolean(
      state.themePrefs?.ambientGlowEnabled ?? DEFAULT_THEME_PREFS.ambientGlowEnabled
    ),
    ambientGlowIntensity: Math.min(
      100,
      Math.max(
        0,
        Number(state.themePrefs?.ambientGlowIntensity ?? DEFAULT_THEME_PREFS.ambientGlowIntensity)
      )
    ),
    layoutDensity: state.themePrefs?.layoutDensity || DEFAULT_THEME_PREFS.layoutDensity,
    playerBarStyle: state.themePrefs?.playerBarStyle || DEFAULT_THEME_PREFS.playerBarStyle,
  };

  const cleanHomeLayout = normalizeLayout(state.homeLayout)
    .slice(0, 10)
    .map((w) => ({
      id: w.id,
      label: String(w.label).slice(0, 80),
      description: String(w.description).slice(0, 240),
      visible: Boolean(w.visible),
    }));

  const cleanSavedTracks: Track[] = state.savedTracks
    .filter((t) => t.source !== 'local')
    .slice(0, 150)
    .map((t) => {
      const item: Track = {
        id: String(t.id).slice(0, 128),
        title: String(t.title || 'Unknown').slice(0, 200),
        artist: String(t.artist || 'Unknown').slice(0, 200),
        album: String(t.album || 'Single').slice(0, 200),
        duration: Number.isFinite(t.duration) ? Math.max(0, Math.round(t.duration)) : 215,
        source: t.source,
        addedAt: Number.isFinite(t.addedAt) ? t.addedAt : Date.now(),
      };
      if (t.coverUrl) item.coverUrl = String(t.coverUrl).slice(0, 1000);
      if (t.youtubeVideoId) item.youtubeVideoId = String(t.youtubeVideoId).slice(0, 64);
      if (t.externalUrl) item.externalUrl = String(t.externalUrl).slice(0, 500);
      if (t.importProvider) item.importProvider = t.importProvider;
      if (t.synthPreset) item.synthPreset = t.synthPreset;
      if (t.previewNote) item.previewNote = String(t.previewNote).slice(0, 120);
      return item;
    });

  return {
    playlists: cleanPlaylists,
    favoriteIds: cleanFavoriteIds,
    themePrefs: cleanThemePrefs,
    homeLayout: cleanHomeLayout,
    savedTracks: cleanSavedTracks,
  };
}

export function validateEmailPasswordInput(
  email: string,
  password: string,
  mode: 'signin' | 'signup',
  lang: AppLanguage = 'tr'
): string | null {
  const t = getTranslations(lang);
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return t.authValidationEmptyEmail;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return t.authValidationInvalidEmail;
  }
  if (!password) {
    return t.authValidationEmptyPassword;
  }
  if (mode === 'signup' && password.length < 6) {
    return t.authValidationWeakPassword;
  }
  return null;
}

export function mapFirebaseAuthError(error: unknown, lang: AppLanguage = 'tr'): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const msg = error instanceof Error ? error.message : String(error || '');
  const hay = `${code} ${msg}`.toLowerCase();

  if (lang === 'tr') {
    if (
      hay.includes('auth/wrong-password') ||
      hay.includes('auth/invalid-credential') ||
      hay.includes('auth/invalid-login-credentials')
    ) {
      return 'Hatalı e-posta adresi veya şifre. Lütfen bilgilerinizi kontrol edin.';
    }
    if (hay.includes('auth/user-not-found')) {
      return 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.';
    }
    if (hay.includes('auth/invalid-email')) {
      return 'Geçersiz e-posta adresi. Lütfen doğru formatta bir e-posta girin.';
    }
    if (hay.includes('auth/weak-password')) {
      return 'Şifre çok zayıf. En az 6 karakter kullanın.';
    }
    if (hay.includes('auth/email-already-in-use')) {
      return 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
    }
    if (hay.includes('auth/too-many-requests')) {
      return 'Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
    }
    if (hay.includes('auth/user-disabled')) {
      return 'Bu hesap devre dışı bırakılmış.';
    }
    if (hay.includes('auth/operation-not-allowed')) {
      return 'Bu giriş yöntemi henüz Firebase Console üzerinden etkinleştirilmemiş (Authentication → Sign-in method).';
    }
    if (hay.includes('auth/unauthorized-domain')) {
      return 'Bu alan adı Firebase Authentication ayarlarında yetkilendirilmemiş (Yetkili alan adlarına ekleyin).';
    }
    if (hay.includes('requests-from-referer')) {
      return 'Bu alan adı (HTTP referrer) Firebase API anahtarı kısıtlamaları tarafından engellendi. Google Cloud Console üzerinden izin verin.';
    }
    if (hay.includes('auth/invalid-api-key') || hay.includes('auth/api-key-not-valid')) {
      return 'Firebase API anahtarı geçersiz. Lütfen proje yapılandırmasını kontrol edin.';
    }
    if (hay.includes('auth/account-exists-with-different-credential')) {
      return 'Bu e-posta adresi farklı bir giriş yöntemiyle zaten kayıtlı.';
    }
    if (hay.includes('auth/requires-recent-login')) {
      return 'Güvenlik nedeniyle bu işlem için yeniden giriş yapmanız gerekiyor.';
    }
    if (hay.includes('auth/popup-closed-by-user')) {
      return 'Google giriş penceresi kapatıldı.';
    }
    if (hay.includes('auth/cancelled-popup-request')) {
      return 'Önceki giriş penceresi iptal edildi. Lütfen tekrar deneyin.';
    }
    if (hay.includes('auth/popup-blocked')) {
      return 'Açılır pencere tarayıcı tarafından engellendi. Lütfen açılır pencerelere izin verin.';
    }
    if (hay.includes('auth/network-request-failed')) {
      return 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
    }
    if (hay.includes('permission-denied') || hay.includes('insufficient permissions')) {
      return 'Yetki hatası: Firebase güvenlik kuralları bu işleme izin vermiyor.';
    }
    return 'Kimlik doğrulama tamamlanamadı. Lütfen tekrar deneyin.';
  }

  if (
    hay.includes('auth/wrong-password') ||
    hay.includes('auth/invalid-credential') ||
    hay.includes('auth/invalid-login-credentials')
  ) {
    return 'Incorrect email or password. Please check your credentials.';
  }
  if (hay.includes('auth/user-not-found')) {
    return 'No account found with this email address.';
  }
  if (hay.includes('auth/invalid-email')) {
    return 'Invalid email address format.';
  }
  if (hay.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (hay.includes('auth/email-already-in-use')) {
    return 'This email address is already in use. Try signing in instead.';
  }
  if (hay.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a moment and try again.';
  }
  if (hay.includes('auth/user-disabled')) {
    return 'This account has been disabled.';
  }
  if (hay.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled in Firebase Console yet.';
  }
  if (hay.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized in Firebase Authentication settings.';
  }
  if (hay.includes('requests-from-referer')) {
    return 'This domain (HTTP referrer) is blocked by Firebase API key restrictions.';
  }
  if (hay.includes('auth/invalid-api-key') || hay.includes('auth/api-key-not-valid')) {
    return 'Invalid Firebase API key. Please check your project configuration.';
  }
  if (hay.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with the same email using a different sign-in method.';
  }
  if (hay.includes('auth/requires-recent-login')) {
    return 'Please sign in again before completing this action.';
  }
  if (hay.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed.';
  }
  if (hay.includes('auth/cancelled-popup-request')) {
    return 'Popup request was cancelled. Please try again.';
  }
  if (hay.includes('auth/popup-blocked')) {
    return 'Popup was blocked by your browser. Please allow popups and try again.';
  }
  if (hay.includes('auth/network-request-failed')) {
    return 'Network error. Check your internet connection.';
  }
  if (hay.includes('permission-denied') || hay.includes('insufficient permissions')) {
    return 'Permission denied by Firebase security rules.';
  }
  return 'Authentication failed. Please try again.';
}

export function mapFirestoreError(error: unknown, lang: AppLanguage = 'tr'): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const msg = error instanceof Error ? error.message : String(error || '');
  const hay = `${code} ${msg}`.toLowerCase();

  if (lang === 'tr') {
    if (hay.includes('permission-denied') || hay.includes('insufficient permissions')) {
      return 'Firestore erişim izni reddedildi. Lütfen Firestore güvenlik kurallarının (users/{uid}) oturum açmış kullanıcıya izin verdiğinden emin olun.';
    }
    if (hay.includes('unauthenticated')) {
      return 'Firestore işlemi için oturum doğrulaması gerekiyor. Lütfen yeniden giriş yapın.';
    }
    if (hay.includes('not-found')) {
      return 'Firestore "(default)" veritabanı bulunamadı. Firebase Console üzerinden veritabanının oluşturulduğunu kontrol edin.';
    }
    if (hay.includes('unavailable') || hay.includes('client is offline')) {
      return 'Firestore veritabanına şu anda ulaşılamıyor. İnternet bağlantınızı kontrol edin.';
    }
    if (hay.includes('resource-exhausted') || hay.includes('quota')) {
      return 'Firebase kullanım kotası aşıldı. Lütfen daha sonra tekrar deneyin.';
    }
    return 'Bulut eşitleme sırasında bir Firestore hatası oluştu. Veriler cihazınızda güvende.';
  }

  if (hay.includes('permission-denied') || hay.includes('insufficient permissions')) {
    return 'Firestore permission denied. Check that security rules allow signed-in users to access users/{uid}.';
  }
  if (hay.includes('unauthenticated')) {
    return 'Authentication required for Firestore access. Please sign in again.';
  }
  if (hay.includes('not-found')) {
    return 'Firestore "(default)" database was not found. Make sure it exists in Firebase Console.';
  }
  if (hay.includes('unavailable') || hay.includes('client is offline')) {
    return 'Firestore is currently unavailable. Check your internet connection.';
  }
  if (hay.includes('resource-exhausted') || hay.includes('quota')) {
    return 'Firebase usage quota exceeded. Please try again later.';
  }
  return 'A Firestore error occurred during cloud sync. Local data remains saved on this device.';
}

export function subscribeToAuthState(
  onUserChange: (user: CloudUserProfile | null) => void
): () => void {
  const services = initFirebaseServices();
  if (!services) {
    onUserChange(null);
    return () => {};
  }

  return onAuthStateChanged(services.auth, (user) => {
    if (!user) {
      onUserChange(null);
      return;
    }
    onUserChange({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    });
  });
}

export async function signInWithGoogle(): Promise<CloudUserProfile> {
  const services = initFirebaseServices();
  if (!services) {
    throw new Error('Firebase configuration missing.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(services.auth, provider);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
    emailVerified: cred.user.emailVerified,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<CloudUserProfile> {
  const services = initFirebaseServices();
  if (!services) {
    throw new Error('Firebase configuration missing.');
  }

  const cred = await signInWithEmailAndPassword(services.auth, email.trim(), password);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
    emailVerified: cred.user.emailVerified,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<CloudUserProfile> {
  const services = initFirebaseServices();
  if (!services) {
    throw new Error('Firebase configuration missing.');
  }

  const cred = await createUserWithEmailAndPassword(services.auth, email.trim(), password);
  const trimmedName = (displayName || '').trim();
  if (trimmedName) {
    try {
      await updateProfile(cred.user, { displayName: trimmedName.slice(0, 60) });
    } catch {
      // Non-fatal if profile displayName update fails
    }
  }
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // Non-fatal if verification email fails to dispatch immediately
  }
  return {
    uid: cred.user.uid,
    displayName: trimmedName || cred.user.displayName,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
    emailVerified: cred.user.emailVerified,
  };
}

export async function resendVerificationEmail(): Promise<void> {
  const services = initFirebaseServices();
  if (!services?.auth.currentUser) return;
  await sendEmailVerification(services.auth.currentUser);
}

export async function refreshCurrentUser(): Promise<CloudUserProfile | null> {
  const services = initFirebaseServices();
  const user = services?.auth.currentUser;
  if (!user) return null;
  await reload(user);
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export async function signOutFromCloud(): Promise<void> {
  const services = initFirebaseServices();
  if (!services) return;
  await signOut(services.auth);
}

export function subscribeToUserCloudSync(
  uid: string,
  onRemoteState: (state: CloudSyncState) => void,
  onEmptyRemote: () => void,
  onError?: (error: unknown) => void
): () => void {
  const services = initFirebaseServices();
  if (!services || !uid) return () => {};

  const path = `users/${uid}`;
  const docRef = doc(services.db, 'users', uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onEmptyRemote();
        return;
      }
      const data = snapshot.data();
      if (!data) return;

      const rawFavorites = Array.isArray(data.favoriteIds)
        ? data.favoriteIds
        : Array.isArray(data.favorites)
          ? data.favorites
          : [];

      const parsed: CloudSyncState = {
        playlists: Array.isArray(data.playlists) ? (data.playlists as Playlist[]) : [],
        favoriteIds: rawFavorites as string[],
        themePrefs:
          data.themePrefs && typeof data.themePrefs === 'object'
            ? { ...DEFAULT_THEME_PREFS, ...(data.themePrefs as Partial<ThemePrefs>) }
            : { ...DEFAULT_THEME_PREFS },
        homeLayout: normalizeLayout(data.homeLayout),
        savedTracks: Array.isArray(data.savedTracks)
          ? sanitizeFullLengthTracks(data.savedTracks as Track[])
          : [],
      };
      onRemoteState(parsed);
    },
    (error) => {
      onError?.(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Logged via handleFirestoreError; surfaced to UI via onError callback
      }
    }
  );
}

export async function saveUserCloudSync(
  uid: string,
  state: CloudSyncState,
  onError?: (error: unknown) => void
): Promise<void> {
  const services = initFirebaseServices();
  if (!services || !uid) return;

  const path = `users/${uid}`;
  const docRef = doc(services.db, 'users', uid);
  const clean = sanitizeCloudSyncPayload(state);

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ownerId: uid,
        playlists: clean.playlists,
        favoriteIds: clean.favoriteIds,
        themePrefs: clean.themePrefs,
        homeLayout: clean.homeLayout,
        savedTracks: clean.savedTracks,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = existingSnap.data();
      await setDoc(docRef, {
        ownerId: uid,
        playlists: clean.playlists,
        favoriteIds: clean.favoriteIds,
        themePrefs: clean.themePrefs,
        homeLayout: clean.homeLayout,
        savedTracks: clean.savedTracks,
        createdAt: existingData?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    onError?.(error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged via handleFirestoreError; surfaced to UI via onError callback
    }
  }
}
