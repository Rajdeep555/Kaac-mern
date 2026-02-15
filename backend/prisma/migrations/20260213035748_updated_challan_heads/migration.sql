-- AlterTable
ALTER TABLE "ChallanHeads" ADD COLUMN     "detailHeadCode" TEXT DEFAULT '0',
ADD COLUMN     "detailHeadParentCode" TEXT DEFAULT '0',
ADD COLUMN     "majorHeadCode" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "minorHeadCode" TEXT DEFAULT '0',
ADD COLUMN     "minorHeadParentCode" TEXT DEFAULT '0',
ADD COLUMN     "subMajorCode" TEXT DEFAULT '0',
ADD COLUMN     "subMajorParentCode" TEXT DEFAULT '0',
ADD COLUMN     "subSubMajorCode" TEXT DEFAULT '0',
ADD COLUMN     "subSubMajorParentCode" TEXT DEFAULT '0';
