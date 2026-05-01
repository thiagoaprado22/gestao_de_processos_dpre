CREATE TABLE `licitacoes_previstas` (
	`id` varchar(36) NOT NULL,
	`objeto` text NOT NULL,
	`tipo` enum('Material','Serviço') NOT NULL,
	`solicitante` text NOT NULL,
	`status` enum('Prevista','Em andamento','Finalizada') NOT NULL DEFAULT 'Prevista',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licitacoes_previstas_id` PRIMARY KEY(`id`)
);
