-- CreateIndex
CREATE UNIQUE INDEX "coastal_alert_zones_name_key" ON "coastal_alert_zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tsunami_alerts_external_id_key" ON "tsunami_alerts"("external_id");
