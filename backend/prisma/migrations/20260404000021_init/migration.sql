-- CreateEnum
CREATE TYPE "role" AS ENUM ('ACOLYTE', 'GUARDIAN', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "celebration_type" AS ENUM ('SUNDAY_MASS', 'WEEKDAY_MASS', 'HOLY_DAY', 'SPECIAL');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'ACOLYTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_links" (
    "id" SERIAL NOT NULL,
    "guardian_id" INTEGER NOT NULL,
    "acolyte_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liturgical_functions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liturgical_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_functions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "function_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unavailabilities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unavailabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celebrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "celebration_type" NOT NULL DEFAULT 'SUNDAY_MASS',
    "location" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "celebrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celebration_function_requirements" (
    "id" SERIAL NOT NULL,
    "celebration_id" INTEGER NOT NULL,
    "function_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "celebration_function_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "schedule_status" NOT NULL DEFAULT 'DRAFT',
    "public_token" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_assignments" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "celebration_id" INTEGER NOT NULL,
    "function_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "audit_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "celebration_id" INTEGER NOT NULL,
    "function_id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "served_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_audit_logs" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_id" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- CreateIndex
CREATE INDEX "guardian_links_guardian_id_idx" ON "guardian_links"("guardian_id");

-- CreateIndex
CREATE INDEX "guardian_links_acolyte_id_idx" ON "guardian_links"("acolyte_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_links_guardian_id_acolyte_id_key" ON "guardian_links"("guardian_id", "acolyte_id");

-- CreateIndex
CREATE UNIQUE INDEX "liturgical_functions_name_key" ON "liturgical_functions"("name");

-- CreateIndex
CREATE INDEX "liturgical_functions_active_idx" ON "liturgical_functions"("active");

-- CreateIndex
CREATE INDEX "liturgical_functions_display_order_idx" ON "liturgical_functions"("display_order");

-- CreateIndex
CREATE INDEX "user_functions_user_id_idx" ON "user_functions"("user_id");

-- CreateIndex
CREATE INDEX "user_functions_function_id_idx" ON "user_functions"("function_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_functions_user_id_function_id_key" ON "user_functions"("user_id", "function_id");

-- CreateIndex
CREATE INDEX "unavailabilities_user_id_idx" ON "unavailabilities"("user_id");

-- CreateIndex
CREATE INDEX "unavailabilities_date_idx" ON "unavailabilities"("date");

-- CreateIndex
CREATE UNIQUE INDEX "unavailabilities_user_id_date_key" ON "unavailabilities"("user_id", "date");

-- CreateIndex
CREATE INDEX "celebrations_date_idx" ON "celebrations"("date");

-- CreateIndex
CREATE INDEX "celebrations_type_idx" ON "celebrations"("type");

-- CreateIndex
CREATE INDEX "celebrations_active_idx" ON "celebrations"("active");

-- CreateIndex
CREATE INDEX "celebration_function_requirements_celebration_id_idx" ON "celebration_function_requirements"("celebration_id");

-- CreateIndex
CREATE INDEX "celebration_function_requirements_function_id_idx" ON "celebration_function_requirements"("function_id");

-- CreateIndex
CREATE UNIQUE INDEX "celebration_function_requirements_celebration_id_function_i_key" ON "celebration_function_requirements"("celebration_id", "function_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_public_token_key" ON "schedules"("public_token");

-- CreateIndex
CREATE INDEX "schedules_status_idx" ON "schedules"("status");

-- CreateIndex
CREATE INDEX "schedules_start_date_end_date_idx" ON "schedules"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "schedules_public_token_idx" ON "schedules"("public_token");

-- CreateIndex
CREATE INDEX "schedules_created_by_id_idx" ON "schedules"("created_by_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_schedule_id_idx" ON "schedule_assignments"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_celebration_id_idx" ON "schedule_assignments"("celebration_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_function_id_idx" ON "schedule_assignments"("function_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_user_id_idx" ON "schedule_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_assignments_schedule_id_celebration_id_function_id_key" ON "schedule_assignments"("schedule_id", "celebration_id", "function_id", "user_id");

-- CreateIndex
CREATE INDEX "service_records_user_id_idx" ON "service_records"("user_id");

-- CreateIndex
CREATE INDEX "service_records_celebration_id_idx" ON "service_records"("celebration_id");

-- CreateIndex
CREATE INDEX "service_records_served_at_idx" ON "service_records"("served_at");

-- CreateIndex
CREATE INDEX "service_records_schedule_id_idx" ON "service_records"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_audit_logs_schedule_id_idx" ON "schedule_audit_logs"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_audit_logs_performed_by_id_idx" ON "schedule_audit_logs"("performed_by_id");

-- CreateIndex
CREATE INDEX "schedule_audit_logs_action_idx" ON "schedule_audit_logs"("action");

-- CreateIndex
CREATE INDEX "schedule_audit_logs_created_at_idx" ON "schedule_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_acolyte_id_fkey" FOREIGN KEY ("acolyte_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_functions" ADD CONSTRAINT "user_functions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_functions" ADD CONSTRAINT "user_functions_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "liturgical_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unavailabilities" ADD CONSTRAINT "unavailabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celebration_function_requirements" ADD CONSTRAINT "celebration_function_requirements_celebration_id_fkey" FOREIGN KEY ("celebration_id") REFERENCES "celebrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celebration_function_requirements" ADD CONSTRAINT "celebration_function_requirements_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "liturgical_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_celebration_id_fkey" FOREIGN KEY ("celebration_id") REFERENCES "celebrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "liturgical_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_celebration_id_fkey" FOREIGN KEY ("celebration_id") REFERENCES "celebrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "liturgical_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_audit_logs" ADD CONSTRAINT "schedule_audit_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_audit_logs" ADD CONSTRAINT "schedule_audit_logs_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
