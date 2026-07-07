import { pgTable, text, integer, date, timestamp, uuid, jsonb, primaryKey, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  for_everyone: boolean('for_everyone').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: text('first_name').notNull(),
  middle_name: text('middle_name'),
  last_name: text('last_name').notNull(),
  sex: text('sex'),
  age: integer('age'),
  birth_date: text('birth_date'), // Some records might use text or date, we'll use text for consistency with the form
  birth_place: text('birth_place'),
  contact_number: text('contact_number'),
  
  // Address
  house_number: text('house_number'),
  unit_number: text('unit_number'),
  street: text('street'),
  barangay: text('barangay'),
  city: text('city'),
  province: text('province'),
  zip_code: text('zip_code'),
  country: text('country').default('Philippines'),
  
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
  date_saved: text('date_saved'),
  witnessed_by: text('witnessed_by'),
  baptized_by: text('baptized_by'),
  date_baptized: text('date_baptized'),
  baptism_date: text('baptism_date'), // Using the new one
  witness_by: text('witness_by'),     // Using the new one
  place_of_baptism: text('place_of_baptism'),
  years_in_church: integer('years_in_church'),
  prev_church_name: text('prev_church_name'),
  prev_church_years: integer('prev_church_years'),
  
  // Education (Older ones + new ones)
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
