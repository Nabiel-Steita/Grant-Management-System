-- CreateTable
CREATE TABLE "SpendingRecord" (
    "id" SERIAL NOT NULL,
    "budgetSubtitleId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "spentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendingRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpendingRecord" ADD CONSTRAINT "SpendingRecord_budgetSubtitleId_fkey" FOREIGN KEY ("budgetSubtitleId") REFERENCES "BudgetSubtitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
