# Bugfix Requirements Document

## Introduction

The rundown save feature at `/rundown` fails to persist data to the database despite showing no error to the user. This occurs because the backend controller validates the `urutan` field as required, but the frontend does not include this field in the submission payload. The validation fails silently (Laravel redirects back without saving), leaving users unaware that their data was not saved.

This bugfix will modify the backend to auto-generate the `urutan` field based on array index order, eliminating the dependency on the frontend to provide this field and ensuring data consistency.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits rundown data without the `urutan` field THEN the system fails validation silently and does not save any rundown items to the database

1.2 WHEN a user adds multiple rundown rows and clicks "Simpan Rundown" THEN the system returns to the page without error messages but the rundown items are not persisted

1.3 WHEN the validation rule `'rundown.*.urutan' => 'required|integer|min:1'` is evaluated against frontend payload containing only `waktu` and `uraian_acara` THEN the validation fails and the request is redirected back

### Expected Behavior (Correct)

2.1 WHEN a user submits rundown data without the `urutan` field THEN the system SHALL auto-generate `urutan` values based on array index (starting from 1) and save all rundown items successfully

2.2 WHEN a user adds 3 rundown rows with `waktu` and `uraian_acara` values and clicks "Simpan Rundown" THEN the system SHALL save all 3 rows with `urutan` values of 1, 2, and 3 respectively

2.3 WHEN a user deletes a middle row (e.g., index 1 in a 3-row list) and saves THEN the system SHALL save the remaining rows with renumbered `urutan` values (1, 2) maintaining sequential order

2.4 WHEN the validation evaluates the rundown payload THEN the system SHALL NOT require the `urutan` field and SHALL accept payloads containing only `waktu` and `uraian_acara`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user submits rundown data with valid `waktu` (HH:mm format) and `uraian_acara` (string, max 255 chars) THEN the system SHALL CONTINUE TO validate these fields correctly

3.2 WHEN a user has existing saved rundown items for a session THEN the system SHALL CONTINUE TO delete all old rundown items before inserting new ones (replace semantics)

3.3 WHEN a user edits existing rundown items and resubmits THEN the system SHALL CONTINUE TO replace all items with the new submission without preserving partial data

3.4 WHEN the save operation completes successfully THEN the system SHALL CONTINUE TO redirect back with a success message "Rundown berhasil disimpan."

3.5 WHEN the frontend sends an empty `rundown` array THEN the system SHALL CONTINUE TO accept it and delete all existing rundown items (clearing the rundown)

3.6 WHEN authorization checks are performed THEN the system SHALL CONTINUE TO enforce that only users with appropriate permissions (Pengurus, Ketua Pelaksana, or Divisi Acara) can save rundown data
