
# Plan: Fix Teacher Role Assignment and Password Reset Issues

## Summary

Two critical authentication issues have been identified:

1. **Teacher role assignment failing**: The RLS policy references `auth.users` table in a subquery, but neither `anon` nor `authenticated` roles have SELECT permission on this table
2. **Password reset failing**: The code clears the URL hash before Supabase can process the recovery token, preventing session establishment

---

## Issue 1: Teacher Role Assignment

### Root Cause

The current RLS policy for teacher role insertion includes:

```sql
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'teacher'
  AND EXISTS (
    SELECT 1 FROM teacher_invitations 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())  -- THIS FAILS!
    AND used_at IS NULL
  )
)
```

The subquery `SELECT email FROM auth.users WHERE id = auth.uid()` fails because:
- The `anon` role cannot SELECT from `auth.users`
- The `authenticated` role also cannot SELECT from `auth.users`
- This is a Supabase security restriction

### Solution

Create a new database migration that:

1. Drops the existing teacher role policy
2. Creates a new policy that uses `auth.email()` instead of querying `auth.users`

Supabase provides `auth.email()` function that returns the current user's email from the JWT, which doesn't require table access.

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert own teacher role via invite" ON public.user_roles;

-- Create new policy using auth.email() instead of subquery on auth.users
CREATE POLICY "Users can insert own teacher role via invite"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'teacher'
  AND EXISTS (
    SELECT 1 FROM teacher_invitations 
    WHERE email = auth.email()  -- Use auth.email() instead!
    AND used_at IS NULL
  )
);
```

---

## Issue 2: Password Reset Failing

### Root Cause

The current code in `Auth.tsx` (lines 36-50):

```typescript
useEffect(() => {
  const handlePasswordRecovery = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    
    if (type === "recovery" && accessToken) {
      setMode("update-password");
      // PROBLEM: Clears the hash BEFORE Supabase processes it!
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };
  
  handlePasswordRecovery();
}, []);
```

The issue is that:
1. The code detects the recovery token and clears the URL hash immediately
2. But Supabase's `onAuthStateChange` (in `useAuth.tsx`) needs the hash to establish a session
3. By the time `onAuthStateChange` runs, the hash is gone
4. Result: No session, `updateUser` fails with "Auth session missing!"

### Solution

Modify `Auth.tsx` to:

1. NOT manually clear the hash - let Supabase handle it
2. Wait for the session to be established via `onAuthStateChange`
3. Check for an active session before showing the password update form
4. Only proceed with password update if session exists

```typescript
// Handle password recovery token from URL hash
useEffect(() => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const type = hashParams.get("type");
  
  if (type === "recovery" && accessToken) {
    setMode("update-password");
    // DON'T clear the hash - let Supabase's onAuthStateChange process it
    // Supabase will automatically establish a session from the recovery token
  }
}, []);

// In handlePasswordUpdate, verify session exists
const handlePasswordUpdate = async () => {
  if (!validateForm()) return;
  
  // Verify we have an active session (established from recovery token)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast({ 
      title: "Sessionsfel", 
      description: "Ingen aktiv session. Begär en ny återställningslänk.",
      variant: "destructive" 
    });
    setMode("reset");
    return;
  }
  
  setIsLoading(true);
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    // ... rest of the code
  }
};
```

---

## Files to Change

| File | Change |
|------|--------|
| **Database Migration** | Update RLS policy to use `auth.email()` instead of `auth.users` subquery |
| `src/pages/Auth.tsx` | Fix password recovery flow - don't clear hash, verify session |

---

## Manual Action Required

After deployment, fix the existing users who failed to get teacher roles:

```sql
-- Assign teacher role to users with valid invitations but no role
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT u.id, 'teacher'::app_role
FROM auth.users u
JOIN teacher_invitations ti ON ti.email = u.email::text
WHERE ti.used_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- Mark their invitations as used
UPDATE teacher_invitations ti
SET used_at = NOW()
FROM auth.users u
WHERE ti.email = u.email::text
AND ti.used_at IS NULL
AND EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'teacher'
);
```

---

## Technical Details

### Why `auth.email()` works but querying `auth.users` doesn't

- `auth.uid()` and `auth.email()` are JWT-based functions that extract values directly from the authentication token
- They don't require database table access
- The `auth.users` table has restricted access as a security measure
- Using `auth.email()` is the Supabase-recommended pattern for RLS policies

### Password Recovery Token Flow

When a user clicks the password reset link:
1. Supabase redirects to `https://www.notera.info/auth?mode=update-password#access_token=xxx&type=recovery`
2. The Supabase client's `onAuthStateChange` listener detects the token in the hash
3. It automatically exchanges the token for a session
4. The session is then available for `updateUser` to change the password

By NOT clearing the hash prematurely, we allow this automatic flow to complete.
