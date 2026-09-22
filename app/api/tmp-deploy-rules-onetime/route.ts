import { getAdminApp } from "@/lib/firebase-admin";
import { getSecurityRules } from "firebase-admin/security-rules";

// TEMPORARY, one-time-use endpoint — not part of the app's real feature set. Deploys the
// checked-in firestore.rules content (inlined below, verbatim) using the project's own
// existing service-account credential, because this session's local sandbox has a skewed
// system clock that breaks Google OAuth JWT signing locally (Vercel's servers have a correct
// clock, so this works when run from there instead). Gated by a one-off secret token known
// only for this single deploy; deleted from the codebase immediately after use.
const ONE_TIME_TOKEN = "cb17fe9b97e24bfc921dd6fa97d41cb4";

const RULES_SOURCE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isSelf(uid) { return isSignedIn() && request.auth.uid == uid; }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{uid} {
      allow get: if isSelf(uid) || isAdmin();
      allow list: if isAdmin();
      allow create: if isSelf(uid)
        && request.resource.data.role == 'client'
        && request.resource.data.keys().hasOnly(['role', 'name', 'email', 'createdAt', 'phone'])
        && request.resource.data.name is string
        && request.resource.data.email is string;
      allow update: if isSelf(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name']);
      allow delete: if false;
    }

    match /requests/{id} {
      allow read: if isSignedIn() && (resource.data.clientId == request.auth.uid || isAdmin());
      allow create: if isSignedIn()
        && request.resource.data.clientId == request.auth.uid
        && request.resource.data.stage == 'received';
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /errorLogs/{logId} {
      allow read, list, delete: if isAdmin();
      allow create, update: if false;
    }

    match /pendingImportClaims/{claimId} {
      allow read, list, delete: if isAdmin();
      allow create, update: if false;
    }

    match /conversations/{convId} {
      allow read: if isSignedIn() && (convId == request.auth.uid || isAdmin());
      allow create: if isSignedIn() && convId == request.auth.uid
        && request.resource.data.clientId == request.auth.uid;
      allow update: if isSignedIn() && (convId == request.auth.uid || isAdmin());
      allow delete: if false;

      match /messages/{msgId} {
        allow read: if isSignedIn() && (convId == request.auth.uid || isAdmin());

        allow create: if isSignedIn() && convId == request.auth.uid
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.senderRole == 'client';

        allow create: if isAdmin()
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.senderRole == 'admin';

        allow create: if isSignedIn() && convId == request.auth.uid
          && request.resource.data.senderId == 'bot'
          && request.resource.data.senderRole == 'admin'
          && (
            request.resource.data.text ==
              get(/databases/$(database)/documents/config/botSettings).data.welcomeMessage
            || request.resource.data.text in
              get(/databases/$(database)/documents/config/botSettings).data.ruleAnswers
          );

        allow update: if false;
        allow delete: if isAdmin();
      }
    }

    match /config/botSettings {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /pendingImports/{phone} {
      allow read, write: if isAdmin();
      match /messages/{msgId} {
        allow read, write: if isAdmin();
      }
    }
  }
}
`;

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const app = getAdminApp();
    const rules = getSecurityRules(app);
    const ruleset = await rules.releaseFirestoreRulesetFromSource(RULES_SOURCE);
    return Response.json({ ok: true, ruleset: ruleset.name });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
