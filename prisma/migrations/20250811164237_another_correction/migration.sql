-- AlterTable
ALTER TABLE "public"."Forecast" ADD COLUMN     "week" INTEGER;

-- AlterTable
ALTER TABLE "public"."Meter" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."MeterReading" ADD COLUMN     "isOfficialEndOfMonth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "week" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "estimatedCost" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Tariff" ADD COLUMN     "tvFee" DOUBLE PRECISION NOT NULL DEFAULT 35;
