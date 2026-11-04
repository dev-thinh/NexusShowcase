CREATE TABLE "draft_mutations" (
  "actorId" TEXT NOT NULL,
  "mutationId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "response" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "draft_mutations_pkey" PRIMARY KEY ("actorId", "mutationId")
);
