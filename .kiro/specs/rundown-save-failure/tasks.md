# Implementation Plan: Rundown Save Failure Bugfix

## Overview

This bugfix addresses the silent failure when saving rundown data. The backend requires an `urutan` field that the frontend doesn't provide, causing validation failures. The fix removes the `urutan` validation requirement and implements automatic generation of sequential values based on array index order.

---

## Tasks

- [x] 1. Write bug condition exploration test (BEFORE implementing fix)
  - **Property 1: Bug Condition** - Validation Failure Without Urutan Field
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate validation failures on unfixed code
  - **Scoped PBT Approach**: Test with concrete cases (1, 3, 5 items) to ensure reproducibility
  - Test that submitting rundown array without `urutan` field causes validation error
  - Test case 1: Submit 3 items with only `waktu` and `uraian_acara` fields
  - Test case 2: Submit 1 item without `urutan` field
  - Test case 3: Submit 5 items after deleting middle items from original list
  - Run tests on UNFIXED `RundownController::upsert()` method
  - **EXPECTED OUTCOME**: Tests FAIL with validation error "The rundown.*.urutan field is required."
  - Document counterexamples: validation error messages, no items saved to database
  - Mark task complete when tests are written, run on unfixed code, and failures are documented
  - _Bug_Condition: isBugCondition(input) where input has rundown array without 'urutan' field_
  - _Expected_Behavior: Auto-generate sequential urutan values (1, 2, 3, ...) based on array index_
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Validation and Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (inputs with proper validation, authorization, etc.)
  - Write tests capturing observed behavior patterns from Preservation Requirements in design
  - Test case 1: Invalid `waktu` format (e.g., "25:00") - should fail validation
  - Test case 2: Missing `uraian_acara` field - should fail validation
  - Test case 3: `uraian_acara` exceeds 255 characters - should fail validation
  - Test case 4: Unauthorized user (anggota without divisi_acara role) - should return 403
  - Test case 5: Replace semantics - save 3 items, then save 2 items, verify old items deleted
  - Test case 6: Empty array - should delete all existing rundown items successfully
  - Test case 7: Success message - verify "Rundown berhasil disimpan." displayed after save
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run on unfixed code, and passing
  - _Preservation: Validation rules, replace semantics, authorization, success messages from design_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix rundown save failure

  - [x] 3.1 Update `RundownController::upsert()` method
    - Remove validation rule: `'rundown.*.urutan' => 'required|integer|min:1'`
    - Update PHPDoc type annotation from `array{waktu: string, uraian_acara: string, urutan: int}[]` to `array{waktu: string, uraian_acara: string}[]`
    - Add `$rundownData = array_values($validated['rundown']);` after validation to reindex array
    - Modify foreach loop to auto-generate `urutan` based on array index: `'urutan' => $index + 1`
    - Preserve all other logic: delete-then-insert pattern, validation for `waktu` and `uraian_acara`, redirect with success message
    - File: `app/Http/Controllers/RundownController.php`
    - _Bug_Condition: isBugCondition(input) where input.rundown array lacks 'urutan' field_
    - _Expected_Behavior: Auto-generate sequential urutan (1, 2, 3, ...) based on array index order_
    - _Preservation: Keep waktu/uraian_acara validation, replace semantics, authorization, success messages_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Auto-Generate Urutan Successfully
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the bug is fixed
    - Run bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms validation no longer fails, items save with auto-generated urutan)
    - Verify test case 1: 3 items saved with urutan = 1, 2, 3
    - Verify test case 2: 1 item saved with urutan = 1
    - Verify test case 3: 5 items saved with urutan = 1, 2, 3, 4, 5
    - _Requirements: Expected Behavior Properties 2.1, 2.2, 2.3, 2.4 from design_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify test case 1: Invalid waktu format still fails validation
    - Verify test case 2: Missing uraian_acara still fails validation
    - Verify test case 3: Uraian_acara > 255 chars still fails validation
    - Verify test case 4: Unauthorized user still gets 403
    - Verify test case 5: Replace semantics still works (old items deleted before new ones inserted)
    - Verify test case 6: Empty array still deletes all items
    - Verify test case 7: Success message still displayed
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `php artisan test --filter RundownTest`
  - Verify all bug condition tests pass (auto-generation works for 1, 3, 5 items)
  - Verify all preservation tests pass (validation, authorization, replace semantics unchanged)
  - Ensure no regressions in other parts of the application
  - If any issues arise, ask the user for clarification before proceeding

---

## Success Criteria

- ✅ Bug condition exploration test fails on unfixed code (confirms bug exists)
- ✅ Preservation tests pass on unfixed code (confirms baseline behavior)
- ✅ After fix: bug condition test passes (confirms auto-generation works)
- ✅ After fix: preservation tests still pass (confirms no regressions)
- ✅ All rundown items save successfully without frontend providing `urutan` field
- ✅ Sequential `urutan` values (1, 2, 3, ...) auto-generated based on array index order
- ✅ Existing validation, authorization, and replace semantics preserved

## Files Modified

- `app/Http/Controllers/RundownController.php` - Update `upsert()` method

## Files Created

- `tests/Feature/RundownTest.php` - Comprehensive test suite for bug condition and preservation
