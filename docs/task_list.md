Task List:

Manage Collection
User Story 1:

As a collector, I want to add records to my collection so that I can track what I own and avoid duplicates.
Tasks:

 Design and implement “Add Record” form (title, artist, pressing, condition, notes).

 Create backend endpoint for POST /records.

 Set up database schema for records table (include user_id, artist, title, year, notes).

 Add duplicate-check logic (same title + artist combination).

 Add success/failure notifications on record submission.

 User Story 2:

As a collector, I want to edit record details so that my catalog stays accurate and up to date.
Tasks:

 Implement “Edit Record” modal or detail page.

 Create backend endpoint for PUT /records/:id.

 Add record detail validation (e.g., year as integer, required fields).

 Update frontend list after successful edit (without full page reload).

 User Story 3:

As a collector, I want to log record condition and cleaning notes so that I can monitor sleeve wear and plan maintenance.
Tasks:

 Add condition fields (media_condition, sleeve_condition).

 Create maintenance notes section with timestamps.

 Implement “last cleaned” and “last updated” metadata.

 Add sorting/filtering by condition or maintenance date.

 User Story 4:

As a collector, I want to search within my collection so that I can quickly find a specific record or artist.
Tasks:

 Implement frontend search bar with debounce.

 Create backend search endpoint (GET /records?query=).

 Add fuzzy search support (e.g., partial artist name match).

 Display results dynamically without reloading the full catalog.

 User Story 5:

As a collector, I want to add albums to my wish list so that I remember which ones to look for later.
Tasks:

 Create wishlist table linked to user ID.

 Build “Add to Wish List” button from search or Discogs results.

 Implement “Mark as Found/Purchased” toggle.

 Display wish list items separately with album art and source link.