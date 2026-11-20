CREATE TABLE "master_logs" (
	"name" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"recording_id" integer NOT NULL,
	CONSTRAINT "master_logs_name_size_bytes_pk" PRIMARY KEY("name","size_bytes")
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recordings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"sha256" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"gps_time" boolean NOT NULL,
	"sample_count" integer NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recordings_sha256_unique" UNIQUE("sha256")
);
--> statement-breakpoint
CREATE TABLE "samples" (
	"time" timestamp with time zone NOT NULL,
	"recording_id" integer NOT NULL,
	"can_id" smallint NOT NULL,
	"value" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"can_id" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"node" text NOT NULL,
	"units" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "master_logs" ADD CONSTRAINT "master_logs_recording_id_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recordings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "samples_recording_id_can_id_time_index" ON "samples" USING btree ("recording_id","can_id","time");