/*
  Warnings:

  - You are about to drop the `_Likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `user` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_Likes_B_index";

-- DropIndex
DROP INDEX "_Likes_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_Likes";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_FeedbackLikes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FeedbackLikes_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FeedbackLikes_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Feedback" ("date", "id", "likes", "message", "title") SELECT "date", "id", "likes", "message", "title" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_FeedbackLikes_AB_unique" ON "_FeedbackLikes"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedbackLikes_B_index" ON "_FeedbackLikes"("B");
