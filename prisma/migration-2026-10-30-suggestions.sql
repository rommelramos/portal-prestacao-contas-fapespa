-- Migração: sugestões de documentos (usuários comuns) + documentos N:N financiadores
-- Data: 2026-10-30
-- Aplicar via mysql CLI (protocolo de texto evita erro 1295 do proxy HostGator):
--   mysql -h <host> -u <user> -p<senha> <db> < prisma/migration-2026-10-30-suggestions.sql
-- Aditiva e idempotente (IF NOT EXISTS / INSERT IGNORE). Não remove nada.

-- CreateTable: vínculo N:N documento ↔ financiador
CREATE TABLE IF NOT EXISTS `DocumentFunder` (
    `documentId` VARCHAR(191) NOT NULL,
    `funderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentFunder_funderId_idx`(`funderId`),
    INDEX `DocumentFunder_documentId_idx`(`documentId`),
    PRIMARY KEY (`documentId`, `funderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: cada documento existente passa a ter vínculo com seu financiador de origem
INSERT IGNORE INTO `DocumentFunder` (`documentId`, `funderId`, `createdAt`)
SELECT `id`, `funderId`, NOW(3) FROM `Document`;

-- CreateTable: sugestões de documentos enviadas por usuários
CREATE TABLE IF NOT EXISTS `DocumentSuggestion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `funderId` VARCHAR(191) NULL,
    `suggestedFunderName` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewNote` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentSuggestion_userId_idx`(`userId`),
    INDEX `DocumentSuggestion_status_idx`(`status`),
    INDEX `DocumentSuggestion_funderId_idx`(`funderId`),
    INDEX `DocumentSuggestion_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: arquivos anexados a uma sugestão
CREATE TABLE IF NOT EXISTS `SuggestionFile` (
    `id` VARCHAR(191) NOT NULL,
    `suggestionId` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL DEFAULT 0,
    `documentId` VARCHAR(191) NULL,

    INDEX `SuggestionFile_suggestionId_idx`(`suggestionId`),
    INDEX `SuggestionFile_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentFunder` ADD CONSTRAINT `DocumentFunder_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DocumentFunder` ADD CONSTRAINT `DocumentFunder_funderId_fkey` FOREIGN KEY (`funderId`) REFERENCES `Funder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `DocumentSuggestion` ADD CONSTRAINT `DocumentSuggestion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DocumentSuggestion` ADD CONSTRAINT `DocumentSuggestion_funderId_fkey` FOREIGN KEY (`funderId`) REFERENCES `Funder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `DocumentSuggestion` ADD CONSTRAINT `DocumentSuggestion_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `SuggestionFile` ADD CONSTRAINT `SuggestionFile_suggestionId_fkey` FOREIGN KEY (`suggestionId`) REFERENCES `DocumentSuggestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SuggestionFile` ADD CONSTRAINT `SuggestionFile_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
