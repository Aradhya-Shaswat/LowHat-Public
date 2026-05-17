import { pgTable, text, timestamp, pgEnum, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').default('client'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(()=> users.id)
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(()=> users.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt")
});

export const teamRoleEnum = pgEnum('team_role', ['owner', 'manager', 'member']);
export const unitStateEnum = pgEnum('unit_state', ['active', 'frozen', 'under_review', 'suspended', 'dissolved']);
export const joinRequestStatusEnum = pgEnum('join_request_status', ['pending', 'approved', 'rejected', 'withdrawn', 'expired']);
export const removalRequestStatusEnum = pgEnum('removal_request_status', ['pending', 'approved', 'rejected', 'cooling', 'completed']);
export const voteEnum = pgEnum('vote_enum', ['approve', 'reject']);
export const transferResourceTypeEnum = pgEnum('transfer_resource_type', ['repo', 'cloud_cred', 'billing', 'env', 'contract']);

export const jobStatusEnum = pgEnum('job_status', ['open', 'bidding', 'in_progress', 'completed', 'cancelled', 'disputed']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'accepted', 'rejected', 'withdrawn']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'paused', 'completed', 'cancelled']);
export const notificationTypeEnum = pgEnum('notification_type', ['message', 'bid', 'job', 'project', 'system', 'unit_governance']);
export const verificationTargetTypeEnum = pgEnum('verification_target_type', ['user', 'team']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const attachmentRelatedTypeEnum = pgEnum('attachment_related_type', ['message', 'job', 'project', 'delivery']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'resolved', 'escalated']);
export const milestoneAssigneeEnum = pgEnum('milestone_assignee', ['team', 'client']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['pending', 'in_progress', 'completed']);

export const teamModerationStatusEnum = pgEnum('team_moderation_status', ['pending', 'approved', 'rejected', 'suspended']);
export const jobModerationStatusEnum = pgEnum('job_moderation_status', ['draft', 'pending', 'approved', 'rejected', 'archived']);

export const clientProfiles = pgTable('client_profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  totalSpent: integer('total_spent').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const freelancerProfiles = pgTable('freelancer_profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  bio: text('bio'),
  title: varchar('title', { length: 255 }),
  hourlyRate: integer('hourly_rate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  moderationStatus: teamModerationStatusEnum('moderation_status').default('pending').notNull(),
  moderationReason: text('moderation_reason'),
  state: unitStateEnum('state').default('active').notNull(),
  agreementsAcceptedAt: timestamp('agreements_accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teamRole: teamRoleEnum('team_role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const joinRequests = pgTable('join_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message'),
  status: joinRequestStatusEnum('status').default('pending').notNull(),
  termsAccepted: boolean('terms_accepted').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const removalRequests = pgTable('removal_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  targetUserId: text('target_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  initiatorUserId: text('initiator_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: removalRequestStatusEnum('status').default('pending').notNull(),
  coolingEndsAt: timestamp('cooling_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const removalVotes = pgTable('removal_votes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  removalRequestId: text('removal_request_id').references(() => removalRequests.id, { onDelete: 'cascade' }).notNull(),
  voterUserId: text('voter_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vote: voteEnum('vote').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ownershipTransfers = pgTable('ownership_transfers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  removalRequestId: text('removal_request_id').references(() => removalRequests.id, { onDelete: 'cascade' }),
  resourceType: transferResourceTypeEnum('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  fromUserId: text('from_user_id').references(() => users.id).notNull(),
  toUserId: text('to_user_id').references(() => users.id).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const unitAuditLogs = pgTable('unit_audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  actorUserId: text('actor_user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), 
  targetUserId: text('target_user_id').references(() => users.id),
  details: text('details'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  status: jobStatusEnum('status').default('open').notNull(),
  moderationStatus: jobModerationStatusEnum('moderation_status').default('pending').notNull(),
  moderationReason: text('moderation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bids = pgTable('bids', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  proposal: text('proposal').notNull(),
  status: bidStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text('job_id').references(() => jobs.id).notNull().unique(),
  winningBidId: text('winning_bid_id').references(() => bids.id).notNull(),
  clientId: text('client_id').references(() => users.id).notNull(),
  teamId: text('team_id').references(() => teams.id).notNull(),
  status: projectStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const milestones = pgTable('milestones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: integer('amount').default(0).notNull(),
  status: milestoneStatusEnum('status').default('pending').notNull(),
  dueDate: timestamp('due_date'),
  assignedTo: milestoneAssigneeEnum('assigned_to').default('team').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messageThreads = pgTable('message_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  jobId: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messageThreadParticipants = pgTable('message_thread_participants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').references(() => messageThreads.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const meetings = pgTable('meetings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').references(() => messageThreads.id, { onDelete: 'cascade' }).notNull(),
  initiatorId: text('initiator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').references(() => messageThreads.id, { onDelete: 'cascade' }).notNull(),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  meetingId: text('meeting_id').references(() => meetings.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messageReads = pgTable('message_reads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  reviewerId: text('reviewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  revieweeId: text('reviewee_id').references(() => users.id, { onDelete: 'cascade' }),
  revieweeTeamId: text('reviewee_team_id').references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  actionUrl: varchar('action_url', { length: 255 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  targetType: verificationTargetTypeEnum('target_type').notNull(),
  targetUserId: text('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  targetTeamId: text('target_team_id').references(() => teams.id, { onDelete: 'cascade' }),
  status: verificationStatusEnum('status').default('pending').notNull(),
  documentUrl: varchar('document_url', { length: 1024 }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attachments = pgTable('attachments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  uploaderId: text('uploader_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  relatedType: attachmentRelatedTypeEnum('related_type').notNull(),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  jobId: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 1024 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const disputes = pgTable('disputes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  initiatorId: text('initiator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason').notNull(),
  status: disputeStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminActions = pgTable('admin_actions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: text('admin_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 100 }).notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  clientProfile: one(clientProfiles, { fields: [users.id], references: [clientProfiles.userId] }),
  freelancerProfile: one(freelancerProfiles, { fields: [users.id], references: [freelancerProfiles.userId] }),
  teamMemberships: many(teamMembers),
  jobs: many(jobs),
  messages: many(messages),
  notifications: many(notifications),
  reviewsWritten: many(reviews, { relationName: 'reviewer' }),
  reviewsReceived: many(reviews, { relationName: 'reviewee' }),
  messageThreads: many(messageThreadParticipants),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  bids: many(bids),
  projects: many(projects),
  reviewsReceived: many(reviews, { relationName: 'reviewee_team' }),
  joinRequests: many(joinRequests),
  removalRequests: many(removalRequests),
  auditLogs: many(unitAuditLogs),
}));

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  team: one(teams, { fields: [joinRequests.teamId], references: [teams.id] }),
  user: one(users, { fields: [joinRequests.userId], references: [users.id] }),
}));

export const removalRequestsRelations = relations(removalRequests, ({ one, many }) => ({
  team: one(teams, { fields: [removalRequests.teamId], references: [teams.id] }),
  targetUser: one(users, { fields: [removalRequests.targetUserId], references: [users.id] }),
  initiator: one(users, { fields: [removalRequests.initiatorUserId], references: [users.id] }),
  votes: many(removalVotes),
  ownershipTransfers: many(ownershipTransfers),
}));

export const removalVotesRelations = relations(removalVotes, ({ one }) => ({
  request: one(removalRequests, { fields: [removalVotes.removalRequestId], references: [removalRequests.id] }),
  voter: one(users, { fields: [removalVotes.voterUserId], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, { fields: [jobs.clientId], references: [users.id] }),
  bids: many(bids),
  project: one(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  job: one(jobs, { fields: [projects.jobId], references: [jobs.id] }),
  client: one(users, { fields: [projects.clientId], references: [users.id] }),
  team: one(teams, { fields: [projects.teamId], references: [teams.id] }),
  winningBid: one(bids, { fields: [projects.winningBidId], references: [bids.id] }),
  milestones: many(milestones),
  messages: many(messageThreads),
  disputes: many(disputes),
  reviews: many(reviews),
}));

export const messageThreadsRelations = relations(messageThreads, ({ one, many }) => ({
  project: one(projects, { fields: [messageThreads.projectId], references: [projects.id] }),
  job: one(jobs, { fields: [messageThreads.jobId], references: [jobs.id] }),
  participants: many(messageThreadParticipants),
  messages: many(messages),
  meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  thread: one(messageThreads, { fields: [meetings.threadId], references: [messageThreads.id] }),
  initiator: one(users, { fields: [meetings.initiatorId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  thread: one(messageThreads, { fields: [messages.threadId], references: [messageThreads.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  meeting: one(meetings, { fields: [messages.meetingId], references: [meetings.id] }),
  reads: many(messageReads),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, { fields: [reviews.projectId], references: [projects.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id], relationName: 'reviewer' }),
  reviewee: one(users, { fields: [reviews.revieweeId], references: [users.id], relationName: 'reviewee' }),
  revieweeTeam: one(teams, { fields: [reviews.revieweeTeamId], references: [teams.id], relationName: 'reviewee_team' }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  project: one(projects, { fields: [disputes.projectId], references: [projects.id] }),
  initiator: one(users, { fields: [disputes.initiatorId], references: [users.id] }),
}));
