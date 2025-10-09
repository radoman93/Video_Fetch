-- =====================================================
-- Fix RLS Policies for Admin Access
-- Migration: 20250103000001_fix_admin_rls.sql
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can delete user roles" ON user_roles;

-- Allow users to view their own role (needed for auth middleware)
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Allow admins to insert roles
CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Update the is_user_admin function to be more efficient
CREATE OR REPLACE FUNCTION is_user_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
