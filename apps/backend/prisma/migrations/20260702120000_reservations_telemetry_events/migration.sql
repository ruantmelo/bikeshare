-- CreateEnum
ALTER TYPE "BikeStatus" ADD VALUE 'RESERVED';

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('RESERVED', 'IN_USE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BicycleEventType" AS ENUM (
  'bicycle_online',
  'reservation_started',
  'reservation_expired',
  'ride_started',
  'ride_ended',
  'command_rejected',
  'command_publish_failed'
);

-- DropForeignKey
ALTER TABLE "Telemetry" DROP CONSTRAINT "Telemetry_bikeId_fkey";

-- AlterTable
ALTER TABLE "Bike" RENAME COLUMN "lat" TO "latitude";
ALTER TABLE "Bike" RENAME COLUMN "lng" TO "longitude";
ALTER TABLE "Bike" RENAME COLUMN "speed" TO "speedMetersPerSecond";
ALTER TABLE "Bike" ADD COLUMN "reservedUntil" TIMESTAMP(3);
ALTER TABLE "Bike" ADD COLUMN "lastTelemetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN "status" "RideStatus";
ALTER TABLE "Ride" ADD COLUMN "reservedAt" TIMESTAMP(3);
UPDATE "Ride"
SET
  "status" = CASE WHEN "endedAt" IS NULL THEN 'IN_USE'::"RideStatus" ELSE 'COMPLETED'::"RideStatus" END,
  "reservedAt" = "startedAt";
ALTER TABLE "Ride" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "reservedAt" SET NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "startedAt" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "startedAt" DROP DEFAULT;

-- Replace legacy telemetry with the typed protocol table.
DROP TABLE "Telemetry";
CREATE TABLE "Telemetry" (
  "id" TEXT NOT NULL,
  "bikeId" TEXT NOT NULL,
  "rideId" TEXT,
  "status" "BikeStatus" NOT NULL,
  "uptimeMs" BIGINT NOT NULL,
  "speedMetersPerSecond" DOUBLE PRECISION,
  "gnssValid" BOOLEAN NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "altitudeMeters" DOUBLE PRECISION,
  "accuracyMeters" DOUBLE PRECISION,
  "motionValid" BOOLEAN NOT NULL,
  "moving" BOOLEAN,
  "accelX" DOUBLE PRECISION,
  "accelY" DOUBLE PRECISION,
  "accelZ" DOUBLE PRECISION,
  "gyroX" DOUBLE PRECISION,
  "gyroY" DOUBLE PRECISION,
  "gyroZ" DOUBLE PRECISION,
  "temperatureCelsius" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BicycleEvent" (
  "id" TEXT NOT NULL,
  "bikeId" TEXT NOT NULL,
  "rideId" TEXT,
  "event" "BicycleEventType" NOT NULL,
  "status" "BikeStatus",
  "reason" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BicycleEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BicycleEvent" ADD CONSTRAINT "BicycleEvent_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BicycleEvent" ADD CONSTRAINT "BicycleEvent_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
