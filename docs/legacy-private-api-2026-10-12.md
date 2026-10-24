# Legacy private response API protection

Migration 0082 adds a read guard to experience_responses and experience_response_versions while retaining existing account and enrollment authorization. Owners retain access. Professionals cannot read mixed legacy records containing private_text or a sharing flag without explicit boolean true. Snapshot reads also respect the current response sharing flag. No content is removed or rewritten.

Independent authenticated fixtures passed 27 scenarios on official PocketBase 0.26.1 and 0.36.0, including 8 new read/privacy checks (owner, direct professional fetch, list, archives, consent and withdrawal). Loopback only, no real records consulted or changed.

This is containment, not separate-field storage: the entire mixed record is inaccessible to professionals while unshared, including its category. Separate private storage and accurate legacy UI copy remain necessary. Other generic text without legacy privacy markers is outside this guard. Infrastructure administrators retain platform access; this is not encryption against administrators. Install only after managed-server rule preflight and reversible configuration snapshot; no production publication. Managed backup/restoration remains unconfirmed.
