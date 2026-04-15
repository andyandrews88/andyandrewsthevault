

## Plan: Move "My Coaching" to Its Own Section

Currently, "My Coaching" (PrivateCoachingPanel) is embedded as a collapsible section inside the Home dashboard. The user wants it as a standalone tab/section accessible from the "More" menu — matching the reference app screenshot where "My Coaching" has its own full page with a back button.

### Changes

**1. `src/components/dashboard/VaultDashboard.tsx`** — Remove coaching from dashboard
- Remove `"coaching"` from `DEFAULT_ORDER` and `PRIMARY_SECTIONS`
- Remove the coaching entry from `SECTION_META` and `SECTION_COMPONENTS`
- Remove the `PrivateCoachingPanel` import

**2. `src/lib/navigationConstants.ts`** — Add My Coaching to More menu
- Add `Briefcase` (or similar) icon import
- Add a new entry to `MORE_MENU_ITEMS` in the Training group:
  ```
  { id: "coaching", label: "My Coaching", icon: Briefcase, tabId: "coaching", group: "Training" }
  ```

**3. `src/pages/Vault.tsx`** — Add coaching as a tab content
- Import `PrivateCoachingPanel`
- Add a `TabsContent` block for `activeTab === "coaching"` that renders the panel as a full-page section (with a header like "MY COACHING" and subtitle "Your programme, sessions & billing" — matching the reference screenshot)

### Result
- Home dashboard becomes cleaner with only Snapshot, Training Suggestion, and secondary sections
- "My Coaching" gets its own dedicated full-screen section accessible via More → My Coaching
- The coaching panel content stays exactly the same — just lives in its own tab now

