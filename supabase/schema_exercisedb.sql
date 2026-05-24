-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.exercises (
  id text NOT NULL,
  name text NOT NULL,
  category text,
  force text,
  level text,
  mechanic text,
  equipment text,
  primary_muscles ARRAY,
  secondary_muscles ARRAY,
  instructions ARRAY,
  image_url text,
  image_url_2 text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);