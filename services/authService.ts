import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface UserAccount {
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  isActive: boolean;
  passwordHash?: string;
  salt?: string;
}

const AUTH_STORAGE_KEY = 'meeting-app-auth-session';

// SHA-256 + Salt hashing using standard Web Crypto API
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':' + salt + ':sotayhop_secret_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random salt
export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// Default admin credentials requested by user
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'Huyhuyhuy2@';
const DEFAULT_ADMIN_SALT = 'admin_salt_sotayhop_2026';

// Bootstrap default admin in Firestore if not present
export async function ensureDefaultAdminExists(): Promise<void> {
  const path = `accounts/${DEFAULT_ADMIN_USERNAME}`;
  try {
    const adminDocRef = doc(db, 'accounts', DEFAULT_ADMIN_USERNAME);
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_SALT);
      const adminData = {
        username: DEFAULT_ADMIN_USERNAME,
        displayName: 'Quản Trị Viên',
        role: 'admin',
        salt: DEFAULT_ADMIN_SALT,
        passwordHash,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      await setDoc(adminDocRef, adminData);
      console.log('Default admin account initialized.');
    }
  } catch (err) {
    console.warn('Could not check default admin (offline or rules):', err);
  }
}

// Login with username & password (strictly admin or sub-accounts created by admin)
export async function loginUser(usernameInput: string, passwordInput: string): Promise<UserAccount> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  if (!cleanUsername || !passwordInput) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
  }

  // Ensure default admin exists first
  if (cleanUsername === DEFAULT_ADMIN_USERNAME) {
    await ensureDefaultAdminExists();
  }

  const path = `accounts/${cleanUsername}`;
  let snap;
  try {
    snap = await getDoc(doc(db, 'accounts', cleanUsername));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    throw err;
  }

  if (!snap || !snap.exists()) {
    // If it's admin and local check succeeds as fallback
    if (cleanUsername === DEFAULT_ADMIN_USERNAME && passwordInput === DEFAULT_ADMIN_PASSWORD) {
      const adminUser: UserAccount = {
        username: DEFAULT_ADMIN_USERNAME,
        displayName: 'Quản Trị Viên',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      saveLocalSession(adminUser);
      return adminUser;
    }
    throw new Error('Tài khoản không tồn tại. Vui lòng liên hệ Admin để cấp tài khoản.');
  }

  const data = snap.data();
  if (!data.isActive) {
    throw new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.');
  }

  const salt = data.salt || 'default_salt';
  const computedHash = await hashPassword(passwordInput, salt);

  if (computedHash !== data.passwordHash) {
    // Check fallback for default admin if hash wasn't synced yet
    if (cleanUsername === DEFAULT_ADMIN_USERNAME && passwordInput === DEFAULT_ADMIN_PASSWORD) {
      const adminUser: UserAccount = {
        username: data.username,
        displayName: data.displayName || 'Quản Trị Viên',
        role: 'admin',
        createdAt: data.createdAt,
        isActive: true,
      };
      saveLocalSession(adminUser);
      return adminUser;
    }
    throw new Error('Mật khẩu không chính xác.');
  }

  const user: UserAccount = {
    username: data.username,
    displayName: data.displayName || data.username,
    role: data.role === 'admin' ? 'admin' : 'user',
    createdAt: data.createdAt,
    isActive: data.isActive,
  };

  saveLocalSession(user);
  return user;
}

// Session persistence
export function saveLocalSession(user: UserAccount): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function getStoredSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

// Admin only: List all accounts
export async function getAllAccounts(): Promise<UserAccount[]> {
  const path = 'accounts';
  try {
    await ensureDefaultAdminExists();
    const querySnap = await getDocs(collection(db, 'accounts'));
    const list: UserAccount[] = [];
    querySnap.forEach(d => {
      const data = d.data();
      list.push({
        username: data.username,
        displayName: data.displayName || data.username,
        role: data.role === 'admin' ? 'admin' : 'user',
        createdAt: data.createdAt,
        isActive: data.isActive,
      });
    });

    if (list.length === 0) {
      list.push({
        username: DEFAULT_ADMIN_USERNAME,
        displayName: 'Quản Trị Viên',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      });
    }

    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Admin only: Create new sub-account
export async function createSubAccount(
  username: string,
  password: string,
  displayName: string,
  role: 'admin' | 'user' = 'user'
): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự (chữ và số).');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    throw new Error('Tên đăng nhập chỉ được chứa chữ cái, số, gạch ngang hoặc gạch dưới.');
  }
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const path = `accounts/${cleanUsername}`;
  const existingDoc = await getDoc(doc(db, 'accounts', cleanUsername));
  if (existingDoc.exists()) {
    throw new Error(`Tài khoản "${cleanUsername}" đã tồn tại trên hệ thống.`);
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newAccount = {
    username: cleanUsername,
    displayName: displayName.trim() || cleanUsername,
    role,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  try {
    await setDoc(doc(db, 'accounts', cleanUsername), newAccount);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Admin only: Toggle active/block account
export async function toggleAccountStatus(username: string, currentStatus: boolean): Promise<void> {
  if (username === DEFAULT_ADMIN_USERNAME) {
    throw new Error('Không thể khóa tài khoản Admin mặc định.');
  }
  const path = `accounts/${username}`;
  try {
    const accountRef = doc(db, 'accounts', username);
    const snap = await getDoc(accountRef);
    if (!snap.exists()) throw new Error('Tài khoản không tồn tại.');
    await setDoc(accountRef, { ...snap.data(), isActive: !currentStatus });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Admin only: Reset password for account
export async function resetAccountPassword(username: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải từ 6 ký tự trở lên.');
  }
  const path = `accounts/${username}`;
  try {
    const accountRef = doc(db, 'accounts', username);
    const snap = await getDoc(accountRef);
    if (!snap.exists()) throw new Error('Tài khoản không tồn tại.');
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    await setDoc(accountRef, { ...snap.data(), salt, passwordHash });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Admin only: Delete account
export async function deleteAccount(username: string): Promise<void> {
  if (username === DEFAULT_ADMIN_USERNAME) {
    throw new Error('Không thể xóa tài khoản Admin mặc định.');
  }
  const path = `accounts/${username}`;
  try {
    await deleteDoc(doc(db, 'accounts', username));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
