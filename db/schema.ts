import { pgTable, text, integer, date, timestamp, uuid, jsonb, primaryKey, boolean, unique } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  for_everyone: boolean('for_everyone').default(false).notNull(),
  parent_id: uuid('parent_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: text('first_name').notNull(),
  middle_name: text('middle_name'),
  last_name: text('last_name').notNull(),
  sex: text('sex'),
  age: integer('age'),
  birth_date: text('birth_date'),
  birth_place: text('birth_place'),
  contact_number: text('contact_number'),
  email: text('email'),
  
  // Address - Current
  house_number: text('house_number'),
  unit_number: text('unit_number'),
  street: text('street'),
  barangay: text('barangay'),
  city: text('city'),
  province: text('province'),
  zip_code: text('zip_code'),
  country: text('country').default('Philippines'),

  // Address - Permanent
  is_perm_same_as_current: boolean('is_perm_same_as_current').default(true),
  perm_house_number: text('perm_house_number'),
  perm_unit_number: text('perm_unit_number'),
  perm_street: text('perm_street'),
  perm_barangay: text('perm_barangay'),
  perm_city: text('perm_city'),
  perm_province: text('perm_province'),
  perm_zip_code: text('perm_zip_code'),
  perm_country: text('perm_country').default('Philippines'),
  
  // Work / Student
  occupation: text('occupation'),
  company: text('company'),
  position: text('position'),
  employment_status: text('employment_status'),
  work_address: text('work_address'),
  work_contact_number: text('work_contact_number'),
  student_school: text('student_school'),
  student_year_level: text('student_year_level'),
  student_course: text('student_course'),
  
  // Family
  marital_status: text('marital_status'),
  father_name: text('father_name'),
  father_occupation: text('father_occupation'),
  father_contact_number: text('father_contact_number'),
  mother_name: text('mother_name'),
  mother_occupation: text('mother_occupation'),
  mother_contact_number: text('mother_contact_number'),
  parents_civil_status: text('parents_civil_status'),
  spouse_member_id: uuid('spouse_member_id'),
  spouse_name: text('spouse_name'),
  spouse_occupation: text('spouse_occupation'),
  anniversary_date: text('anniversary_date'),
  siblings: jsonb('siblings').default([]),
  
  // Emergency Contact
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_relationship: text('emergency_contact_relationship'),
  emergency_contact_number: text('emergency_contact_number'),
  
  // Church / Spiritual Info
  current_church: text('current_church').default('Current Church'),
  date_saved: date('date_saved'),
  membership_date: date('membership_date'),
  witnessed_by: text('witnessed_by'),
  baptized_by: text('baptized_by'),
  date_baptized: date('date_baptized'),
  baptism_date: date('baptism_date'),
  witness_by: text('witness_by'),
  place_of_baptism: text('place_of_baptism'),
  years_in_church: integer('years_in_church'),
  prev_church_name: text('prev_church_name'),
  prev_church_years: integer('prev_church_years'),
  
  // Education
  highest_educational_attainment: text('highest_educational_attainment'),
  education_details: jsonb('education_details').default([]),
  awards_honors: text('awards_honors'),
  
  // Metadata
  created_by: uuid('created_by').references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  member_id: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birth_date: date('birth_date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const member_ministries = pgTable('member_ministries', {
  member_id: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  ministry_id: uuid('ministry_id').notNull().references(() => ministries.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.member_id, t.ministry_id] }),
}))

// ──────────────────────────────────────────────
// COMMITMENTS SYSTEM
// ──────────────────────────────────────────────

export const offering_categories = pgTable('offering_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  is_monthly: boolean('is_monthly').default(false).notNull(),
  month: integer('month'), // 1-12, for one-time offerings tied to a specific month
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const commitments = pgTable('commitments', {
  id: uuid('id').primaryKey().defaultRandom(),
  member_id: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniq: unique().on(t.member_id, t.year),
}))

export const commitment_ministries = pgTable('commitment_ministries', {
  commitment_id: uuid('commitment_id').notNull().references(() => commitments.id, { onDelete: 'cascade' }),
  ministry_id: uuid('ministry_id').notNull().references(() => ministries.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.commitment_id, t.ministry_id] }),
}))

export const commitment_offerings = pgTable('commitment_offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  commitment_id: uuid('commitment_id').notNull().references(() => commitments.id, { onDelete: 'cascade' }),
  offering_category_id: uuid('offering_category_id').notNull().references(() => offering_categories.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ──────────────────────────────────────────────
// ORG CHART SYSTEM
// ──────────────────────────────────────────────

import { AnyPgColumn } from 'drizzle-orm/pg-core'

export const org_chart_nodes = pgTable('org_chart_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  role_title: text('role_title').notNull(),
  member_id: uuid('member_id').references(() => members.id, { onDelete: 'set null' }),
  parent_id: uuid('parent_id').references((): AnyPgColumn => org_chart_nodes.id, { onDelete: 'set null' }),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
