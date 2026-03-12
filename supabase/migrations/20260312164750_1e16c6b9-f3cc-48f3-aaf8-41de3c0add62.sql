ALTER TABLE public.sensor_readings ALTER COLUMN light_level TYPE numeric;
ALTER TABLE public.sensor_readings ALTER COLUMN temperature TYPE numeric;
ALTER TABLE public.sensor_readings ALTER COLUMN humidity TYPE numeric;
ALTER TABLE public.sensor_readings ALTER COLUMN moisture TYPE numeric;
DELETE FROM public.sensor_readings WHERE temperature IS NULL AND humidity IS NULL AND moisture IS NULL;