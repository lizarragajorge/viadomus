-- Enable Row Level Security
ALTER TABLE brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create custom claim for user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Set up JWT claim for user role
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT
    coalesce(
      jsonb_build_object(
        'role', public.get_user_role(),
        'brokerage_id', (SELECT brokerage_id::text FROM users WHERE id = auth.uid())
      ),
      '{}'::jsonb
    ) as result
$$;

-- RLS Policies for brokerages

-- Superadmins can do anything
CREATE POLICY "Superadmins can do anything with brokerages"
ON brokerages
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Users can view their own brokerage
CREATE POLICY "Users can view their own brokerage"
ON brokerages
FOR SELECT
TO authenticated
USING (
  id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- RLS Policies for users

-- Superadmins can do anything with users
CREATE POLICY "Superadmins can do anything with users"
ON users
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Coordinators can view and edit users in their brokerage
CREATE POLICY "Coordinators can view and edit users in their brokerage"
ON users
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND brokerage_id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND brokerage_id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- Agents can view users in their brokerage
CREATE POLICY "Agents can view users in their brokerage"
ON users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND brokerage_id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- RLS Policies for transactions

-- Superadmins can do anything with transactions
CREATE POLICY "Superadmins can do anything with transactions"
ON transactions
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Coordinators can do anything with transactions in their brokerage
CREATE POLICY "Coordinators can do anything with transactions in their brokerage"
ON transactions
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND brokerage_id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND brokerage_id = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- Agents can view and edit their own transactions
CREATE POLICY "Agents can view and edit their own transactions"
ON transactions
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND agent_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND agent_id = auth.uid()
);

-- Buyers can view transactions where they are the buyer
CREATE POLICY "Buyers can view transactions where they are the buyer"
ON transactions
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'buyer'
  AND buyer_id = auth.uid()
);

-- Sellers can view transactions where they are the seller
CREATE POLICY "Sellers can view transactions where they are the seller"
ON transactions
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'seller'
  AND seller_id = auth.uid()
);

-- RLS Policies for milestones

-- Superadmins can do anything with milestones
CREATE POLICY "Superadmins can do anything with milestones"
ON milestones
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Coordinators can do anything with milestones in their brokerage
CREATE POLICY "Coordinators can do anything with milestones in their brokerage"
ON milestones
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- Agents can view and edit milestones for their transactions
CREATE POLICY "Agents can view and edit milestones for their transactions"
ON milestones
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND (
    SELECT agent_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND (
    SELECT agent_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = auth.uid()
);

-- Buyers can view milestones for their transactions
CREATE POLICY "Buyers can view milestones for their transactions"
ON milestones
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'buyer'
  AND (
    SELECT buyer_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = auth.uid()
);

-- Sellers can view milestones for their transactions
CREATE POLICY "Sellers can view milestones for their transactions"
ON milestones
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'seller'
  AND (
    SELECT seller_id FROM transactions 
    WHERE transactions.id = milestones.transaction_id
  ) = auth.uid()
);

-- RLS Policies for tasks

-- Superadmins can do anything with tasks
CREATE POLICY "Superadmins can do anything with tasks"
ON tasks
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Coordinators can do anything with tasks in their brokerage
CREATE POLICY "Coordinators can do anything with tasks in their brokerage"
ON tasks
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);

-- Agents can view and edit tasks for their transactions
CREATE POLICY "Agents can view and edit tasks for their transactions"
ON tasks
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND (
    SELECT agent_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'agent'
  AND (
    SELECT agent_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = auth.uid()
);

-- Task owners can update their tasks
CREATE POLICY "Task owners can update their tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
)
WITH CHECK (
  owner_id = auth.uid()
);

-- Buyers can view tasks for their transactions
CREATE POLICY "Buyers can view tasks for their transactions"
ON tasks
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'buyer'
  AND (
    SELECT buyer_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = auth.uid()
);

-- Sellers can view tasks for their transactions
CREATE POLICY "Sellers can view tasks for their transactions"
ON tasks
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'seller'
  AND (
    SELECT seller_id FROM transactions 
    WHERE transactions.id = (
      SELECT transaction_id FROM milestones 
      WHERE milestones.id = tasks.milestone_id
    )
  ) = auth.uid()
);

-- RLS Policies for notifications

-- Users can only view their own notifications
CREATE POLICY "Users can only view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Superadmins can do anything with notifications
CREATE POLICY "Superadmins can do anything with notifications"
ON notifications
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
);

-- Coordinators can create and update notifications for users in their brokerage
CREATE POLICY "Coordinators can create and update notifications for users in their brokerage"
ON notifications
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM users 
    WHERE users.id = notifications.user_id
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'coordinator'
  AND (
    SELECT brokerage_id FROM users 
    WHERE users.id = notifications.user_id
  ) = (SELECT brokerage_id FROM users WHERE id = auth.uid())
);
