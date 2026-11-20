SELECT create_hypertable('samples', by_range('time', INTERVAL '1 day'), create_default_indexes => false);
--> statement-breakpoint
ALTER TABLE samples SET (
	timescaledb.enable_columnstore,
	timescaledb.segmentby = 'recording_id, can_id',
	timescaledb.orderby = 'time'
);
--> statement-breakpoint
CALL add_columnstore_policy('samples', after => INTERVAL '7 days');
