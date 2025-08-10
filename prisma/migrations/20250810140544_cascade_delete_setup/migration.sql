-- DropForeignKey
ALTER TABLE "public"."Meter" DROP CONSTRAINT "Meter_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MeterReading" DROP CONSTRAINT "MeterReading_meterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MeterReading" DROP CONSTRAINT "MeterReading_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Meter" ADD CONSTRAINT "Meter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeterReading" ADD CONSTRAINT "MeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "public"."Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeterReading" ADD CONSTRAINT "MeterReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
