/*
  Warnings:

  - You are about to drop the `Chunk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Query` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workspace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmbryoState" AS ENUM ('LATENT', 'GERMINATING', 'GROWING', 'MATURE', 'FOSSIL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREATED', 'STATE_CHANGED', 'TENSION_ADDED', 'TENSION_RESOLVED', 'CONNECTION_MADE', 'AGENT_QUESTION', 'AGENT_SUGGESTION', 'USER_RESPONSE', 'FOSSIL_PROPOSED', 'FOSSILIZED');

-- CreateEnum
CREATE TYPE "EventInitiator" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('REINFORCES', 'CONTRADICTS', 'EXTENDS', 'RESURRECTS');

-- CreateEnum
CREATE TYPE "AgentNoteType" AS ENUM ('OBSERVATION', 'PENDING_QUESTION', 'PENDING_CONNECTION', 'PENDING_FOSSIL');

-- CreateEnum
CREATE TYPE "FossilTrigger" AS ENUM ('USER', 'AGENT');

-- DropForeignKey
ALTER TABLE "Chunk" DROP CONSTRAINT "Chunk_documentId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceSetting" DROP CONSTRAINT "WorkspaceSetting_workspaceId_fkey";

-- DropTable
DROP TABLE "Chunk";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Query";

-- DropTable
DROP TABLE "Setting";

-- DropTable
DROP TABLE "UserSetting";

-- DropTable
DROP TABLE "Workspace";

-- DropTable
DROP TABLE "WorkspaceMember";

-- DropTable
DROP TABLE "WorkspaceSetting";

-- CreateTable
CREATE TABLE "Embryo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "state" "EmbryoState" NOT NULL DEFAULT 'LATENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fossilizedAt" TIMESTAMP(3),
    "fossilReason" TEXT,
    "fossilBy" "FossilTrigger",

    CONSTRAINT "Embryo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbryoEvent" (
    "id" TEXT NOT NULL,
    "embryoId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "initiatedBy" "EventInitiator" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbryoEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tension" (
    "id" TEXT NOT NULL,
    "embryoId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "raisedBy" "EventInitiator" NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "ConnectionType" NOT NULL,
    "detectedBy" "EventInitiator" NOT NULL,
    "confirmedByUser" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentNote" (
    "id" TEXT NOT NULL,
    "embryoId" TEXT NOT NULL,
    "type" "AgentNoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Embryo_userId_state_idx" ON "Embryo"("userId", "state");

-- CreateIndex
CREATE INDEX "Embryo_userId_createdAt_idx" ON "Embryo"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmbryoEvent_embryoId_createdAt_idx" ON "EmbryoEvent"("embryoId", "createdAt");

-- CreateIndex
CREATE INDEX "Tension_embryoId_resolved_idx" ON "Tension"("embryoId", "resolved");

-- CreateIndex
CREATE INDEX "Connection_sourceId_idx" ON "Connection"("sourceId");

-- CreateIndex
CREATE INDEX "Connection_targetId_idx" ON "Connection"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_sourceId_targetId_key" ON "Connection"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "AgentNote_embryoId_type_idx" ON "AgentNote"("embryoId", "type");

-- AddForeignKey
ALTER TABLE "Embryo" ADD CONSTRAINT "Embryo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoEvent" ADD CONSTRAINT "EmbryoEvent_embryoId_fkey" FOREIGN KEY ("embryoId") REFERENCES "Embryo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tension" ADD CONSTRAINT "Tension_embryoId_fkey" FOREIGN KEY ("embryoId") REFERENCES "Embryo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Embryo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Embryo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentNote" ADD CONSTRAINT "AgentNote_embryoId_fkey" FOREIGN KEY ("embryoId") REFERENCES "Embryo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
