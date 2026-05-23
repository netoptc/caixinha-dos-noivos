-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PixKeyType" AS ENUM ('CPF', 'EMAIL', 'PHONE', 'EVP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "asaasAccountId" TEXT,
    "asaasWalletId" TEXT,
    "asaasApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixinha" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coupleNames" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3),
    "goalAmount" DECIMAL(10,2) NOT NULL,
    "raisedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "primaryColor" TEXT NOT NULL DEFAULT '#D4A017',
    "coverImageUrl" TEXT,
    "coupleImageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hideDonorAmount" BOOLEAN NOT NULL DEFAULT true,
    "hideTotalRaised" BOOLEAN NOT NULL DEFAULT false,
    "hideGoal" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caixinha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorPhone" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "feePercent" DECIMAL(5,4) NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "videoUrl" TEXT,
    "photoUrl" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "asaasPaymentId" TEXT,
    "asaasInvoiceUrl" TEXT,
    "pixQrCode" TEXT,
    "pixQrCodeImage" TEXT,
    "creditDate" TIMESTAMP(3),
    "caixinhaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "holderCpf" TEXT,
    "pixKey" TEXT NOT NULL,
    "pixKeyType" "PixKeyType" NOT NULL,
    "asaasTransferId" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "anticipated" BOOLEAN NOT NULL DEFAULT false,
    "anticipationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_asaasAccountId_key" ON "User"("asaasAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "User_asaasWalletId_key" ON "User"("asaasWalletId");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_createdAt_idx" ON "PasswordReset"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Caixinha_slug_key" ON "Caixinha"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Caixinha_userId_key" ON "Caixinha"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_asaasPaymentId_key" ON "Donation"("asaasPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_asaasTransferId_key" ON "Withdrawal"("asaasTransferId");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_createdAt_idx" ON "Withdrawal"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixinha" ADD CONSTRAINT "Caixinha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_caixinhaId_fkey" FOREIGN KEY ("caixinhaId") REFERENCES "Caixinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

