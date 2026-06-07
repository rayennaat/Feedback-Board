-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('comment', 'status', 'reply');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "moderationReason" TEXT NOT NULL DEFAULT '', ADD COLUMN "adminNote" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "hiddenReason" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SavedFeedback" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SavedFeedback_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SavedFeedback_B_index" ON "_SavedFeedback"("B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedFeedback" ADD CONSTRAINT "_SavedFeedback_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedFeedback" ADD CONSTRAINT "_SavedFeedback_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
