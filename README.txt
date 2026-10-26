YOLO Eats – Restaurant Website + Admin Panel
Built by OneT Digital Solutions · sales@onetdigitalsolution.com · 7000418227
=============================================================================

Site      : https://yollo.co.in/
Admin     : https://yollo.co.in/admin/
Location  : Kathua, Jammu & Kashmir (near Pathankot)
Hosting   : Vercel          Database : Supabase


WHAT IS IN THIS FOLDER
-----------------------------------------------------------------------------
  index.html              The website — home, menu, FAQ, WhatsApp ordering
  menu/                   The table menu for the QR code on each table
  admin/                  The admin panel
  assets/                 Logo, icons, hero photo, JavaScript
  data/site.json          The menu + settings everything reads
  supabase-setup.sql      Run once in Supabase to switch on cloud saving
  vercel.json             Caching + security headers for Vercel
  favicon.ico, robots.txt, sitemap.xml, site.webmanifest


=============================================================================
THE TABLE MENU  (https://yollo.co.in/menu/)
=============================================================================
A separate, menu-only page built for a guest sitting at a table who has just
scanned the QR code. No hero, no story — the menu opens straight away.

  - search, category rail, live "Open / Closed" badge
  - tap ADD, pick Half or Full, change quantity
  - the order is kept if the page is refreshed
  - the guest fills in NAME and TABLE NUMBER (both required) plus an
    optional note, then presses "Send on WhatsApp"

The message that reaches the restaurant looks like this:

    *YOLO Eats — Table Order*

    Name: Rahul Sharma
    Table: 7

    • Shahi Paneer (Full) x1 — ₹210
    • Butter Naan x4 — ₹160

    *Total: ₹370*
    Note: Less spicy please

    Sent from the table menu

It reads the SAME data/site.json and Supabase as the main site, so a price
changed once in the admin panel updates the website and the table menu
together. Nothing extra to maintain.

TO PUT IT ON THE TABLES
  1. Set the WhatsApp number in /admin/ -> Restaurant details, then Publish.
     Without it the guest has to pick a chat themselves.
  2. Make a QR code pointing at  https://yollo.co.in/menu/
  3. Print it on table tents or stick it on the menu card.


=============================================================================
STEP 1 — SUPABASE  (do this FIRST on Vercel)
=============================================================================
On Vercel there is no file manager, so the admin panel can only save to the
website through Supabase. Without it the client cannot change the menu.

1. Create a project at https://supabase.com/dashboard
2. SQL Editor -> New query -> paste all of supabase-setup.sql -> RUN
3. Authentication -> Users -> Add user
      email + password for the restaurant owner
      tick "Auto Confirm User"
4. Settings -> API -> copy "Project URL" and the "anon / publishable" key
5. Open  assets/js/yolo-config.js  and paste both values in. Save.

Only the PUBLIC anon key goes in that file, never the service_role secret.
Row level security is already set up: anyone can read the menu, only a
signed-in user can change it.


=============================================================================
STEP 2 — DEPLOY TO VERCEL
=============================================================================
1. vercel.com/new -> drag this whole folder in (or run `npx vercel --prod`)
   Framework preset: Other.  Build command: leave empty.
2. Check it on the yollo.vercel.app address first.
3. Project -> Settings -> Domains -> Add -> yollo.co.in (say yes to www too)
4. Vercel shows an A record value and a CNAME value. Copy THOSE EXACT VALUES
   into Hostinger -> Domains -> DNS / Nameservers -> Manage DNS records:

       Type    Name    Points to                     TTL
       A       @       <the IP Vercel shows>         14400
       CNAME   www     <the value Vercel shows>      14400

   Do NOT change the nameservers — leave horizon/orbit.dns-parking.com alone.
   DELETE any old A / AAAA / CNAME record on @ or www that points at
   Hostinger parking, or Vercel will say "Invalid Configuration".
   Leave MX and other TXT records alone.

SSL is issued automatically once the records resolve.


=============================================================================
STEP 3 — FILL IN THE REAL DETAILS
=============================================================================
Open /admin/, sign in, and go to "Restaurant details":

  Address      street, area, city, state, PIN, landmark
  On the map   Google Maps link + latitude / longitude
               (open Google Maps, right-click the restaurant,
                click the numbers at the top to copy them)
  Contact      phone, WhatsApp (format 919876543210), email
  Hours        opening and closing time

Then open "Google & SEO" and work down the checklist until it is all green.
Press Publish.

Still to do: 58 dishes show "Ask staff" because no rate was given. Add those
in the Menu tab.


=============================================================================
THE ADMIN PANEL
=============================================================================
Dashboard          counts, live open/closed, anything that needs attention
Menu               categories and dishes — add, edit, duplicate, move,
                   drag to reorder, search; single price, Half/Full, or
                   "Ask staff"; badges; photo per dish
Signature plates   which dishes appear in the reel on the home page
Google & SEO       live preview of your Google result, page title, meta
                   description, keywords, and a 12-point SEO checklist
Restaurant details name, address, map, contact, opening hours
Publish            send everything live, or download a site.json backup

Shortcuts: Ctrl+S publishes.  Esc closes a dialog or an open dish.
Nothing is live until you press Publish — the bar at the bottom tells you
when there are unpublished changes. Your draft survives a browser close.


=============================================================================
SEO — WHAT IS ALREADY DONE
=============================================================================
- Page title and meta description written for "Kathua / J&K / near Pathankot"
  and kept inside Google's length limits
- 22 local keywords generated from the town, state and landmark
- geo.region / geo.position meta tags (IN-JK)
- Full Restaurant structured data (schema.org) with the address, opening
  hours, coordinates, area served and ALL 141 menu items with prices
- FAQPage structured data backed by a real, visible FAQ section — this is
  what can win the expandable Q&A block in Google
- Open Graph + Twitter cards using the client's original banner, so the link
  looks right when shared on WhatsApp
- sitemap.xml with image entries, robots.txt keeping /admin/ out of Google
- The structured data is written into the file AND rebuilt live from the
  admin panel, so it never goes stale

After launch, two free things that matter more than anything else:
  1. Google Business Profile — create it, put this website link in it.
     That is what puts the restaurant on Google Maps.
  2. Google Search Console — add the site, submit sitemap.xml.


=============================================================================
DISH PHOTOS
=============================================================================
Each dish has a Photo box in the admin panel. Put either:
  - a Pexels photo number, e.g. 1639557   (free stock photo)
  - or a full image link, e.g. assets/dishes/paneer.jpg
For the restaurant's own photos, upload them into assets/dishes/ and write
that path in the Photo box.


=============================================================================
BRANDING
=============================================================================
The client's YOLO Eats logo is used in the header, loading screen, hero and
footer, and as the favicon and phone app icon.
  assets/logo.png          yellow mark, transparent background
  assets/logo-dark.png     black mark, for light or yellow backgrounds
  assets/brand-banner.jpg  the client's original full creative
  assets/og-image.jpg      what shows when the link is shared

The hero photograph is cropped from the client's banner so that only
vegetarian food is visible — the restaurant is advertised as 100% pure veg.
