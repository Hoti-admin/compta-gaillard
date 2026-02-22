-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('OPEN', 'PAID', 'CANCELED');

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'OPEN',
    "number" TEXT,
    "supplierId" TEXT NOT NULL,
    "amountGrossCents" INTEGER NOT NULL,
    "amountNetCents" INTEGER NOT NULL,
    "amountVatCents" INTEGER NOT NULL,
    "vatRateBp" INTEGER,
    "documentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bill_issueDate_idx" ON "Bill"("issueDate");

-- CreateIndex
CREATE INDEX "Bill_supplierId_idx" ON "Bill"("supplierId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
