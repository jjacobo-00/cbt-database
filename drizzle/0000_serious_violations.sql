CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"name" text NOT NULL,
	"birth_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commitment_ministries" (
	"commitment_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	CONSTRAINT "commitment_ministries_commitment_id_ministry_id_pk" PRIMARY KEY("commitment_id","ministry_id")
);
--> statement-breakpoint
CREATE TABLE "commitment_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commitment_id" uuid NOT NULL,
	"offering_category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "commitments_member_id_year_unique" UNIQUE("member_id","year")
);
--> statement-breakpoint
CREATE TABLE "member_ministries" (
	"member_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	CONSTRAINT "member_ministries_member_id_ministry_id_pk" PRIMARY KEY("member_id","ministry_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"sex" text,
	"age" integer,
	"birth_date" text,
	"birth_place" text,
	"contact_number" text,
	"house_number" text,
	"unit_number" text,
	"street" text,
	"barangay" text,
	"city" text,
	"province" text,
	"zip_code" text,
	"country" text DEFAULT 'Philippines',
	"is_perm_same_as_current" boolean DEFAULT true,
	"perm_house_number" text,
	"perm_unit_number" text,
	"perm_street" text,
	"perm_barangay" text,
	"perm_city" text,
	"perm_province" text,
	"perm_zip_code" text,
	"perm_country" text DEFAULT 'Philippines',
	"occupation" text,
	"company" text,
	"position" text,
	"employment_status" text,
	"work_address" text,
	"work_contact_number" text,
	"student_school" text,
	"student_year_level" text,
	"student_course" text,
	"marital_status" text,
	"father_name" text,
	"father_occupation" text,
	"father_contact_number" text,
	"mother_name" text,
	"mother_occupation" text,
	"mother_contact_number" text,
	"parents_civil_status" text,
	"spouse_name" text,
	"spouse_occupation" text,
	"anniversary_date" text,
	"siblings" jsonb DEFAULT '[]'::jsonb,
	"emergency_contact_name" text,
	"emergency_contact_relationship" text,
	"emergency_contact_number" text,
	"current_church" text DEFAULT 'Current Church',
	"date_saved" date,
	"membership_date" date,
	"witnessed_by" text,
	"baptized_by" text,
	"date_baptized" date,
	"baptism_date" date,
	"witness_by" text,
	"place_of_baptism" text,
	"years_in_church" integer,
	"prev_church_name" text,
	"prev_church_years" integer,
	"highest_educational_attainment" text,
	"education_details" jsonb DEFAULT '[]'::jsonb,
	"awards_honors" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ministries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"for_everyone" boolean DEFAULT false NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offering_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_monthly" boolean DEFAULT false NOT NULL,
	"month" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_chart_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_title" text NOT NULL,
	"member_id" uuid,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_ministries" ADD CONSTRAINT "commitment_ministries_commitment_id_commitments_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_ministries" ADD CONSTRAINT "commitment_ministries_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_offerings" ADD CONSTRAINT "commitment_offerings_commitment_id_commitments_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_offerings" ADD CONSTRAINT "commitment_offerings_offering_category_id_offering_categories_id_fk" FOREIGN KEY ("offering_category_id") REFERENCES "public"."offering_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_ministries" ADD CONSTRAINT "member_ministries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_ministries" ADD CONSTRAINT "member_ministries_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_nodes" ADD CONSTRAINT "org_chart_nodes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_nodes" ADD CONSTRAINT "org_chart_nodes_parent_id_org_chart_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."org_chart_nodes"("id") ON DELETE set null ON UPDATE no action;