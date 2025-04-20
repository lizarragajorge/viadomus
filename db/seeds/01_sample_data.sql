-- Insert sample brokerage
INSERT INTO brokerages (id, name, timezone)
VALUES ('d0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'Houston Premier Realty', 'America/Chicago');

-- Insert sample users
-- Superadmin
INSERT INTO users (id, brokerage_id, role, name, email)
VALUES ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'superadmin', 'Admin User', 'admin@houstonpremier.com');

-- Coordinator
INSERT INTO users (id, brokerage_id, role, name, email)
VALUES ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'coordinator', 'Coordinator User', 'coordinator@houstonpremier.com');

-- Agent
INSERT INTO users (id, brokerage_id, role, name, email)
VALUES ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'agent', 'Agent User', 'agent@houstonpremier.com');

-- Buyer
INSERT INTO users (id, brokerage_id, role, name, email)
VALUES ('d4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a', 'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'buyer', 'Buyer User', 'buyer@example.com');

-- Seller
INSERT INTO users (id, brokerage_id, role, name, email)
VALUES ('e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b', 'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1', 'seller', 'Seller User', 'seller@example.com');

-- Insert sample transaction
INSERT INTO transactions (id, brokerage_id, agent_id, buyer_id, seller_id, status, property_address, closing_date)
VALUES (
  'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
  'd0c98d6c-82f5-4ebd-a38c-a7d7f7f6e9f1',
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
  'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
  'active',
  '123 Main St, Houston, TX 77002',
  CURRENT_DATE + INTERVAL '30 days'
);

-- Insert sample milestones
-- Milestone 1: Contract Acceptance
INSERT INTO milestones (id, transaction_id, name, due_date)
VALUES (
  'a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d',
  'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
  'Contract Acceptance',
  CURRENT_DATE - INTERVAL '5 days'
);

-- Milestone 2: Inspection Period
INSERT INTO milestones (id, transaction_id, name, due_date)
VALUES (
  'b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e',
  'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
  'Inspection Period',
  CURRENT_DATE + INTERVAL '5 days'
);

-- Milestone 3: Closing
INSERT INTO milestones (id, transaction_id, name, due_date)
VALUES (
  'c9d0e1f2-a3b4-2c5d-6e7f-8a9b0c1d2e3f',
  'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
  'Closing',
  CURRENT_DATE + INTERVAL '30 days'
);

-- Insert sample tasks for milestone 1
INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d',
  'Submit contract to title company',
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'done'
);

INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d',
  'Collect earnest money',
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  'done'
);

-- Insert sample tasks for milestone 2
INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e',
  'Schedule home inspection',
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'in_progress'
);

INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e',
  'Review inspection report',
  'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
  'todo'
);

-- Insert sample tasks for milestone 3
INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'c9d0e1f2-a3b4-2c5d-6e7f-8a9b0c1d2e3f',
  'Schedule closing appointment',
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  'todo'
);

INSERT INTO tasks (milestone_id, description, owner_id, status)
VALUES (
  'c9d0e1f2-a3b4-2c5d-6e7f-8a9b0c1d2e3f',
  'Prepare closing documents',
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'todo'
);

-- Insert sample notification
INSERT INTO notifications (user_id, type, payload)
VALUES (
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'email',
  '{"subject": "Task Due Soon", "body": "You have a task due in 2 days: Schedule home inspection"}'
);
