# Creating an admin account

There is no signup form for admins — this is intentional. Every account created through the
site's own "Create account" form is always given the `client` role, and this is enforced twice:
once in the app's own code (`lib/auth-context.tsx`), and again on the server side by
`firestore.rules`, which explicitly blocks a self-registering account from ever setting its own
role to anything but `client`. This means the **only** way to create an admin account is to
manually promote an existing account by hand-editing its record in the Firebase Console.

This is a deliberate security decision, not a missing feature: a self-service "become an admin"
button would be a way for anyone to grant themselves full access to every client's data. Follow
the steps below every time you need to add a new admin (including the very first one).

## Step 1 — Create a normal account first

Whoever needs admin access must first sign up like any other user:

1. Go to the site and click **"تسجيل الدخول" / "Log In"**.
2. Switch to **"إنشاء حساب" / "Create account"**.
3. Fill in their name, phone, email, and password, and submit.

This creates both a Firebase Authentication user and a matching document in Firestore under
`users/{their new uid}`, with `role` set to `client`.

## Step 2 — Find that account in the Firebase Console

1. Open [console.firebase.google.com](https://console.firebase.google.com) and sign in with the
   Google account that owns this project.
2. Select the **Smart Tech** project from the project list.
3. In the left sidebar, click **Build → Firestore Database**.
4. In the list of collections, click **users**.
5. You'll see a list of documents, one per account, each named with a long random ID (this is
   the person's Firebase UID). Click through them and look at the `email` field on the right
   until you find the one that matches the account you want to promote.

**Faster alternative**, if you know their email but the list above is long:

1. In the left sidebar, click **Build → Authentication**.
2. Find their row by email, and copy the value in the **User UID** column.
3. Go back to **Firestore Database → users**, and click directly on the document whose ID
   matches that UID.

## Step 3 — Change their role to admin

1. With that person's `users/{uid}` document open, find the `role` field in the field list.
2. Click on its value (it will say `client`).
3. Change it to exactly `admin` (lowercase, no quotes needed in the value box).
4. Click the checkmark / **Update** to save.

## Step 4 — Verify it worked

- If they're already logged in with the site open in a browser tab, they don't need to log out
  or refresh — the app listens for this change live and will pick it up within a second or two.
- Otherwise, have them log in and go to `/dashboard/admin` — it should load the admin dashboard
  instead of redirecting back to the login page.

## A note on who should have Firebase Console access

Anyone with edit access to this Firebase project's Firestore data can promote any account to
admin this way, so treat Firebase Console access itself as equivalent to admin access on the
site. Keep the list of people with access to the Firebase project (Project Settings → Users and
permissions) as short as possible — ideally just the business owner and their developer.

## Optional: stronger password requirements at the Firebase level

The site itself now requires at least 8 characters with a letter and a number when someone signs
up (checked before the request even reaches Firebase). Firebase/Identity Platform also offers a
project-level **Password Policy** (Console → **Authentication → Settings → Password policy**)
that can enforce a similar rule on Firebase's own side, closing the gap where someone might call
Firebase's sign-up API directly instead of going through the site's form. This is optional and
not enabled by default here — turning it on retroactively can affect existing accounts' next
password change, so review Firebase's own documentation for that setting before enabling it.
