/* =========================================================================
   YOLO Eats — backend connection
   -------------------------------------------------------------------------
   Paste your Supabase project details below, then save this file.

     1. Open  https://supabase.com/dashboard  →  your project
     2. Settings → API
     3. Copy "Project URL"        → url
        Copy "anon / publishable" → anonKey      (the PUBLIC key, never the
                                                  service_role / secret key)

   Leave them empty and everything still works: the admin panel saves to the
   browser and you publish by downloading data/site.json.
   ========================================================================= */
window.YOLO_SUPABASE = {
  url:     "https://dycyiunziqfyofrpncxq.supabase.co",   
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Y3lpdW56aXFmeW9mcnBuY3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTM3MjUsImV4cCI6MjEwODU2OTcyNX0.WuZvtMV79swmBIJHsOaajuaI8GWx-okgv94VIuS4_No"   
};

/* Optional: where the admin panel lives, used for the footer link. */
window.YOLO_ADMIN_PATH = "admin/";
