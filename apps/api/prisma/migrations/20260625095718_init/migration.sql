-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('official', 'verified', 'community_pending', 'outdated', 'rejected');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('seismic', 'tsunami', 'civil_protection', 'media', 'manual');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('active', 'degraded', 'disabled');

-- CreateEnum
CREATE TYPE "SeismicStatus" AS ENUM ('automatic', 'reviewed', 'deleted');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('earthquake', 'quarry_blast', 'other');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('green', 'yellow', 'orange', 'red', 'unknown');

-- CreateEnum
CREATE TYPE "TsunamiProvider" AS ENUM ('NOAA_PTWC', 'NOAA_NTWC', 'LOCAL_AUTHORITY');

-- CreateEnum
CREATE TYPE "TsunamiStatus" AS ENUM ('information', 'watch', 'advisory', 'warning', 'canceled', 'unknown');

-- CreateEnum
CREATE TYPE "CoastalRiskLevel" AS ENUM ('none', 'info', 'watch', 'warning', 'canceled');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('shelter', 'hospital', 'collection_center', 'water', 'food', 'charging_point', 'communication', 'transport', 'volunteer_center');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('active', 'saturated', 'closed', 'unknown');

-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('available', 'limited', 'full', 'unknown');

-- CreateEnum
CREATE TYPE "LocationPrecision" AS ENUM ('exact', 'approximate', 'area');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected', 'outdated');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('open', 'in_progress', 'partially_covered', 'covered', 'outdated');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('structural_damage', 'blocked_road', 'landslide', 'trapped_person', 'urgent_need', 'available_resource', 'active_shelter', 'collection_center', 'operational_hospital', 'electrical_risk', 'gas_leak', 'no_signal_zone', 'no_water_zone', 'no_power_zone');

-- CreateEnum
CREATE TYPE "ReportSourceType" AS ENUM ('first_hand', 'reported_by_other', 'media', 'authority', 'volunteer');

-- CreateEnum
CREATE TYPE "ReportVerificationStatus" AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'duplicate', 'outdated');

-- CreateEnum
CREATE TYPE "RecommendationContext" AS ENUM ('earthquake_before', 'earthquake_during', 'earthquake_after', 'tsunami', 'coast', 'damaged_building', 'communications');

-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "official_sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "country" TEXT,
    "base_url" TEXT,
    "status" "SourceStatus" NOT NULL DEFAULT 'active',
    "trust_level" "TrustLevel" NOT NULL,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seismic_events" (
    "id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "source_id" UUID,
    "source_name" TEXT,
    "status" "SeismicStatus" NOT NULL DEFAULT 'automatic',
    "event_type" "EventType" NOT NULL DEFAULT 'earthquake',
    "place" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "depth_km" DOUBLE PRECISION,
    "magnitude" DOUBLE PRECISION,
    "magnitude_type" TEXT,
    "event_time_utc" TIMESTAMP(3) NOT NULL,
    "event_time_local" TIMESTAMP(3),
    "updated_at_source" TIMESTAMP(3),
    "mmi" DOUBLE PRECISION,
    "cdi" DOUBLE PRECISION,
    "alert_level" "AlertLevel" NOT NULL DEFAULT 'unknown',
    "tsunami_flag" BOOLEAN NOT NULL DEFAULT false,
    "significance" INTEGER,
    "felt_reports_count" INTEGER,
    "detail_url" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seismic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tsunami_alerts" (
    "id" UUID NOT NULL,
    "external_id" TEXT,
    "source_id" UUID,
    "provider" "TsunamiProvider" NOT NULL,
    "status" "TsunamiStatus" NOT NULL DEFAULT 'unknown',
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "affected_area_text" TEXT,
    "effective_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "event_time_utc" TIMESTAMP(3),
    "related_seismic_event_id" UUID,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tsunami_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coastal_alert_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "municipality" TEXT,
    "coastline_geojson" JSONB,
    "risk_level" "CoastalRiskLevel" NOT NULL DEFAULT 'none',
    "last_alert_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coastal_alert_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "type" "ResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "municipality" TEXT,
    "parish" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_precision" "LocationPrecision" NOT NULL DEFAULT 'approximate',
    "status" "ResourceStatus" NOT NULL DEFAULT 'unknown',
    "capacity_status" "CapacityStatus" NOT NULL DEFAULT 'unknown',
    "description" TEXT,
    "public_contact" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "source_id" UUID,
    "created_by" TEXT,
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL,
    "municipality" TEXT,
    "parish" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_precision" "LocationPrecision" NOT NULL DEFAULT 'approximate',
    "urgency" "Urgency" NOT NULL DEFAULT 'medium',
    "quantity" TEXT,
    "status" "NeedStatus" NOT NULL DEFAULT 'open',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "source_id" UUID,
    "related_resource_id" UUID,
    "created_by" TEXT,
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_reports" (
    "id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL,
    "municipality" TEXT,
    "parish" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_precision" "LocationPrecision" NOT NULL DEFAULT 'approximate',
    "urgency" "Urgency" NOT NULL DEFAULT 'medium',
    "evidence_url" TEXT,
    "report_source_type" "ReportSourceType" NOT NULL,
    "private_contact" TEXT,
    "public_safe_summary" TEXT,
    "verification_status" "ReportVerificationStatus" NOT NULL DEFAULT 'pending',
    "moderator_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_recommendations" (
    "id" UUID NOT NULL,
    "context" "RecommendationContext" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_runs" (
    "id" UUID NOT NULL,
    "source_id" UUID,
    "job_name" TEXT NOT NULL,
    "status" "FetchStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_created" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "raw_response_snapshot" JSONB,

    CONSTRAINT "fetch_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "official_sources_name_key" ON "official_sources"("name");

-- CreateIndex
CREATE INDEX "seismic_events_external_id_idx" ON "seismic_events"("external_id");

-- CreateIndex
CREATE INDEX "seismic_events_event_time_utc_idx" ON "seismic_events"("event_time_utc");

-- CreateIndex
CREATE INDEX "seismic_events_magnitude_idx" ON "seismic_events"("magnitude");

-- CreateIndex
CREATE INDEX "seismic_events_latitude_longitude_idx" ON "seismic_events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "seismic_events_source_id_idx" ON "seismic_events"("source_id");

-- CreateIndex
CREATE INDEX "seismic_events_tsunami_flag_idx" ON "seismic_events"("tsunami_flag");

-- CreateIndex
CREATE UNIQUE INDEX "seismic_events_source_id_external_id_key" ON "seismic_events"("source_id", "external_id");

-- CreateIndex
CREATE INDEX "tsunami_alerts_status_idx" ON "tsunami_alerts"("status");

-- CreateIndex
CREATE INDEX "tsunami_alerts_effective_at_idx" ON "tsunami_alerts"("effective_at");

-- CreateIndex
CREATE INDEX "tsunami_alerts_expires_at_idx" ON "tsunami_alerts"("expires_at");

-- CreateIndex
CREATE INDEX "tsunami_alerts_related_seismic_event_id_idx" ON "tsunami_alerts"("related_seismic_event_id");

-- CreateIndex
CREATE INDEX "citizen_reports_verification_status_idx" ON "citizen_reports"("verification_status");

-- CreateIndex
CREATE INDEX "citizen_reports_created_at_idx" ON "citizen_reports"("created_at");

-- CreateIndex
CREATE INDEX "fetch_runs_source_id_idx" ON "fetch_runs"("source_id");

-- CreateIndex
CREATE INDEX "fetch_runs_job_name_idx" ON "fetch_runs"("job_name");

-- AddForeignKey
ALTER TABLE "seismic_events" ADD CONSTRAINT "seismic_events_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "official_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsunami_alerts" ADD CONSTRAINT "tsunami_alerts_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "official_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsunami_alerts" ADD CONSTRAINT "tsunami_alerts_related_seismic_event_id_fkey" FOREIGN KEY ("related_seismic_event_id") REFERENCES "seismic_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "official_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "official_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_related_resource_id_fkey" FOREIGN KEY ("related_resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
