CREATE TRIGGER "on_inserted_or_updated_embedding"
AFTER INSERT
OR
UPDATE OF content ON public.embeddings FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request (
  'https://dmrooqbmxdhdyblqzswu.supabase.co.supabase.co/functions/v1/generate-embedding',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcm9vcWJteGRoZHlibHF6c3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwMzU2OTYsImV4cCI6MjAyNDYxMTY5Nn0.zCE28Ez7R06_QyGyI4Hmk-8SGi9ju6V5Jq1YCuhW8AY"}',
  '{}',
  '5000'
);

