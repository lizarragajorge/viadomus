-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('superadmin', 'coordinator', 'agent', 'buyer', 'seller');
CREATE TYPE transaction_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');

-- Create brokerages table
CREATE TABLE brokerages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brokerage_id UUID REFERENCES brokerages(id),
  role user_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_brokerage
    FOREIGN KEY (brokerage_id)
    REFERENCES brokerages(id)
    ON DELETE CASCADE
);

-- Create index on brokerage_id
CREATE INDEX idx_users_brokerage_id ON users(brokerage_id);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brokerage_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  buyer_id UUID,
  seller_id UUID,
  status transaction_status NOT NULL DEFAULT 'draft',
  property_address TEXT,
  closing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_brokerage
    FOREIGN KEY (brokerage_id)
    REFERENCES brokerages(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_agent
    FOREIGN KEY (agent_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_buyer
    FOREIGN KEY (buyer_id)
    REFERENCES users(id)
    ON DELETE SET NULL,
    
  CONSTRAINT fk_seller
    FOREIGN KEY (seller_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- Create indexes on transaction foreign keys
CREATE INDEX idx_transactions_brokerage_id ON transactions(brokerage_id);
CREATE INDEX idx_transactions_agent_id ON transactions(agent_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);

-- Create milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_transaction
    FOREIGN KEY (transaction_id)
    REFERENCES transactions(id)
    ON DELETE CASCADE
);

-- Create indexes on milestone foreign keys and due date
CREATE INDEX idx_milestones_transaction_id ON milestones(transaction_id);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL,
  description TEXT NOT NULL,
  owner_id UUID,
  status task_status NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_milestone
    FOREIGN KEY (milestone_id)
    REFERENCES milestones(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- Create indexes on task foreign keys
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index on notification user_id
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
