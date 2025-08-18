/*
  Warnings:

  - Added the required column `category` to the `Appliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Appliance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Appliance" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contribution" DOUBLE PRECISION,
ADD COLUMN     "type" TEXT NOT NULL;
