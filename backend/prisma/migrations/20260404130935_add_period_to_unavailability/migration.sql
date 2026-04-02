-- CreateEnum
CREATE TYPE "period" AS ENUM ('ALL_DAY', 'MORNING_ONLY', 'NIGHT_ONLY');

-- AlterTable
ALTER TABLE "unavailabilities" ADD COLUMN     "period" "period" NOT NULL DEFAULT 'ALL_DAY';
