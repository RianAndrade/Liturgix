-- CreateEnum
CREATE TYPE "liturgical_color" AS ENUM ('GREEN', 'WHITE', 'RED', 'PURPLE', 'ROSE', 'BLACK');

-- AlterTable
ALTER TABLE "celebrations" ADD COLUMN     "liturgical_color" "liturgical_color";
