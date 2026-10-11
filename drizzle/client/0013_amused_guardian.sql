ALTER TABLE `tester_probes` ADD `finish_reason` text;--> statement-breakpoint
ALTER TABLE `tester_probes` ADD `reasoning_tokens` integer;--> statement-breakpoint
ALTER TABLE `tester_probes` ADD `error_body` text;--> statement-breakpoint
ALTER TABLE `tester_tests` ADD `findings` text;--> statement-breakpoint
ALTER TABLE `tester_tests` ADD `reports` text;