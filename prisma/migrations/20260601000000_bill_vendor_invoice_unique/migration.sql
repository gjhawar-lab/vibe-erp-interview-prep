-- Scope invoice-number uniqueness to each vendor (composite unique index).
CREATE UNIQUE INDEX "Bill_vendorName_invoiceNumber_key"
  ON "Bill"("vendorName", "invoiceNumber");
