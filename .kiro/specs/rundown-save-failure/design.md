# Rundown Save Failure Bugfix Design

## Overview

The rundown save feature fails silently because the backend requires an `urutan` field that the frontend doesn't provide. This causes Laravel's validation to fail and redirect back without saving data or displaying error messages to the user.

The fix removes the `urutan` validation requirement and implements automatic generation of sequential `urutan` values (1, 2, 3, ...) based on array index order in the backend. This ensures data consistency and eliminates the frontend's responsibility for managing sequence numbers.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when rundown data is submitted without the `urutan` field
- **Property (P)**: The desired behavior when C(X) holds - the system should auto-generate `urutan` values and save successfully
- **Preservation**: Existing validation, replace semantics, authorization, and success/error handling that must remain unchanged
- **upsert()**: The method in `app/Http/Controllers/RundownController.php` that replaces all rundown items for a session
- **Replace Semantics**: The behavior where all existing rundown items are deleted before inserting new ones (no partial updates)
- **urutan**: The sequence number column in the `rundown` table that determines display order

## Bug Details

### Bug Condition

The bug manifests when a user submits rundown data from the frontend that includes only `waktu` and `uraian_acara` fields. The `RundownController::upsert()` method validates the payload with `'rundown.*.urutan' => 'required|integer|min:1'`, but since the frontend doesn't include this field, validation fails and Laravel redirects back without saving or displaying error messages.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type Request (Laravel HTTP request)
  OUTPUT: boolean
  
  RETURN input.has('rundown') 
         AND input.get('rundown') is array
         AND for each item in input.get('rundown'):
             item has keys ['waktu', 'uraian_acara']
             AND NOT item.has('urutan')
END FUNCTION
```

### Examples

**Example 1: Adding 3 rundown items**
- **Input**: `rundown = [{waktu: "08:00", uraian_acara: "Pembukaan"}, {waktu: "09:00", uraian_acara: "Materi"}, {waktu: "10:00", uraian_acara: "Penutupan"}]`
- **Expected**: Save all 3 items with `urutan = 1, 2, 3`
- **Actual**: Validation fails, redirect back, no items saved

**Example 2: Deleting middle item then saving**
- **Input**: User has 3 items, deletes index 1 (middle), submits `rundown = [{waktu: "08:00", uraian_acara: "Pembukaan"}, {waktu: "10:00", uraian_acara: "Penutupan"}]`
- **Expected**: Save 2 items with `urutan = 1, 2` (renumbered sequentially)
- **Actual**: Validation fails, redirect back, old 3 items remain

**Example 3: Editing existing rundown**
- **Input**: User edits existing items and resubmits without `urutan` field
- **Expected**: Replace all items with new data, auto-generate `urutan = 1, 2, 3, ...`
- **Actual**: Validation fails, redirect back, old items remain unchanged

**Example 4: Empty rundown array (edge case)**
- **Input**: `rundown = []` (user cleared all items)
- **Expected**: Delete all existing rundown items successfully
- **Actual**: This scenario works (no validation error) because the array is empty

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Validation of `waktu` (must be HH:mm format) and `uraian_acara` (required string, max 255 chars) must continue to work
- Replace semantics (delete all old items before inserting new) must remain unchanged
- Authorization checks (only Pengurus, Ketua Pelaksana, or Divisi Acara can save) must remain enforced
- Success message "Rundown berhasil disimpan." must continue to display after successful save
- Empty array handling (clearing all rundown items) must continue to work
- Redirect back to the same page after save must continue

**Scope:**
All inputs that already work correctly (valid `waktu` and `uraian_acara` format, authorization, empty arrays) should be completely unaffected by this fix. The ONLY change is removing the `urutan` validation requirement and adding auto-generation logic.

## Hypothesized Root Cause

Based on the bug description and code inspection, the root cause is clear:

1. **Validation Mismatch**: The backend requires `'rundown.*.urutan' => 'required|integer|min:1'` but the frontend payload only includes `waktu` and `uraian_acara` fields.

2. **Silent Failure**: When Laravel validation fails, it redirects back with error messages stored in session. However, since the frontend doesn't check for or display these errors (or the error bag is not being rendered), users see no feedback.

3. **Design Assumption**: The original implementation assumed the frontend would manage sequence numbers, but this creates unnecessary coupling and error-prone behavior when users add/delete/reorder items.

4. **No Auto-Generation**: The backend doesn't auto-generate `urutan` values, requiring the frontend to calculate and maintain sequential ordering.

## Correctness Properties

Property 1: Bug Condition - Auto-Generate Urutan on Save

_For any_ HTTP request where the rundown array is submitted without `urutan` fields (only containing `waktu` and `uraian_acara`), the fixed `upsert()` method SHALL auto-generate sequential `urutan` values starting from 1 based on array index order and save all rundown items successfully to the database.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Validation and Behavior

_For any_ input where existing validation rules apply (`waktu` format, `uraian_acara` length, authorization), the fixed code SHALL produce exactly the same validation behavior, replace semantics, success messages, and redirects as the original code, preserving all existing functionality for valid/invalid inputs.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File**: `app/Http/Controllers/RundownController.php`

**Method**: `upsert()`

**Specific Changes**:

1. **Remove Urutan Validation Rule**: Delete the line `'rundown.*.urutan' => 'required|integer|min:1'` from the validation array.

2. **Update PHPDoc Type Annotation**: Change the `@param` annotation from:
   ```php
   @param  array{waktu: string, uraian_acara: string, urutan: int}[]  $rundown
   ```
   to:
   ```php
   @param  array{waktu: string, uraian_acara: string}[]  $rundown
   ```

3. **Reindex Array Before Loop**: After validation, use `array_values()` to reindex the array (ensuring keys are 0, 1, 2, ...) in case the frontend sends non-sequential keys:
   ```php
   $rundownData = array_values($validated['rundown']);
   ```

4. **Auto-Generate Urutan in Loop**: Modify the foreach loop to calculate `urutan` based on index:
   ```php
   foreach ($rundownData as $index => $item) {
       $sesi->rundown()->create([
           'waktu' => $item['waktu'],
           'uraian_acara' => $item['uraian_acara'],
           'urutan' => $index + 1,
       ]);
   }
   ```

5. **Preserve All Other Logic**: Keep the delete-then-insert pattern, the redirect with success message, and the validation for `waktu` and `uraian_acara`.

### Complete Fixed Method

```php
/**
 * PUT /{current_team}/pengurus/sesi/{sesi}/rundown
 * Replace seluruh rundown satu sesi sekaligus (upsert pattern)
 *
 * @param  array{waktu: string, uraian_acara: string}[]  $rundown
 */
public function upsert(Request $request, string $currentTeam, Sesi $sesi): RedirectResponse
{
    $validated = $request->validate([
        'rundown' => 'required|array',
        'rundown.*.waktu' => 'required|date_format:H:i',
        'rundown.*.uraian_acara' => 'required|string|max:255',
    ]);

    // Delete semua rundown lama dulu, lalu insert baru (replace semantics)
    $sesi->rundown()->delete();

    // Reindex array untuk memastikan urutan sequential 0, 1, 2, ...
    $rundownData = array_values($validated['rundown']);

    foreach ($rundownData as $index => $item) {
        $sesi->rundown()->create([
            'waktu' => $item['waktu'],
            'uraian_acara' => $item['uraian_acara'],
            'urutan' => $index + 1,
        ]);
    }

    return redirect()
        ->back()
        ->with('success', 'Rundown berhasil disimpan.');
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (validation failures), then verify the fix works correctly (auto-generation) and preserves existing behavior (validation, replace semantics, authorization).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the validation failure is the root cause.

**Test Plan**: Write feature tests that submit rundown data without `urutan` fields to the unfixed `RundownController::upsert()` method. Assert that the validation fails and no rundown items are saved. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Submit 3 items without urutan**: POST rundown array with 3 items (only `waktu`, `uraian_acara`) - will fail validation on unfixed code
2. **Submit after deleting middle item**: Submit 2 items after user deletes index 1 from a 3-item list - will fail validation on unfixed code
3. **Edit existing rundown without urutan**: Update existing items and resubmit without `urutan` - will fail validation on unfixed code
4. **Empty array edge case**: Submit empty rundown array - should pass even on unfixed code (no validation error)

**Expected Counterexamples**:
- Validation error on `rundown.*.urutan` field: "The rundown.0.urutan field is required."
- No rundown items saved to database (count remains 0 or unchanged)
- Redirect back without success message

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (no `urutan` field), the fixed function produces the expected behavior (auto-generates `urutan` and saves successfully).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := RundownController::upsert_fixed(input)
  ASSERT result redirects with success message
  ASSERT all rundown items saved to database
  ASSERT urutan values are sequential (1, 2, 3, ...)
  ASSERT urutan order matches array index order
END FOR
```

**Testing Approach**: Unit and feature tests that submit various rundown payloads without `urutan` and assert:
- No validation errors
- All items saved with correct `waktu`, `uraian_acara`
- `urutan` values are auto-generated as 1, 2, 3, ...
- Items retrieved in correct order (ordered by `urutan`)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (inputs that already work correctly), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT RundownController::upsert_original(input) = RundownController::upsert_fixed(input)
END FOR
```

**Testing Approach**: Feature tests that verify existing behavior is unchanged:

**Test Plan**: Use existing tests in `KegiatanStoreWithRundownTest.php` as baseline behavior, then write new preservation tests for the standalone rundown endpoint.

**Test Cases**:
1. **Invalid waktu format preservation**: Submit rundown with `waktu = "25:00"` - should fail validation with same error message
2. **Missing uraian_acara preservation**: Submit rundown without `uraian_acara` - should fail validation
3. **Uraian_acara > 255 chars preservation**: Submit rundown with 256-char string - should fail validation
4. **Authorization preservation**: Submit as unauthorized user (anggota without divisi_acara role) - should return 403
5. **Replace semantics preservation**: Save 3 items, then save 2 items - should delete old 3 and save new 2
6. **Empty array preservation**: Submit empty array - should delete all existing rundown items
7. **Success message preservation**: Successful save should show "Rundown berhasil disimpan."

### Unit Tests

**File**: `tests/Feature/RundownTest.php` (new file to create)

- Test auto-generation of `urutan` for 1, 3, 5, 10 items
- Test that `urutan` matches array index order (item at index 0 gets urutan=1, etc.)
- Test reindexing with `array_values()` handles non-sequential array keys
- Test delete-then-insert pattern (replace semantics) still works
- Test validation errors for invalid `waktu` format
- Test validation errors for missing/empty `uraian_acara`
- Test validation errors for `uraian_acara` > 255 characters
- Test authorization: Pengurus can save
- Test authorization: Ketua Pelaksana can save for their kegiatan
- Test authorization: Divisi Acara can save for their kegiatan
- Test authorization: Regular anggota cannot save (403)

### Property-Based Tests

Property-based testing is NOT recommended for this bugfix because:
- The input domain is simple (array of objects with 2 string fields)
- The transformation is deterministic (array index → urutan = index + 1)
- Unit tests with specific examples (1, 3, 5, 10 items) provide sufficient coverage
- The bug is a validation issue, not a complex algorithmic problem

However, if PBT is desired:
- Generate random arrays of rundown items (varying lengths: 0-20 items)
- Generate random valid `waktu` values (00:00 to 23:59)
- Generate random valid `uraian_acara` strings (1-255 chars)
- Assert that all items save with sequential `urutan` (1, 2, ..., N)
- Assert that `urutan` values match array order

### Integration Tests

**File**: `tests/Feature/RundownTest.php`

- Test full flow: Pengurus creates kegiatan → creates sesi → saves rundown without `urutan` → rundown displays in correct order
- Test full flow: User adds 3 items → deletes middle item → saves → verify only 2 items saved with urutan 1, 2
- Test full flow: User edits existing rundown → saves → verify old items deleted and new items saved
- Test full flow: User saves empty array → verify all items deleted
- Test cross-kegiatan isolation: Ketua Pelaksana of Kegiatan A cannot save rundown for Kegiatan B (403)
- Test that frontend `/rundown` page displays items in correct order after save
