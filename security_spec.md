# Security Specification for Sổ Tay Họp Vui Vẻ

## 1. Data Invariants
1. **Accounts Collection (`/accounts/{accountId}`)**:
   - Accounts can only have role 'admin' or 'user'.
   - The initial admin account has username `admin`.
   - Passwords must be salted hashes.
   - Account ID must match username for deterministic lookups.

2. **User Data Sessions (`/user_data/{username}/sessions/{sessionId}`)**:
   - Each account has its own isolated repository.
   - Sessions must include gameName, ownerUsername, and valid gameStateJson.
   - Session data must not be empty or corrupted.

3. **Meeting Keys (`/meeting_keys/{meetingKey}`)**:
   - Keys must be uppercase alphanumeric strings (e.g. `HOP-1234` or `HOP1234`), 4 to 30 characters.
   - Anyone holding the key can look up the meeting session to resume it on their device.
   - Meeting key documents store gameStateJson and update timestamp.

## 2. The Dirty Dozen Payloads
1. **Payload 1 (Privilege Escalation on Account Creation)**: Attempting to create an unauthorized account with arbitrary role without going through admin auth.
2. **Payload 2 (ID Poisoning on Account)**: Attempting to pass 10KB string as accountId.
3. **Payload 3 (Cross-Account Session Overwrite)**: Attempting to write into `/user_data/victim/sessions/s1` with ownerUsername 'attacker'.
4. **Payload 4 (Ghost Field Injection)**: Injecting arbitrary extra fields like `__isSuperAdmin: true` into an account document.
5. **Payload 5 (Malformed Meeting Key)**: Creating a meeting key with script tags or path traversal `../../badKey`.
6. **Payload 6 (Oversized Game State)**: Injecting 20MB invalid payload into gameStateJson.
7. **Payload 7 (Empty Game Name)**: Creating a session with empty string `""` for gameName.
8. **Payload 8 (Negative Rounds)**: Updating session with negative rounds `rounds: -5`.
9. **Payload 9 (Account Deletion of Root Admin)**: Attempting to delete `accounts/admin` system document.
10. **Payload 10 (Password Cleartext Leak)**: Writing cleartext password instead of hash.
11. **Payload 11 (Key Tampering)**: Modifying a meeting key doc to change meetingKey field itself.
12. **Payload 12 (Blanket Read Attack)**: Attempting to scrape other users' private session documents.

## 3. Test Runner Invariant
All operations outside of legitimate access must return PERMISSION_DENIED or fail validation.
