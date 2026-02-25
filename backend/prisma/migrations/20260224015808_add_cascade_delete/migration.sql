-- AddForeignKey
ALTER TABLE "challanFromBill" ADD CONSTRAINT "challanFromBill_idFromExpenditure_fkey" FOREIGN KEY ("idFromExpenditure") REFERENCES "Expenditure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
