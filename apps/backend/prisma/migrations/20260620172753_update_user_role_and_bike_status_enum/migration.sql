/*
  Warnings:

  - The `status` column on the `Bike` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "BikeStatus" AS ENUM ('UNREGISTERED', 'AVAILABLE', 'IN_USE', 'ERROR');

-- AlterTable
ALTER TABLE "Bike" DROP COLUMN "status",
ADD COLUMN     "status" "BikeStatus" NOT NULL DEFAULT 'UNREGISTERED';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';
